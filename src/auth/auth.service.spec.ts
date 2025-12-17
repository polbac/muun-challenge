import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      mockConfigService.get.mockReturnValue('test-secret');

      const token = service.generateToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should throw error if JWT_SECRET is not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => service.generateToken()).toThrow(
        'JWT_SECRET not found in environment variables',
      );
    });
  });
});
