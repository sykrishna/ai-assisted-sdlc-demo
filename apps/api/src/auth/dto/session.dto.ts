import { ApiProperty } from '@nestjs/swagger';
import { SessionDto, UserContextDto } from './login.dto';

export class TokenContextDto {
  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  issuer!: string;

  @ApiProperty()
  audience!: string;
}

export class SessionResponseDto {
  @ApiProperty()
  authenticated!: boolean;

  @ApiProperty({ type: UserContextDto })
  user!: UserContextDto;

  @ApiProperty({ type: SessionDto })
  session!: SessionDto;

  @ApiProperty({ type: TokenContextDto })
  token!: TokenContextDto;
}
