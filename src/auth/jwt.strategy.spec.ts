import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user info', async () => {
    const payload = { sub: '123', username: 'test' };
    const result = await strategy.validate(payload);
    expect(result).toEqual({ userId: '123', username: 'test' });
  });

  it('should throw error if secret is missing', () => {
    mockConfigService.get.mockReturnValueOnce(undefined);
    expect(() => new JwtStrategy(mockConfigService as any)).toThrow(
      'JWT_SECRET is not defined',
    );
  });
});
