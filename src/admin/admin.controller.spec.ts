import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AuthService } from '../auth/auth.service';
import { IpsumService } from '../ipsum/ipsum.service';
import { IngestService } from '../ingest/ingest.service';

describe('AdminController', () => {
  let controller: AdminController;
  let authService: AuthService;
  let ipsumService: IpsumService;
  let ingestService: IngestService;

  const mockAuthService = {
    generateToken: jest.fn(),
  };

  const mockIpsumService = {
    fetchIps: jest.fn(),
  };

  const mockIngestService = {
    ingestIps: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: IpsumService, useValue: mockIpsumService },
        { provide: IngestService, useValue: mockIngestService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    authService = module.get<AuthService>(AuthService);
    ipsumService = module.get<IpsumService>(IpsumService);
    ingestService = module.get<IngestService>(IngestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateToken', () => {
    it('should return a token', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      mockAuthService.generateToken.mockReturnValue(mockToken);

      const result = controller.generateToken();

      expect(result).toEqual({ token: mockToken });
      expect(authService.generateToken).toHaveBeenCalled();
    });
  });

  describe('ingestIps', () => {
    it('should return success with totalIps on successful ingestion', async () => {
      const mockIps = ['1.2.3.4', '5.6.7.8'];
      mockIpsumService.fetchIps.mockResolvedValue(mockIps);
      mockIngestService.ingestIps.mockResolvedValue(undefined);

      const result = await controller.ingestIps();

      expect(result).toEqual({ success: true, totalIps: 2 });
      expect(ipsumService.fetchIps).toHaveBeenCalled();
      expect(ingestService.ingestIps).toHaveBeenCalledWith(mockIps);
    });

    it('should return failure on error', async () => {
      mockIpsumService.fetchIps.mockRejectedValue(new Error('Fetch failed'));

      const result = await controller.ingestIps();

      expect(result).toEqual({ success: false, totalIps: 0 });
    });
  });
});
