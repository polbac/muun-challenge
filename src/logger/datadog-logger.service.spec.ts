import { Test, TestingModule } from '@nestjs/testing';
import { DatadogLogger } from './datadog-logger.service';
import { ConfigService } from '@nestjs/config';

describe('DatadogLogger', () => {
    let logger: DatadogLogger;
    let configService: ConfigService;

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DatadogLogger,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        logger = module.get<DatadogLogger>(DatadogLogger);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(logger).toBeDefined();
    });

    describe('when DD_API_KEY is not set', () => {
        beforeEach(() => {
            mockConfigService.get.mockReturnValue(undefined);
        });

        it('should log to console only', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            logger.log('test message', 'TestContext');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle errors', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            logger.error('error message', 'stack trace', 'TestContext');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle warnings', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            logger.warn('warning message', 'TestContext');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle debug messages', () => {
            const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

            logger.debug('debug message', 'TestContext');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle verbose messages', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            logger.verbose('verbose message', 'TestContext');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
