import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class LogoutRequestDto {
  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allSessions?: boolean;
}

export class LogoutResponseDto {
  @ApiProperty()
  revoked!: boolean;

  @ApiProperty({ minimum: 0 })
  revokedSessionCount!: number;

  @ApiProperty()
  message!: string;
}
