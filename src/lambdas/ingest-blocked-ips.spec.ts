import { Test, TestingModule } from '@nestjs/testing';
import { NestFactory } from '@nestjs/core';
import { IpsumService } from '../ipsum/ipsum.service';
import { IngestService } from '../ingest/ingest.service';
import { ingestBlockedIps } from './ingest-blocked-ips';
import { AppModule } from '../app.module';

jest.mock('@nestjs/core', () => ({
    NestFactory: {
        createApplicationContext: jest.fn(),
    },
}));

describe('IngestBlockedIps Lambda', () => {
    let mockApp: any;
    let mockIpsumService: any;
    let mockIngestService: any;

    beforeEach(() => {
        mockIpsumService = {
            fetchIps: jest.fn().mockResolvedValue(['1.2.3.4']),
        };
        mockIngestService = {
            ingestIps: jest.fn().mockResolvedValue(undefined),
        };

        mockApp = {
            get: jest.fn((token) => {
                if (token === IpsumService) return mockIpsumService;
                if (token === IngestService) return mockIngestService;
                return null;
            }),
            close: jest.fn().mockResolvedValue(undefined),
        };

        (NestFactory.createApplicationContext as jest.Mock).mockResolvedValue(mockApp);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and ingest IPs successfully', async () => {
        await ingestBlockedIps();

        expect(NestFactory.createApplicationContext).toHaveBeenCalledWith(AppModule);
        expect(mockApp.get).toHaveBeenCalledWith(IpsumService);
        expect(mockApp.get).toHaveBeenCalledWith(IngestService);
        expect(mockIpsumService.fetchIps).toHaveBeenCalled();
        expect(mockIngestService.ingestIps).toHaveBeenCalledWith(['1.2.3.4']);
        expect(mockApp.close).toHaveBeenCalled();
    });

    it('should handle errors and exit', async () => {
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`Process exit ${code}`);
        });

        const error = new Error('Test error');
        mockIpsumService.fetchIps.mockRejectedValue(error);

        await expect(ingestBlockedIps()).rejects.toThrow('Process exit 1');

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(mockApp.close).toHaveBeenCalled();

        exitSpy.mockRestore();
    });
});
