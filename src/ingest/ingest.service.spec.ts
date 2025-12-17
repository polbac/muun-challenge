import { Test, TestingModule } from '@nestjs/testing';
import { IngestService } from './ingest.service';
import { DataSource } from 'typeorm';
import { CacheService } from '../redis/cache.service';

describe('IngestService', () => {
  let service: IngestService;
  let dataSource: DataSource;
  let cacheService: CacheService;

  const mockCopyStream = {
    on: jest.fn(),
    once: jest.fn(),
    write: jest.fn().mockReturnValue(true),
    end: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
  };

  const mockClient = {
    query: jest.fn().mockReturnValue(mockCopyStream),
    release: jest.fn(),
  };

  const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
    connection: {
      driver: {
        master: mockPool,
      },
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockCacheService = {
    flush: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks
    mockQueryRunner.query.mockResolvedValue([]);
    mockQueryRunner.connect.mockResolvedValue(undefined);
    mockQueryRunner.startTransaction.mockResolvedValue(undefined);
    mockQueryRunner.commitTransaction.mockResolvedValue(undefined);
    mockQueryRunner.rollbackTransaction.mockResolvedValue(undefined);
    mockQueryRunner.release.mockResolvedValue(undefined);
    mockClient.release.mockResolvedValue(undefined);
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockReturnValue(mockCopyStream);

    // Setup COPY stream to emit finish event
    let finishHandler: (() => void) | null = null;
    mockCopyStream.on.mockImplementation((event, handler) => {
      if (event === 'finish') {
        finishHandler = handler;
      }
      return mockCopyStream;
    });

    // Simulate stream finishing after write
    mockCopyStream.end.mockImplementation(() => {
      if (finishHandler) {
        setTimeout(() => finishHandler(), 0);
      }
      return mockCopyStream;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
    dataSource = module.get<DataSource>(DataSource);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ingest IPs successfully', async () => {
    const ips = ['1.1.1.1', '2.2.2.2'];
    await service.ingestIps(ips);

    // Verify flow
    expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
    expect(mockQueryRunner.connect).toHaveBeenCalled();

    // Temp table creation
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE ips_temp'),
    );

    // COPY operation
    expect(mockPool.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'COPY ips_temp (ip) FROM STDIN',
      }),
    );
    expect(mockClient.release).toHaveBeenCalled();

    // Table swap
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('DROP TABLE ips'),
    );
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('RENAME TO ips'),
    );
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();

    // Cache flush
    expect(cacheService.flush).toHaveBeenCalled();

    // Cleanup
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('DROP TABLE IF EXISTS ips_temp'),
    );
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should rollback transaction on failure during swap', async () => {
    // We want to force a failure specifically during the swap phase, which is inside the transaction.
    // Queries before transaction: DROP, CREATE, INSERT.
    // Transaction starts.
    // Queries inside: ALTER SEQUENCE (maybe), DROP, ALTER TABLE.

    let callCount = 0;
    mockQueryRunner.query.mockImplementation(async (q) => {
      callCount++;
      // Fail on the DROP TABLE ips (inside transaction)
      if (q.includes('DROP TABLE ips') && !q.includes('ips_temp')) {
        throw new Error('Swap failed');
      }
      return [];
    });

    await expect(service.ingestIps(['1.1.1.1'])).rejects.toThrow('Swap failed');

    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should warn but proceed if detaching sequence fails', async () => {
    mockQueryRunner.query.mockImplementation(async (q) => {
      if (q.includes('OWNED BY NONE')) {
        throw new Error('Detach failed');
      }
      return [];
    });

    await service.ingestIps(['1.1.1.1']);

    // Should complete successfully despite error
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(cacheService.flush).toHaveBeenCalled();
  });

  it('should warn but proceed if reattaching sequence fails', async () => {
    mockQueryRunner.query.mockImplementation(async (q) => {
      if (q.includes('OWNED BY ips.id')) {
        throw new Error('Reattach failed');
      }
      return [];
    });

    await service.ingestIps(['1.1.1.1']);

    // Should complete successfully despite error
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(cacheService.flush).toHaveBeenCalled();
  });

  it('should proceed silently if cleanup fails', async () => {
    // Force cleanup to fail
    let callCount = 0;
    mockQueryRunner.query.mockImplementation(async (q) => {
      if (q.includes('DROP TABLE IF EXISTS ips_temp') && ++callCount > 1) {
        // The second drop table (in finally)
        throw new Error('Cleanup failed');
      }
      return [];
    });

    await service.ingestIps(['1.1.1.1']);

    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should handle empty IP list', async () => {
    await service.ingestIps([]);
    // Should create and swap empty temp table
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE ips_temp'),
    );
    // COPY should still be called, just with empty data
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'COPY ips_temp (ip) FROM STDIN',
      }),
    );
  });

  it('should handle large datasets efficiently with COPY', async () => {
    // Large dataset to verify COPY handles it in one operation
    const largeList = Array(10000).fill('1.1.1.1');
    await service.ingestIps(largeList);

    // Should use COPY once regardless of size
    expect(mockClient.query).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'COPY ips_temp (ip) FROM STDIN',
      }),
    );
  });

  it('should handle error during client connection', async () => {
    mockPool.connect.mockRejectedValue(new Error('Connection failed'));

    await expect(service.ingestIps(['1.1.1.1'])).rejects.toThrow(
      'Connection failed',
    );
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should handle error during COPY stream', async () => {
    const copyError = new Error('COPY stream error');
    let errorHandler: ((err: Error) => void) | null = null;

    mockCopyStream.on.mockImplementation((event, handler) => {
      if (event === 'error') {
        errorHandler = handler;
      }
      return mockCopyStream;
    });

    // Simulate error after stream starts
    mockCopyStream.end.mockImplementation(() => {
      if (errorHandler) {
        setTimeout(() => errorHandler(copyError), 0);
      }
      return mockCopyStream;
    });

    await expect(service.ingestIps(['1.1.1.1'])).rejects.toThrow(
      'COPY stream error',
    );
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should handle error during initial query', async () => {
    // Reset mocks
    jest.clearAllMocks();
    mockQueryRunner.query.mockRejectedValueOnce(new Error('Query failed'));

    await expect(service.ingestIps(['1.1.1.1'])).rejects.toThrow(
      'Query failed',
    );
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
