import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { hashPassword, verifyPassword } from './password.util';
import { JwtPayload } from './types/jwt-payload.type';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type SharedUserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string | null;
  currency: string | null;
  avatar_id: number | null;
  created_at: Date;
  updated_at: Date;
  salt: string | null;
  hash: string | null;
  login_attempts: Prisma.Decimal | number | null;
  lock_until: Date | null;
};

type RefreshTokenRow = {
  id: string;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
};

type QueryExecutor = Pick<PrismaService, '$queryRaw' | '$executeRaw'>;

const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  private schemaReadyPromise: Promise<void> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(body: RegisterDto) {
    await this.ensureSchemaReady();

    const existingUser = await this.findUserByEmail(body.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const derivedName = body.email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'New User';
    const passwordRecord = hashPassword(body.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const insertedUsers = await tx.$queryRaw<SharedUserRow[]>`
        INSERT INTO public.users (email, name, currency, role, salt, hash, login_attempts)
        VALUES (${body.email}, ${derivedName}, ${'VND'}, ${body.role}, ${passwordRecord.salt}, ${passwordRecord.hash}, 0)
        RETURNING id, email, name, role, currency, avatar_id, created_at, updated_at, salt, hash, login_attempts, lock_until
      `;
      const insertedUser = insertedUsers[0];
      await this.ensureDefaultWalletForUser(tx, insertedUser.id, insertedUser.currency);
      return insertedUser;
    });

    const tokens = await this.issueTokens(user);
    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async login(body: LoginDto) {
    await this.ensureSchemaReady();

    const user = await this.findUserByEmail(body.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.lock_until && user.lock_until.getTime() > Date.now()) {
      throw new UnauthorizedException('User account is temporarily locked');
    }

    if (!verifyPassword(body.password, user.salt, user.hash)) {
      await this.recordFailedLogin(user);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE public.users
        SET login_attempts = 0, lock_until = NULL, updated_at = NOW()
        WHERE id = ${user.id}
      `;
      await this.ensureDefaultWalletForUser(tx, user.id, user.currency);
    });

    const refreshedUser = await this.findUserById(user.id);
    if (!refreshedUser) {
      throw new NotFoundException('User not found');
    }

    const tokens = await this.issueTokens(refreshedUser);
    return {
      user: this.toPublicUser(refreshedUser),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    await this.ensureSchemaReady();

    const tokenRows = await this.prisma.$queryRaw<RefreshTokenRow[]>`
      SELECT id, user_id, token_hash, expires_at, revoked_at
      FROM public.refresh_tokens
      WHERE token_hash = ${refreshToken}
      LIMIT 1
    `;
    const storedToken = tokenRows[0];

    if (!storedToken || storedToken.revoked_at || storedToken.expires_at < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    await this.prisma.$executeRaw`
      UPDATE public.refresh_tokens
      SET revoked_at = NOW()
      WHERE id = ${storedToken.id}
    `;

    const user = await this.findUserById(storedToken.user_id);
    if (!user) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const tokens = await this.issueTokens(user);
    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    await this.ensureSchemaReady();

    const parsedUserId = Number.parseInt(userId, 10);
    if (!Number.isInteger(parsedUserId)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.findUserById(parsedUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  private async issueTokens(user: SharedUserRow): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: String(user.id),
      email: user.email,
      role: user.role ?? 'user',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshDays = this.parseRefreshDurationDays(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: String(user.id),
        email: user.email,
        role: user.role ?? 'user',
        tokenType: 'refresh',
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    await this.prisma.$executeRaw`
      INSERT INTO public.refresh_tokens (id, user_id, token_hash, expires_at)
      VALUES (${randomUUID()}, ${user.id}, ${refreshToken}, ${expiresAt})
    `;

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseRefreshDurationDays(duration: string): number {
    const match = /^(\d+)d$/.exec(duration);
    if (!match) {
      return 7;
    }

    return Number(match[1]);
  }

  private async findUserByEmail(email: string) {
    const users = await this.prisma.$queryRaw<SharedUserRow[]>`
      SELECT id, email, name, role, currency, avatar_id, created_at, updated_at, salt, hash, login_attempts, lock_until
      FROM public.users
      WHERE email = ${email}
      LIMIT 1
    `;
    return users[0] ?? null;
  }

  private async findUserById(userId: number) {
    const users = await this.prisma.$queryRaw<SharedUserRow[]>`
      SELECT id, email, name, role, currency, avatar_id, created_at, updated_at, salt, hash, login_attempts, lock_until
      FROM public.users
      WHERE id = ${userId}
      LIMIT 1
    `;
    return users[0] ?? null;
  }

  private async recordFailedLogin(user: SharedUserRow) {
    const currentAttempts = this.toNumber(user.login_attempts);
    const nextAttempts = currentAttempts + 1;
    const shouldLock = nextAttempts >= MAX_LOGIN_ATTEMPTS;
    const lockUntil = shouldLock
      ? new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000)
      : null;

    await this.prisma.$executeRaw`
      UPDATE public.users
      SET login_attempts = ${nextAttempts}, lock_until = ${lockUntil}, updated_at = NOW()
      WHERE id = ${user.id}
    `;
  }

  private async ensureSchemaReady() {
    if (!this.schemaReadyPromise) {
      this.schemaReadyPromise = (async () => {
        await this.prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS public.refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        await this.prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx
          ON public.refresh_tokens (user_id)
        `);
      })();
    }

    await this.schemaReadyPromise;
  }

  private async ensureDefaultWalletForUser(
    executor: QueryExecutor,
    userId: number,
    currency: string | null,
  ) {
    const wallets = await executor.$queryRaw<Array<{ id: number; is_default: boolean }>>`
      SELECT id, is_default
      FROM public.wallets
      WHERE user_id = ${userId}
      ORDER BY is_default DESC, created_at ASC, id ASC
      LIMIT 1
    `;
    const wallet = wallets[0];

    if (!wallet) {
      await executor.$executeRaw`
        INSERT INTO public.wallets (user_id, name, wallet_type, currency, balance, is_default)
        VALUES (${userId}, ${'Default Wallet'}, ${'cash'}, ${currency ?? 'VND'}, 0, TRUE)
      `;
      return;
    }

    if (!wallet.is_default) {
      await executor.$executeRaw`
        UPDATE public.wallets
        SET is_default = TRUE, updated_at = NOW()
        WHERE id = ${wallet.id}
      `;
    }
  }

  private toPublicUser(user: SharedUserRow) {
    return {
      id: String(user.id),
      email: user.email,
      role: user.role ?? 'user',
      fullName: user.name ?? user.email.split('@')[0],
      avatarUrl: null,
      status: 'active',
      emailVerified: true,
      lastLoginAt: user.updated_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined) {
    if (value == null) {
      return 0;
    }

    return typeof value === 'number' ? value : value.toNumber();
  }
}
