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

  describe('root', () => {
    it('should return health check result', async () => {
      const result = await appController.check();
      expect(result).toEqual({ status: 'ok' });
      expect(mockHealthCheckService.check).toHaveBeenCalled();
    });
  });
});
