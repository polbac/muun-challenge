import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

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

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: mockTypeOrmHealthIndicator },
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
