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

import { User, UserDocument, AuthProvider } from '../common/schemas/user.schema';

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
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
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

      // Create new user
      user = await this.userModel.create({
        email: profile.email,
        nickname: profile.nickname,
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
