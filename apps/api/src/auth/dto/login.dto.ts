import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DeviceContextDto {
  @ApiPropertyOptional({ maxLength: 128 })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceId?: string;

  @ApiPropertyOptional({ maxLength: 512 })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ipHint?: string;
}

export class LoginRequestDto {
  @ApiProperty({ minLength: 3, maxLength: 254 })
  @IsString()
  @Length(3, 254)
  identifier!: string;

  @ApiProperty({ minLength: 8, maxLength: 128, format: 'password' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 128)
  password!: string;

  @ApiPropertyOptional({ type: DeviceContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceContextDto)
  deviceContext?: DeviceContextDto;
}

export class SessionDto {
  @ApiProperty()
  sessionId!: string;

  @ApiProperty()
  issuedAt!: string;

  @ApiProperty()
  expiresAt!: string;
}

export class UserContextDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ type: [String] })
  roles!: string[];
}

export class LoginResponseDto {
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

  @ApiProperty({ type: UserContextDto })
  user!: UserContextDto;
}
