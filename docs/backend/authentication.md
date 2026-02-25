# 인증 및 인가 설계서

## 1. 개요

Passport.js + JWT 기반 인증. 소셜 로그인(카카오, 네이버, 구글) 지원.
역할 기반 접근 제어(RBAC)로 엔드포인트별 권한 관리.

---

## 2. JWT 토큰 흐름

```
┌─────────┐                  ┌─────────┐                  ┌─────────┐
│ Client  │                  │ Server  │                  │ Redis   │
└────┬────┘                  └────┬────┘                  └────┬────┘
     │  POST /auth/login          │                            │
     │  {email, password}         │                            │
     ├───────────────────────────>│                            │
     │                            │  비밀번호 검증 (bcrypt)      │
     │                            │  Access Token (15분)       │
     │                            │  Refresh Token (7일)       │
     │                            │  Refresh Token 저장 ───────>│
     │  200 + Set-Cookie          │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │  GET /api/... + Bearer     │                            │
     ├───────────────────────────>│                            │
     │                            │  JwtStrategy 검증           │
     │  200 응답 데이터              │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │  (Access Token 만료)        │                            │
     │  POST /auth/refresh        │                            │
     │  Cookie: refreshToken      │                            │
     ├───────────────────────────>│                            │
     │                            │  Refresh Token 검증 ───────>│
     │                            │  기존 토큰 삭제, 새 토큰 저장  │
     │                            │<────────────────────────────┤
     │  새 Access + Refresh        │                            │
     │<───────────────────────────┤                            │
```

---

## 3. 토큰 설계

| 속성 | Access Token | Refresh Token |
|------|-------------|---------------|
| 만료 시간 | 15분 | 7일 |
| 저장 위치 | 메모리 / Authorization 헤더 | httpOnly Secure Cookie |
| Payload | `{ sub, email, roles }` | `{ sub, tokenId }` |
| 서명 알고리즘 | HS256 | HS256 |
| 갱신 방식 | Refresh 요청 | Rotation (갱신 시 새로 발급) |

### Refresh Token Rotation

기존 Refresh Token 사용 시 새 토큰 쌍 발급 + 기존 토큰 Redis에서 삭제.
이미 사용된 토큰으로 재요청하면 해당 사용자의 모든 세션을 무효화(탈취 감지).

```typescript
// src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    @InjectRedis() private redis: Redis,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    return this.issueTokens(user);
  }

  async refreshTokens(userId: string, tokenId: string): Promise<AuthTokens> {
    const storedTokenId = await this.redis.get(`refresh:${userId}:${tokenId}`);
    if (!storedTokenId) {
      // 탈취 감지: 해당 사용자의 모든 리프레시 토큰 무효화
      const keys = await this.redis.keys(`refresh:${userId}:*`);
      if (keys.length) await this.redis.del(...keys);
      throw new UnauthorizedException('유효하지 않은 세션입니다. 다시 로그인해 주세요.');
    }

    // 기존 토큰 삭제
    await this.redis.del(`refresh:${userId}:${tokenId}`);
    const user = await this.usersService.findById(userId);
    return this.issueTokens(user);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const tokenId = randomUUID();

    const accessToken = this.jwtService.sign(
      { sub: user._id, email: user.email, roles: user.roles },
      { expiresIn: '15m', secret: this.configService.get('JWT_ACCESS_SECRET') },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user._id, tokenId },
      { expiresIn: '7d', secret: this.configService.get('JWT_REFRESH_SECRET') },
    );

    // Redis에 리프레시 토큰 ID 저장 (7일 TTL)
    await this.redis.set(
      `refresh:${user._id}:${tokenId}`,
      '1',
      'EX',
      7 * 24 * 60 * 60,
    );

    return { accessToken, refreshToken };
  }
}
```

---

## 4. Passport 전략

### JwtStrategy (Access Token 검증)

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
```

### KakaoStrategy

```typescript
// src/modules/auth/strategies/kakao.strategy.ts
@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('KAKAO_CLIENT_ID'),
      clientSecret: configService.get('KAKAO_CLIENT_SECRET'),
      callbackURL: configService.get('KAKAO_CALLBACK_URL'),
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: KakaoProfile,
    done: VerifyCallback,
  ): void {
    const socialUser: SocialUserInfo = {
      provider: 'kakao',
      providerId: String(profile.id),
      email: profile._json?.kakao_account?.email,
      nickname: profile.displayName,
      avatarUrl: profile._json?.properties?.profile_image,
    };
    done(null, socialUser);
  }
}
```

---

## 5. 소셜 로그인 흐름

```
┌────────┐      ┌────────┐      ┌───────────┐      ┌────────┐
│ Client │      │ Server │      │ OAuth 2.0 │      │  DB    │
└───┬────┘      └───┬────┘      │ Provider  │      └───┬────┘
    │               │           └─────┬─────┘          │
    │ 1. GET /auth/social/kakao       │                │
    ├──────────────>│                  │                │
    │               │ 2. Redirect     │                │
    │<──────────────┤  302 → kakao    │                │
    │ 3. 카카오 로그인 화면              │                │
    ├─────────────────────────────────>│                │
    │ 4. 인가 코드 발급                 │                │
    │<─────────────────────────────────┤                │
    │ 5. GET /auth/social/kakao/callback?code=xxx      │
    ├──────────────>│                  │                │
    │               │ 6. code → token │                │
    │               ├─────────────────>│                │
    │               │ 7. user profile │                │
    │               │<─────────────────┤                │
    │               │ 8. findOrCreate                  │
    │               ├──────────────────────────────────>│
    │               │ 9. JWT 발급                       │
    │ 10. Redirect  │                                  │
    │  + tokens     │                                  │
    │<──────────────┤                                  │
```

### 소셜 로그인 사용자 연동

```typescript
async socialLogin(socialUser: SocialUserInfo): Promise<AuthTokens> {
  // 1. 소셜 계정으로 기존 사용자 조회
  let user = await this.usersService.findBySocial(
    socialUser.provider,
    socialUser.providerId,
  );

  if (!user) {
    // 2. 이메일로 기존 계정 조회 → 소셜 계정 연동
    user = await this.usersService.findByEmail(socialUser.email);
    if (user) {
      await this.usersService.linkSocialAccount(user._id, {
        provider: socialUser.provider,
        providerId: socialUser.providerId,
      });
    } else {
      // 3. 새 사용자 생성
      user = await this.usersService.createSocialUser(socialUser);
    }
  }

  return this.issueTokens(user);
}
```

---

## 6. RBAC (역할 기반 접근 제어)

### 역할 정의

| 역할 | 설명 | 자동 부여 |
|------|------|-----------|
| `USER` | 일반 사용자 | 회원가입 시 |
| `AUTHOR` | 작가 (작품 생성 가능) | 작가 신청 승인 시 |
| `ADMIN` | 관리자 | 수동 지정 |

### 엔드포인트별 권한

| 리소스 | 동작 | USER | AUTHOR | ADMIN |
|--------|------|------|--------|-------|
| Works | 조회 (GET) | O | O | O |
| Works | 생성 (POST) | X | O | O |
| Works | 수정 (PATCH) | X | 본인만 | O |
| Episodes | 생성 | X | O | O |
| Episodes | 구매/열람 | O | O | O |
| AI 생성 | 요청 | X | O | O |
| Payment | 충전/구매 | O | O | O |
| Settlement | 조회 | X | 본인만 | O |
| Admin | 모든 기능 | X | X | O |

### 데코레이터 및 Guard

```typescript
// src/common/decorators/roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// src/common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// src/common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;
    return data ? user?.[data] : user;
  },
);

// 사용 예시
@Get('me')
getProfile(@CurrentUser() user: RequestUser) {
  return this.usersService.findById(user.userId);
}

@Post()
@Roles(Role.AUTHOR)
createWork(@CurrentUser('userId') authorId: string, @Body() dto: CreateWorkDto) {
  return this.worksService.create(authorId, dto);
}
```

---

## 7. Rate Limiting 설정

ThrottlerModule을 글로벌 적용하고, 엔드포인트별로 오버라이드 가능.

| 엔드포인트 그룹 | 제한 | TTL |
|-----------------|------|-----|
| 기본 (전체) | 60 req | 60초 |
| 인증 (login/register) | 5 req | 60초 |
| AI 생성 | 10 req | 60초 |
| 결제 | 10 req | 60초 |
| 검색 | 30 req | 60초 |

```typescript
// 엔드포인트별 오버라이드
@Post('login')
@Public()
@Throttle({ default: { limit: 5, ttl: 60000 } })
async login(@Body() dto: LoginDto) { ... }

@Post('generate')
@Roles(Role.AUTHOR)
@Throttle({ default: { limit: 10, ttl: 60000 } })
async generate(@Body() dto: GenerateNovelDto) { ... }
```

---

## 8. User 스키마 (Mongoose/Typegoose)

```typescript
// src/modules/users/schemas/user.schema.ts
export enum Role {
  USER = 'USER',
  AUTHOR = 'AUTHOR',
  ADMIN = 'ADMIN',
}

@modelOptions({ schemaOptions: { timestamps: true, collection: 'users' } })
export class User {
  _id: Types.ObjectId;

  @prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @prop({ select: false })  // 조회 시 기본 제외
  password?: string;

  @prop({ required: true, minlength: 2, maxlength: 20 })
  nickname: string;

  @prop({ maxlength: 200, default: '' })
  bio: string;

  @prop({ default: '' })
  avatarUrl: string;

  @prop({ type: () => [String], enum: Role, default: [Role.USER] })
  roles: Role[];

  @prop({ type: () => [SocialAccount], default: [] })
  socialAccounts: SocialAccount[];

  @prop({ default: 0 })
  tokenBalance: number;

  @prop({ default: false })
  isBanned: boolean;

  @prop()
  bannedAt?: Date;

  @prop()
  deletedAt?: Date;  // 소프트 삭제
}

class SocialAccount {
  @prop({ enum: ['kakao', 'naver', 'google'] })
  provider: string;

  @prop()
  providerId: string;
}
```

---

## 9. 보안 체크리스트

| 항목 | 구현 방법 |
|------|-----------|
| 비밀번호 해싱 | bcrypt (saltRounds: 12) |
| XSS 방지 | Fastify Helmet + 응답 이스케이프 |
| CSRF 방지 | SameSite=Strict Cookie + Origin 검증 |
| SQL/NoSQL Injection | Mongoose 스키마 검증 + class-validator |
| 토큰 탈취 대응 | Refresh Token Rotation + 세션 무효화 |
| 브루트포스 방지 | ThrottlerGuard (로그인 5회/분) |
| HTTPS 강제 | Fastify Secure Cookie + Redirect |
