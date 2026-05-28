import { ApiProperty } from '@nestjs/swagger';

export class ProblemResponseDto {
  @ApiProperty()
  type!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  status!: number;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  detail!: string;

  @ApiProperty()
  correlationId!: string;

  @ApiProperty()
  timestamp!: string;

  @ApiProperty()
  retryable!: boolean;
}
