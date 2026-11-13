import { Body, Controller, Delete, HttpCode, Post, Res } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto, toUserResponse } from './dto/user-response.dto';
import { AuthService } from './auth.service';
import { SessionCookie } from './session-cookie';
import { SessionTokens } from './session-tokens';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: SessionTokens,
    private readonly cookie: SessionCookie,
  ) {}

  /** Logging in = creating a "session" resource (US-05). */
  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiTooManyRequestsResponse({ description: 'Account temporarily locked' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<UserResponseDto> {
    const user = await this.auth.login(dto.identifier, dto.password);
    this.cookie.set(response, await this.tokens.sign(user));
    return toUserResponse(user);
  }

  /** Cookie removal only for now; server-side invalidation needs a sessions table (later). */
  @Delete('current')
  @HttpCode(204)
  @ApiNoContentResponse()
  logout(@Res({ passthrough: true }) response: Response): void {
    this.cookie.clear(response);
  }
}