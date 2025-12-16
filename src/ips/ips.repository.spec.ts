import { Test, TestingModule } from '@nestjs/testing';
import { IpsRepository } from './ips.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ip } from './ip.entity';
import { Repository } from 'typeorm';

describe('IpsRepository', () => {
    let repository: IpsRepository;
    let typeOrmRepo: Repository<Ip>;

    const mockTypeOrmRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IpsRepository,
                { provide: getRepositoryToken(Ip), useValue: mockTypeOrmRepo },
            ],
        }).compile();

        repository = module.get<IpsRepository>(IpsRepository);
        typeOrmRepo = module.get<Repository<Ip>>(getRepositoryToken(Ip));
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
        // Force header coverage
        expect((repository as any).repo).toBeDefined();
    });

    it('should be instantiated manually', () => {
        const r = new IpsRepository(mockTypeOrmRepo as any);
        expect(r).toBeDefined();
    });

    describe('findByIp', () => {
        it('should return Ip if found', async () => {
            const ip = { ip: '1.2.3.4' } as Ip;
            mockTypeOrmRepo.findOne.mockResolvedValue(ip);
            const result = await repository.findByIp('1.2.3.4');
            expect(result).toEqual(ip);
            expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({ where: { ip: '1.2.3.4' } });
        });

        it('should return null if not found', async () => {
            mockTypeOrmRepo.findOne.mockResolvedValue(null);
            const result = await repository.findByIp('1.2.3.4');
            expect(result).toBeNull();
        });
    });

    describe('save', () => {
        it('should save ip', async () => {
            // Although save is not used in current service logic (ingest does bulk insert), it's in the repo.
            await repository.save('1.2.3.4');
            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith({ ip: '1.2.3.4' });
        });
    });
});
