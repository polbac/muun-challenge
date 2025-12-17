import { Test, TestingModule } from '@nestjs/testing';
import { DatadogLogger } from './datadog-logger.service';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const mockTransport = {
    Console: jest.fn(),
    Http: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn((...args) => args),
      timestamp: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
    },
    transports: mockTransport,
    Logger: jest.fn(),
  };
});

describe('DatadogLogger', () => {
  let service: DatadogLogger;
  let configService: ConfigService;
  let mockWinstonLogger: any;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mock logger instance
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatadogLogger,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DatadogLogger>(DatadogLogger);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create logger with console transport when DD_API_KEY is not set', async () => {
      const testConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'DD_API_KEY') return undefined;
          return undefined;
        }),
      };

      jest.clearAllMocks();
      (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DatadogLogger,
          { provide: ConfigService, useValue: testConfigService },
        ],
      }).compile();

      const testService = module.get<DatadogLogger>(DatadogLogger);
      expect(testService).toBeDefined();
      expect(winston.createLogger).toHaveBeenCalled();
      const callArgs = (winston.createLogger as jest.Mock).mock.calls[0][0];
      expect(callArgs.transports).toHaveLength(1);
    });

    it('should create logger with Datadog HTTP transport when DD_API_KEY is set', async () => {
      const testConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'DD_API_KEY') return 'test-api-key';
          if (key === 'DD_SITE') return 'datadoghq.eu';
          if (key === 'DD_SERVICE') return 'test-service';
          if (key === 'DD_ENV') return 'test-env';
          return undefined;
        }),
      };

      jest.clearAllMocks();
      (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DatadogLogger,
          { provide: ConfigService, useValue: testConfigService },
        ],
      }).compile();

      const testService = module.get<DatadogLogger>(DatadogLogger);
      expect(testService).toBeDefined();
      expect(winston.createLogger).toHaveBeenCalled();
      const callArgs = (winston.createLogger as jest.Mock).mock.calls[0][0];
      expect(callArgs.transports.length).toBeGreaterThan(1);
    });

    it('should use default values when DD_SERVICE and DD_ENV are not set', async () => {
      const testConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'DD_API_KEY') return 'test-api-key';
          return undefined;
        }),
      };

      jest.clearAllMocks();
      (winston.createLogger as jest.Mock).mockReturnValue(mockWinstonLogger);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DatadogLogger,
          { provide: ConfigService, useValue: testConfigService },
        ],
      }).compile();

      const testService = module.get<DatadogLogger>(DatadogLogger);
      expect(testService).toBeDefined();
      expect(winston.createLogger).toHaveBeenCalled();
      const callArgs = (winston.createLogger as jest.Mock).mock.calls[0][0];
      expect(callArgs.defaultMeta.service).toBe('muun-challenge');
      expect(callArgs.defaultMeta.env).toBe('development');
    });
  });

  describe('log', () => {
    it('should log string message', () => {
      service.log('test message', 'TestContext');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('test message', {
        context: 'TestContext',
      });
    });

    it('should log object message', () => {
      const message = { key: 'value', data: 123 };
      service.log(message, 'TestContext');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith({
        ...message,
        context: 'TestContext',
      });
    });

    it('should log without context', () => {
      service.log('test message');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('test message', {
        context: undefined,
      });
    });
  });

  describe('error', () => {
    it('should log error with string message', () => {
      service.error('error message', 'stack trace', 'TestContext');
      expect(mockWinstonLogger.error).toHaveBeenCalledWith('error message', {
        trace: 'stack trace',
        context: 'TestContext',
      });
    });

    it('should log error with object message', () => {
      const message = { error: 'something went wrong', code: 500 };
      service.error(message, 'stack trace', 'TestContext');
      expect(mockWinstonLogger.error).toHaveBeenCalledWith({
        ...message,
        trace: 'stack trace',
        context: 'TestContext',
      });
    });

    it('should log error without trace and context', () => {
      service.error('error message');
      expect(mockWinstonLogger.error).toHaveBeenCalledWith('error message', {
        trace: undefined,
        context: undefined,
      });
    });
  });

  describe('warn', () => {
    it('should log warning with string message', () => {
      service.warn('warning message', 'TestContext');
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('warning message', {
        context: 'TestContext',
      });
    });

    it('should log warning with object message', () => {
      const message = { warning: 'something', level: 'high' };
      service.warn(message, 'TestContext');
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith({
        ...message,
        context: 'TestContext',
      });
    });
  });

  describe('debug', () => {
    it('should log debug with string message', () => {
      service.debug('debug message', 'TestContext');
      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('debug message', {
        context: 'TestContext',
      });
    });

    it('should log debug with object message', () => {
      const message = { debug: 'info', data: { x: 1 } };
      service.debug(message, 'TestContext');
      expect(mockWinstonLogger.debug).toHaveBeenCalledWith({
        ...message,
        context: 'TestContext',
      });
    });
  });

  describe('verbose', () => {
    it('should log verbose with string message', () => {
      service.verbose('verbose message', 'TestContext');
      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith('verbose message', {
        context: 'TestContext',
      });
    });

    it('should log verbose with object message', () => {
      const message = { verbose: 'detailed info' };
      service.verbose(message, 'TestContext');
      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith({
        ...message,
        context: 'TestContext',
      });
    });
  });
});

