import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IpsumService {
    private readonly logger = new Logger(IpsumService.name);
    private readonly url = 'https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt';

    constructor(private readonly httpService: HttpService) { }

    async fetchIps(): Promise<string[]> {
        this.logger.log(`Fetching IPs from ${this.url}`);
        const { data: text } = await firstValueFrom(this.httpService.get(this.url));
        const lines = text.split('\n');

        const ips = lines
            .filter(line => {
                // Remove comments
                if (line.trim().startsWith('#')) return false;
                // Remove empty lines
                if (!line.trim()) return false;
                // grep -v -E "\s[1-2]$" logic: exclude lines ending with space + 1 or 2
                // The original file format is: IP  hits  severity ...
                // The command was: grep -v -E "\s[1-2]$"
                // This implies filtering based on some column.
                // However, let's implement the filter exactly as requested.
                // "cut -f 1" implies the first field is the IP.

                // Check exclusion first
                if (/\s[1-2]$/.test(line)) {
                    return false;
                }
                return true;
            })
            .map(line => line.split(/\s+/)[0]) // cut -f 1 equivalent (assuming space/tab separated)
            .filter(ip => ip); // Remove empty strings if any

        this.logger.log(`Fetched and parsed ${ips.length} IPs`);
        return ips;
    }
}
