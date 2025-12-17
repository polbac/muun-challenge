import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthMiddleware } from './admin-auth.middleware';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

describe('AdminAuthMiddleware', () => {
    let middleware: AdminAuthMiddleware;
    let configService: ConfigService;

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminAuthMiddleware,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        middleware = module.get<AdminAuthMiddleware>(AdminAuthMiddleware);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });

    describe('use', () => {
        it('should call next() if admin token is valid', () => {
            const req: any = { headers: { 'x-admin-token': 'valid-token' } };
            const res: any = {};
            const next = jest.fn();

            mockConfigService.get.mockReturnValue('valid-token');

            middleware.use(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException if token is missing', () => {
            const req: any = { headers: {} };
            const res: any = {};
            const next = jest.fn();

            mockConfigService.get.mockReturnValue('valid-token');

            expect(() => middleware.use(req, res, next)).toThrow(UnauthorizedException);
            expect(next).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedException if token is invalid', () => {
            const req: any = { headers: { 'x-admin-token': 'invalid-token' } };
            const res: any = {};
            const next = jest.fn();

            mockConfigService.get.mockReturnValue('valid-token');

            expect(() => middleware.use(req, res, next)).toThrow(UnauthorizedException);
            expect(next).not.toHaveBeenCalled();
        });

        it('should throw error if ADMIN_TOKEN is not configured', () => {
            const req: any = { headers: { 'x-admin-token': 'some-token' } };
            const res: any = {};
            const next = jest.fn();

            mockConfigService.get.mockReturnValue(undefined);

            expect(() => middleware.use(req, res, next)).toThrow('ADMIN_TOKEN not configured');
        });
    });
});
