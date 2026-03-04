import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver-v2';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '../../common/schemas/user.schema';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  private readonly isConfigured: boolean;

  constructor(config: ConfigService) {
    const clientID = config.get<string>('NAVER_CLIENT_ID');
    super({
      clientID: clientID || 'not-configured',
      clientSecret: config.get<string>('NAVER_CLIENT_SECRET') || 'not-configured',
      callbackURL: config.get<string>('NAVER_CALLBACK_URL') || 'http://localhost:3101/api/auth/naver/callback',
    });
    this.isConfigured = !!clientID;
    if (!this.isConfigured) {
      Logger.warn('NAVER_CLIENT_ID not configured. Naver OAuth will not work.', 'NaverStrategy');
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ) {
    const { id, nickname, email, profile_image } = profile;

    done(null, {
      provider: AuthProvider.NAVER,
      providerId: String(id),
      email: email,
      nickname: nickname || `naver_${id}`,
      profileImage: profile_image,
    });
  }
}
