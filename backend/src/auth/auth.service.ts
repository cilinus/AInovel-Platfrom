import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User, UserDocument, UserRole, AuthProvider } from '../common/schemas/user.schema';
import { LoggerService } from '../logger/logger.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface SocialProfile {
  provider: AuthProvider;
  providerId: string;
  email?: string;
  nickname: string;
  profileImage?: string;
}

@Injectable()
export class AuthService {
  // 개발용 계정: 아무 비밀번호로 로그인 가능, 자동 생성
  private static readonly DEV_ACCOUNTS: Record<string, { nickname: string; role: UserRole; tokenBalance: number }> = {
    'reader@ainovel.com': { nickname: '소설독서광', role: UserRole.USER, tokenBalance: 5000 },
    'author@ainovel.com': { nickname: '달빛작가', role: UserRole.AUTHOR, tokenBalance: 10000 },
  };

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async register(email: string, password: string, nickname: string): Promise<TokenPair> {
    const existing = await this.userModel.findOne({
      $or: [{ email }, { nickname }],
    });
    if (existing) {
      throw new ConflictException(
        existing.email === email ? 'Email already exists' : 'Nickname already taken',
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await this.userModel.create({
      email,
      password: hashed,
      nickname,
      isActive: true,
    });

    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<TokenPair> {
    // 개발 모드: 개발용 계정은 비밀번호 검증 없이 로그인
    if (this.configService.get('NODE_ENV') !== 'production') {
      const devAccount = AuthService.DEV_ACCOUNTS[email];
      if (devAccount) {
        return this.loginDevAccount(email, devAccount);
      }
    }

    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await user.save();

    return this.issueTokens(user);
  }

  private async loginDevAccount(
    email: string,
    account: { nickname: string; role: UserRole; tokenBalance: number },
  ): Promise<TokenPair> {
    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = await this.userModel.create({
        email,
        password: await bcrypt.hash('dev-password', 12),
        nickname: account.nickname,
        role: account.role,
        tokenBalance: account.tokenBalance,
        isActive: true,
      });
      this.logger.log(`Dev account created: ${email} (${account.role})`, 'AuthService');
    } else if (user.role !== account.role) {
      user.role = account.role;
      await user.save();
    }

    user.lastLoginAt = new Date();
    await user.save();

    this.logger.log(`Dev login: ${email} (${account.role})`, 'AuthService');
    return this.issueTokens(user);
  }

  async socialLogin(profile: SocialProfile): Promise<TokenPair> {
    let user = await this.userModel.findOne({
      'socialAccounts.provider': profile.provider,
      'socialAccounts.providerId': profile.providerId,
    });

    if (!user) {
      // Check if email already exists
      if (profile.email) {
        user = await this.userModel.findOne({ email: profile.email });
        if (user) {
          // Link social account to existing user
          user.socialAccounts.push({
            provider: profile.provider,
            providerId: profile.providerId,
            email: profile.email,
          });
          await user.save();
          return this.issueTokens(user);
        }
      }

      // Create new user with nickname collision handling
      const nickname = await this.resolveUniqueNickname(profile.nickname);
      user = await this.userModel.create({
        email: profile.email,
        nickname,
        profileImage: profile.profileImage,
        socialAccounts: [
          {
            provider: profile.provider,
            providerId: profile.providerId,
            email: profile.email,
          },
        ],
        isActive: true,
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return this.issueTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.userModel.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async resolveUniqueNickname(baseNickname: string): Promise<string> {
    const existing = await this.userModel.findOne({ nickname: baseNickname });
    if (!existing) return baseNickname;

    // Append random 4-char hex suffix, retry up to 5 times
    for (let i = 0; i < 5; i++) {
      const suffix = crypto.randomBytes(2).toString('hex');
      const candidate = `${baseNickname}_${suffix}`;
      if (candidate.length > 20) {
        // Truncate base to fit within 20-char limit
        const truncated = baseNickname.slice(0, 15);
        const fallback = `${truncated}_${suffix}`;
        const exists = await this.userModel.findOne({ nickname: fallback });
        if (!exists) return fallback;
      } else {
        const exists = await this.userModel.findOne({ nickname: candidate });
        if (!exists) return candidate;
      }
    }

    // Last resort: use provider + random id
    return `user_${crypto.randomBytes(4).toString('hex')}`;
  }

  private issueTokens(user: UserDocument): TokenPair {
    const payload = { sub: user._id.toString(), role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    };
  }
}
