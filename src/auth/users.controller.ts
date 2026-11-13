import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto, toUserResponse } from './dto/user-response.dto';
import { AuthService } from './auth.service';
import { CurrentUser, JwtAuthGuard } from './jwt-auth.guard';
import { SessionCookie } from './session-cookie';
import { SessionTokens, type SessionPayload } from './session-tokens';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: SessionTokens,
    private readonly cookie: SessionCookie,
  ) {}

  /** Creating an account = creating a "user" resource (US-03, US-04). The user is logged in right away. */
  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data (see the "errors" field)' })
  @ApiConflictResponse({ description: 'Email already associated with an account' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response): Promise<UserResponseDto> {
    const user = await this.auth.register(dto);
    this.cookie.set(response, await this.tokens.sign(user));
    return toUserResponse(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse()
  async me(@CurrentUser() session: SessionPayload): Promise<UserResponseDto> {
    return toUserResponse(await this.auth.getActiveUser(session.sub));
  }
}