// Mock dd-trace before importing
const mockInit = jest.fn();
const mockTracer = {
  init: mockInit,
};

jest.mock('dd-trace', () => {
  return {
    __esModule: true,
    default: mockTracer,
  };
});

describe('tracer', () => {
  const originalEnv = process.env;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    console.log = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.log = originalConsoleLog;
  });

  it('should initialize tracer when DD_API_KEY is set', () => {
    process.env.DD_API_KEY = 'test-api-key';
    process.env.DD_SERVICE = 'test-service';
    process.env.DD_ENV = 'test';
    process.env.DD_VERSION = '2.0.0';

    // Re-import to trigger initialization
    jest.isolateModules(() => {
      require('./tracer');
    });

    expect(mockInit).toHaveBeenCalledWith({
      service: 'test-service',
      env: 'test',
      version: '2.0.0',
      logInjection: true,
      runtimeMetrics: true,
      profiling: true,
      plugins: true,
    });
    expect(console.log).toHaveBeenCalledWith('✅ Datadog APM initialized');
  });

  it('should use default values when env vars are not set', () => {
    process.env.DD_API_KEY = 'test-api-key';
    delete process.env.DD_SERVICE;
    delete process.env.DD_ENV;
    delete process.env.DD_VERSION;

    jest.isolateModules(() => {
      require('./tracer');
    });

    expect(mockInit).toHaveBeenCalledWith({
      service: 'muun-challenge',
      env: 'development',
      version: '1.0.0',
      logInjection: true,
      runtimeMetrics: true,
      profiling: true,
      plugins: true,
    });
  });

  it('should use DD_SERVICE when set, default for others', () => {
    process.env.DD_API_KEY = 'test-api-key';
    process.env.DD_SERVICE = 'custom-service';
    delete process.env.DD_ENV;
    delete process.env.DD_VERSION;

    jest.isolateModules(() => {
      require('./tracer');
    });

    expect(mockInit).toHaveBeenCalledWith({
      service: 'custom-service',
      env: 'development',
      version: '1.0.0',
      logInjection: true,
      runtimeMetrics: true,
      profiling: true,
      plugins: true,
    });
  });

  it('should use DD_ENV when set, default for others', () => {
    process.env.DD_API_KEY = 'test-api-key';
    delete process.env.DD_SERVICE;
    process.env.DD_ENV = 'production';
    delete process.env.DD_VERSION;

    jest.isolateModules(() => {
      require('./tracer');
    });

    expect(mockInit).toHaveBeenCalledWith({
      service: 'muun-challenge',
      env: 'production',
      version: '1.0.0',
      logInjection: true,
      runtimeMetrics: true,
      profiling: true,
      plugins: true,
    });
  });

  it('should use DD_VERSION when set, default for others', () => {
    process.env.DD_API_KEY = 'test-api-key';
    delete process.env.DD_SERVICE;
    delete process.env.DD_ENV;
    process.env.DD_VERSION = '2.5.0';

    jest.isolateModules(() => {
      require('./tracer');
    });

    expect(mockInit).toHaveBeenCalledWith({
      service: 'muun-challenge',
      env: 'development',
      version: '2.5.0',
      logInjection: true,
      runtimeMetrics: true,
      profiling: true,
      plugins: true,
    });
  });

  it('should not initialize tracer when DD_API_KEY is not set', () => {
    delete process.env.DD_API_KEY;

    jest.isolateModules(() => {
      require('./tracer');
    });

    expect(mockInit).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      'ℹ️  Datadog APM disabled (DD_API_KEY not set)',
    );
  });

  it('should export tracer', () => {
    process.env.DD_API_KEY = 'test-api-key';
    jest.isolateModules(() => {
      const exportedTracer = require('./tracer').default;
      expect(exportedTracer).toBeDefined();
    });
  });
});

