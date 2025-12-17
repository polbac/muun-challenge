import { Test, TestingModule } from '@nestjs/testing';
import { IpsController } from './ips.controller';
import { IpsService } from './ips.service';
import { GetIpDto } from './dtos/get-ip.dto';
import { AuthGuard } from '@nestjs/passport';

describe('IpsController', () => {
  let controller: IpsController;
  let service: IpsService;

  const mockIpsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IpsController],
      providers: [{ provide: IpsService, useValue: mockIpsService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<IpsController>(IpsController);
    service = module.get<IpsService>(IpsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect((controller as any).ipsService).toBeDefined();
  });

  it('should be instantiated manually', () => {
    const c = new IpsController(mockIpsService as any);
    expect(c).toBeDefined();
    expect((c as any).ipsService).toBeDefined();
    expect((c as any).logger).toBeDefined();
  });

  describe('checkIp', () => {
    it('should return blocked: true if IP is found', async () => {
      mockIpsService.findOne.mockResolvedValue({ ip: '1.2.3.4' });
      const dto: GetIpDto = { ip: '1.2.3.4' };
      const result = await controller.checkIp(dto);
      expect(result).toEqual({ blocked: true });
      expect(service.findOne).toHaveBeenCalledWith('1.2.3.4');
    });

    it('should return blocked: false if IP is not found', async () => {
      mockIpsService.findOne.mockResolvedValue(null);
      const dto: GetIpDto = { ip: '1.2.3.4' };
      const result = await controller.checkIp(dto);
      expect(result).toEqual({ blocked: false });
      expect(service.findOne).toHaveBeenCalledWith('1.2.3.4');
    });

    it('should return blocked: true when found is truthy', async () => {
      mockIpsService.findOne.mockResolvedValue({ ip: '1.2.3.4', id: 1 });
      const dto: GetIpDto = { ip: '1.2.3.4' };
      const result = await controller.checkIp(dto);
      expect(result).toEqual({ blocked: true });
    });
  });
});
