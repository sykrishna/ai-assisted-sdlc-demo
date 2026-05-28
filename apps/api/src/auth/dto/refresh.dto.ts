import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { SessionDto } from './login.dto';

export class RefreshRequestDto {
  @ApiProperty({ minLength: 16, maxLength: 4096 })
  @IsString()
  @Length(16, 4096)
  refreshToken!: string;

  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionId?: string;
}

export class RefreshResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ minimum: 1 })
  accessTokenExpiresIn!: number;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ minimum: 60 })
  refreshTokenExpiresIn!: number;

  @ApiProperty({ enum: ['Bearer'] })
  tokenType!: 'Bearer';

  @ApiProperty({ type: SessionDto })
  session!: SessionDto;
}
