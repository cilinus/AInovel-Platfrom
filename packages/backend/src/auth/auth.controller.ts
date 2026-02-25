import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.nickname);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '로그인' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) reply: FastifyReply) {
    const tokens = await this.authService.login(dto.email, dto.password);

    // Set refresh token as httpOnly cookie
    reply.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: '토큰 갱신' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }
}
