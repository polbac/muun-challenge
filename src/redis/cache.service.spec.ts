import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import Redis from 'ioredis';

describe('CacheService', () => {
  let service: CacheService;
  let redis: Redis;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    flushdb: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redis = module.get<Redis>('REDIS_CLIENT');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect((service as any).redis).toBeDefined();
    expect((service as any).logger).toBeDefined();
    expect((service as any).TTL).toBe(7200);
  });

  it('should be instantiated manually', () => {
    const s = new CacheService(mockRedis as any);
    expect(s).toBeDefined();
  });

  describe('getBlockedIp', () => {
    it('should return true if value is 1', async () => {
      mockRedis.get.mockResolvedValue('1');
      const result = await service.getBlockedIp('1.2.3.4');
      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith('blocked:1.2.3.4');
    });

    it('should return false if value is 0 or other', async () => {
      mockRedis.get.mockResolvedValue('0');
      const result = await service.getBlockedIp('1.2.3.4');
      expect(result).toBe(false);
    });

    it('should return null if value is null', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await service.getBlockedIp('1.2.3.4');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'));
      const result = await service.getBlockedIp('1.2.3.4');
      expect(result).toBeNull();
    });
  });

  describe('setBlockedIp', () => {
    it('should set 1 for blocked', async () => {
      await service.setBlockedIp('1.2.3.4', true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'blocked:1.2.3.4',
        '1',
        'EX',
        expect.any(Number),
      );
    });

    it('should set 0 for not blocked', async () => {
      await service.setBlockedIp('1.2.3.4', false);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'blocked:1.2.3.4',
        '0',
        'EX',
        expect.any(Number),
      );
    });

    it('should handle error when setting key', async () => {
      const error = new Error('Redis set error');
      mockRedis.set.mockRejectedValue(error);
      // Should not throw
      await service.setBlockedIp('1.2.3.4', true);
      // Verify method was called
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('flush', () => {
    it('should flush db', async () => {
      await service.flush();
      expect(mockRedis.flushdb).toHaveBeenCalled();
    });

    it('should handle error when flushing', async () => {
      const error = new Error('Redis flush error');
      mockRedis.flushdb.mockRejectedValue(error);
      await expect(service.flush()).rejects.toThrow(error);
    });
  });
});
