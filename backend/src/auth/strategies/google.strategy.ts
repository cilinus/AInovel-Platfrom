import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from '../../common/schemas/user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly isConfigured: boolean;

  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    super({
      clientID: clientID || 'not-configured',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3101/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
    this.isConfigured = !!clientID;
    if (!this.isConfigured) {
      Logger.warn('GOOGLE_CLIENT_ID not configured. Google OAuth will not work.', 'GoogleStrategy');
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { id, displayName, emails, photos } = profile;

    done(null, {
      provider: AuthProvider.GOOGLE,
      providerId: String(id),
      email: emails?.[0]?.value,
      nickname: displayName || `google_${id}`,
      profileImage: photos?.[0]?.value,
    });
  }
}
