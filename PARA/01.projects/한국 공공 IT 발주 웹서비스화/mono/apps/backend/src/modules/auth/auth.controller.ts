import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getCookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    };
  }

  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<unknown> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    const response = await this.authService.login(dto);

    res.cookie('accessToken', response.result.accessToken, this.getCookieOptions(15 * 60 * 1000));
    res.cookie(
      'refreshToken',
      response.result.refreshToken,
      this.getCookieOptions(7 * 24 * 60 * 60 * 1000)
    );

    return {
      code: response.code,
      result: {
        user: response.result.user,
      },
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<unknown> {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    const response = await this.authService.refresh(refreshToken ?? '');

    res.cookie('accessToken', response.result.accessToken, this.getCookieOptions(15 * 60 * 1000));
    res.cookie(
      'refreshToken',
      response.result.refreshToken,
      this.getCookieOptions(7 * 24 * 60 * 60 * 1000)
    );

    return {
      code: response.code,
      result: {
        message: '토큰 갱신 성공',
      },
    };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response): Promise<unknown> {
    res.clearCookie('accessToken', this.getCookieOptions(0));
    res.clearCookie('refreshToken', this.getCookieOptions(0));
    return this.authService.logout();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { id: number }): Promise<unknown> {
    return this.authService.getMe(user.id);
  }
}
