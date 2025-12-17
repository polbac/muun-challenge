import { Test, TestingModule } from '@nestjs/testing';
import { IngestService } from './ingest.service';
import { DataSource } from 'typeorm';
import { CacheService } from '../redis/cache.service';

describe('IngestService', () => {
  let service: IngestService;
  let dataSource: DataSource;
  let cacheService: CacheService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockCacheService = {
    flush: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks specifically implementations
    mockQueryRunner.query.mockResolvedValue([]);
    mockQueryRunner.connect.mockResolvedValue(undefined);
    mockQueryRunner.startTransaction.mockResolvedValue(undefined);
    mockQueryRunner.commitTransaction.mockResolvedValue(undefined);
    mockQueryRunner.rollbackTransaction.mockResolvedValue(undefined);
    mockQueryRunner.release.mockResolvedValue(undefined);

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

    // Insertion
    expect(mockQueryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ips_temp'),
      ips,
    );

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
    // Loop not entered, so no INSERT
    expect(mockQueryRunner.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ips_temp'),
      expect.anything(),
    );
  });

  it('should handle large batches', async () => {
    // 1001 IPs to force 2 batches
    const largeList = Array(1001).fill('1.1.1.1');
    await service.ingestIps(largeList);

    // Should interpret INSERT twice
    // 2 calls to INSERT
    const insertCalls = mockQueryRunner.query.mock.calls.filter((call) =>
      call[0].includes('INSERT INTO ips_temp'),
    );
    expect(insertCalls.length).toBe(2);
  });
});
