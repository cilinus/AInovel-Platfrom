import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  USER = 'user',
  AUTHOR = 'author',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',
  KAKAO = 'kakao',
  NAVER = 'naver',
  GOOGLE = 'google',
}

@Schema({ _id: false })
export class SocialAccount {
  @Prop({ required: true, enum: AuthProvider })
  provider: AuthProvider;

  @Prop({ required: true })
  providerId: string;

  @Prop()
  email?: string;
}

const SocialAccountSchema = SchemaFactory.createForClass(SocialAccount);

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ required: true, unique: true, minlength: 2, maxlength: 20 })
  nickname: string;

  @Prop()
  profileImage?: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: [SocialAccountSchema], default: [] })
  socialAccounts: SocialAccount[];

  @Prop({ default: 0 })
  tokenBalance: number;

  @Prop({ default: 0 })
  krwBalance: number;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ 'socialAccounts.provider': 1, 'socialAccounts.providerId': 1 });
