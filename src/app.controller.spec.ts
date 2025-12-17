import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;

  const mockHealthCheckService = {
    check: jest.fn().mockImplementation((checks) => {
      // Execute the checks to ensure coverage of the callback
      checks.forEach((check) => check());
      return { status: 'ok' };
    }),
  };

  const mockTypeOrmHealthIndicator = {
    pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
  };

  const mockMicroserviceHealthIndicator = {
    pingCheck: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('localhost'),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
        {
          provide: MicroserviceHealthIndicator,
          useValue: mockMicroserviceHealthIndicator,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
    expect((appController as any).health).toBeDefined();
    expect((appController as any).db).toBeDefined();
    expect((appController as any).microservice).toBeDefined();
    expect((appController as any).config).toBeDefined();
  });

  it('should be instantiated manually', () => {
    const c = new AppController(
      mockHealthCheckService as any,
      mockTypeOrmHealthIndicator as any,
      mockMicroserviceHealthIndicator as any,
      mockConfigService as any,
    );
    expect(c).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const result = await appController.check();
      expect(result).toEqual({ status: 'ok' });
      expect(mockHealthCheckService.check).toHaveBeenCalled();
      expect(mockTypeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'database',
      );
      expect(mockMicroserviceHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'redis',
        {
          transport: expect.any(Number),
          options: {
            host: 'localhost',
            port: 'localhost',
          },
        },
      );
    });

    it('should use config values for redis connection', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'REDIS_HOST') return 'redis-host';
        if (key === 'REDIS_PORT') return 6379;
        return undefined;
      });

      await appController.check();

      expect(mockMicroserviceHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'redis',
        {
          transport: expect.any(Number),
          options: {
            host: 'redis-host',
            port: 6379,
          },
        },
      );
    });
  });
});
