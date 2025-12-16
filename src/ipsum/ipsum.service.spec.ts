import { Test, TestingModule } from '@nestjs/testing';
import { IpsumService } from './ipsum.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('IpsumService', () => {
    let service: IpsumService;
    let httpService: HttpService;

    const mockHttpService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IpsumService,
                { provide: HttpService, useValue: mockHttpService },
            ],
        }).compile();

        service = module.get<IpsumService>(IpsumService);
        httpService = module.get<HttpService>(HttpService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should fetch and parse IPs', async () => {
        const mockResponse = {
            data: `# comment
      
      1.1.1.1 source1, source2
      2.2.2.2 source1
      3.3.3.3 source1
      `,
        };
        mockHttpService.get.mockReturnValue(of(mockResponse));

        const ips = await service.fetchIps();
        // 2.2.2.2 and 3.3.3.3 have one source -> filtered out? 
        // Wait, regex is grep -v -E "\s[1-2]$".
        // "2.2.2.2 source1" -> ends with "source1". NOT matching \s[1-2]$.
        // Oh, the original file has counts? 
        // The user provided logic: `grep -v -E "\s[1-2]$"`.
        // My updated service implements this regex on the whole line.

        // Let's create mock data that matches my understanding of what gets filtered.
        // If the line is "1.2.3.4  2", it matches \s[1-2]$ -> Filtered.
        // If the line is "1.2.3.4  5", it does not match -> Kept.

        const mockData = `
# comment
1.1.1.1  5
2.2.2.2  2
3.3.3.3  1
4.4.4.4  10
`;
        mockHttpService.get.mockReturnValue(of({ data: mockData }));

        const result = await service.fetchIps();

        // 4.4.4.4 -> Kept

        // Since Step 242 removed the filter, we expect ALL valid IPs.
        expect(result).toEqual(['1.1.1.1', '2.2.2.2', '3.3.3.3', '4.4.4.4']);
        expect(result.length).toBe(4);
    });
});
