import { IsIP, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetIpDto {
  @ApiProperty({ description: 'The IP address to check', example: '1.2.3.4' })
  @IsNotEmpty()
  @IsIP()
  ip: string;
}
