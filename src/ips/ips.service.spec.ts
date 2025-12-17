import { Test, TestingModule } from '@nestjs/testing';
import { IpsService } from './ips.service';
import { IpsRepository } from './ips.repository';
import { CacheService } from '../redis/cache.service';
import { Ip } from './ip.entity';

describe('IpsService', () => {
  let service: IpsService;
  let repository: IpsRepository;
  let cacheService: CacheService;

  const mockRepository = {
    findByIp: jest.fn(),
  };

  const mockCacheService = {
    getBlockedIp: jest.fn(),
    setBlockedIp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpsService,
        { provide: IpsRepository, useValue: mockRepository },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<IpsService>(IpsService);
    repository = module.get<IpsRepository>(IpsRepository);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect((service as any).ipsRepository).toBeDefined();
    expect((service as any).cacheService).toBeDefined();
  });

  it('should be instantiated manually', () => {
    const s = new IpsService(mockRepository as any, mockCacheService as any);
    expect(s).toBeDefined();
  });

  describe('findOne', () => {
    it('should return IP from cache if present (blocked)', async () => {
      mockCacheService.getBlockedIp.mockResolvedValue(true);
      const result = await service.findOne('1.2.3.4');
      expect(result).toEqual({ ip: '1.2.3.4' });
      expect(repository.findByIp).not.toHaveBeenCalled();
    });

    it('should return null from cache if present (not blocked)', async () => {
      mockCacheService.getBlockedIp.mockResolvedValue(false);
      const result = await service.findOne('1.2.3.4');
      expect(result).toBeNull();
      expect(repository.findByIp).not.toHaveBeenCalled();
    });

    it('should check DB if cache miss, and update cache (found)', async () => {
      mockCacheService.getBlockedIp.mockResolvedValue(null);
      const ipEntity = { ip: '1.2.3.4' } as Ip;
      mockRepository.findByIp.mockResolvedValue(ipEntity);

      const result = await service.findOne('1.2.3.4');
      expect(result).toEqual(ipEntity);
      expect(repository.findByIp).toHaveBeenCalledWith('1.2.3.4');
      expect(cacheService.setBlockedIp).toHaveBeenCalledWith('1.2.3.4', true);
    });

    it('should check DB if cache miss, and update cache (not found)', async () => {
      mockCacheService.getBlockedIp.mockResolvedValue(null);
      mockRepository.findByIp.mockResolvedValue(null);

      const result = await service.findOne('1.2.3.4');
      expect(result).toBeNull();
      expect(repository.findByIp).toHaveBeenCalledWith('1.2.3.4');
      expect(cacheService.setBlockedIp).toHaveBeenCalledWith('1.2.3.4', false);
    });
  });
});
