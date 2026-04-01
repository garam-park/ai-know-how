import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, LoginDto, RefreshDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── 회원가입 ──────────────────────────────────────────
  async register(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ code: 409000, message: '이미 가입된 이메일입니다.' });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        tel: dto.tel,
      },
      select: { id: true, email: true, name: true, tel: true, createdAt: true },
    });

    return { code: 201000, result: { user } };
  }

  // ── 로그인 ──────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 401000, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException({ code: 401000, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      code: 200000,
      result: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tel: user.tel,
          createdAt: user.createdAt,
        },
      },
    };
  }

  // ── 토큰 갱신 ──────────────────────────────────────────
  async refresh(dto: RefreshDto) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET', 'dev-secret-key'),
      });
    } catch {
      throw new UnauthorizedException({ code: 401001, message: '리프레시 토큰이 만료되었거나 유효하지 않습니다.' });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
    });
    if (!user) {
      throw new UnauthorizedException({ code: 401001, message: '존재하지 않는 사용자입니다.' });
    }

    const newPayload: JwtPayload = { sub: user.id, email: user.email };
    return {
      code: 200000,
      result: {
        accessToken: this.generateAccessToken(newPayload),
        refreshToken: this.generateRefreshToken(newPayload),
      },
    };
  }

  // ── 로그아웃 (MVP: 클라이언트 토큰 삭제) ──────────────
  async logout() {
    return { code: 200000, result: { message: '로그아웃 성공' } };
  }

  // ── 내 정보 ──────────────────────────────────────────
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, name: true, tel: true, createdAt: true },
    });
    return { code: 200000, result: { user } };
  }

  // ── Private helpers ──────────────────────────────────
  private generateAccessToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('JWT_SECRET', 'dev-secret-key');
    const expiresIn = this.configService.get<string>('JWT_EXPIRATION', '15m');
    return this.jwtService.sign(
      { sub: payload.sub, email: payload.email } as Record<string, unknown>,
      { secret, expiresIn } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  }

  private generateRefreshToken(payload: JwtPayload): string {
    const secret = this.configService.get<string>('JWT_SECRET', 'dev-secret-key');
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    return this.jwtService.sign(
      { sub: payload.sub, email: payload.email } as Record<string, unknown>,
      { secret, expiresIn } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  }
}
