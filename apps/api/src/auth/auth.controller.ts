import { Body, Controller, Get, Headers, HttpCode, Inject, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CorrelationId } from '../common/http/correlation-id.decorator';
import { AuthService } from './auth.service';
import {
  LoginResponseDto,
  LogoutResponseDto,
  ProblemResponseDto,
  RefreshResponseDto,
  SessionResponseDto,
} from './dto';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { LoginRequestDto, LogoutRequestDto, RefreshRequestDto } from './dto';

@ApiTags('Authentication')
@ApiHeader({
  name: 'X-Correlation-Id',
  required: false,
  description: 'Optional correlation identifier for request tracing.',
})
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate user and issue placeholder tokens.' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiBadRequestResponse({ type: ProblemResponseDto })
  login(
    @Body() request: LoginRequestDto,
    @CorrelationId() correlationId: string,
  ): LoginResponseDto {
    return this.authService.login(request, correlationId);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke session with placeholder auth workflow.' })
  @ApiOkResponse({ type: LogoutResponseDto })
  @ApiBadRequestResponse({ type: ProblemResponseDto })
  @ApiUnauthorizedResponse({ type: ProblemResponseDto })
  logout(
    @Body() request: LogoutRequestDto,
    @Headers('authorization') authorizationHeader: string | undefined,
    @CorrelationId() correlationId: string,
  ): LogoutResponseDto {
    return this.authService.logout(request, authorizationHeader, correlationId);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate refresh token in placeholder mode.' })
  @ApiOkResponse({ type: RefreshResponseDto })
  @ApiBadRequestResponse({ type: ProblemResponseDto })
  refresh(
    @Body() request: RefreshRequestDto,
    @CorrelationId() correlationId: string,
  ): RefreshResponseDto {
    return this.authService.refresh(request, correlationId);
  }

  @Get('session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return current session context in placeholder mode.' })
  @ApiOkResponse({ type: SessionResponseDto })
  @ApiUnauthorizedResponse({ type: ProblemResponseDto })
  session(
    @Headers('authorization') authorizationHeader: string | undefined,
    @CorrelationId() correlationId: string,
  ): SessionResponseDto {
    return this.authService.getSession(authorizationHeader, correlationId);
  }
}
