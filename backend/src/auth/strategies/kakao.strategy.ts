import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '../../common/schemas/user.schema';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  private readonly isConfigured: boolean;

  constructor(config: ConfigService) {
    const clientID = config.get<string>('KAKAO_CLIENT_ID');
    const clientSecret = config.get<string>('KAKAO_CLIENT_SECRET');
    super({
      clientID: clientID || 'not-configured',
      ...(clientSecret ? { clientSecret } : {}),
      callbackURL: config.get<string>('KAKAO_CALLBACK_URL') || 'http://localhost:3101/api/auth/kakao/callback',
    });
    this.isConfigured = !!clientID;
    if (!this.isConfigured) {
      Logger.warn('KAKAO_CLIENT_ID not configured. Kakao OAuth will not work.', 'KakaoStrategy');
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ) {
    const { id, username, _json } = profile;
    const kakaoAccount = _json?.kakao_account;

    done(null, {
      provider: AuthProvider.KAKAO,
      providerId: String(id),
      email: kakaoAccount?.email,
      nickname: username || kakaoAccount?.profile?.nickname || `kakao_${id}`,
      profileImage: kakaoAccount?.profile?.profile_image_url,
    });
  }
}
