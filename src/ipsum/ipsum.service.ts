import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IpsumService {
  private readonly logger = new Logger(IpsumService.name);
  private readonly url =
    'https://raw.githubusercontent.com/stamparm/ipsum/master/ipsum.txt';

  constructor(private readonly httpService: HttpService) {}

  async fetchIps(): Promise<string[]> {
    this.logger.log(`Fetching IPs from ${this.url}`);
    const { data: text } = await firstValueFrom(this.httpService.get(this.url));
    const lines = text.split('\n');

    const ips = lines
      .filter((line) => {
        if (line.trim().startsWith('#')) return false;

        if (!line.trim()) return false;

        return true;
      })
      .map((line) => line.split(/\s+/)[0])
      .filter((ip) => ip);

    this.logger.log(`Fetched and parsed ${ips.length} IPs`);
    return ips;
  }
}
