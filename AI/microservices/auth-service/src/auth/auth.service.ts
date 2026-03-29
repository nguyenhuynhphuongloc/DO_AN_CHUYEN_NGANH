import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(body: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const defaultRole = await this.ensureRole(body.role);
    const derivedFullName = body.email.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'New User';

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        fullName: derivedFullName,
        passwordHash: body.password,
        status: 'active',
        emailVerified: false,
        userRoles: {
          create: {
            roleId: defaultRole.id,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    const tokens = await this.issueTokens(user);
    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async login(body: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.passwordHash !== body.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(`User account is ${user.status}`);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const tokens = await this.issueTokens(user);
    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: refreshToken },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
      },
    });

    const tokens = await this.issueTokens(storedToken.user);
    return {
      user: this.toPublicUser(storedToken.user),
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  private async issueTokens(user: UserWithRelations): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: this.getPrimaryRole(user),
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
        sub: user.id,
        email: user.email,
        role: this.getPrimaryRole(user),
        tokenType: 'refresh',
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken,
        expiresAt,
      },
    });

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

  private async ensureRole(roleName: string) {
    return this.prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} role`,
      },
    });
  }

  private getPrimaryRole(user: UserWithRelations): string {
    return user.userRoles[0]?.role.name ?? 'user';
  }

  private toPublicUser(user: UserWithRelations | User) {
    const role =
      'userRoles' in user && Array.isArray(user.userRoles) && user.userRoles.length > 0
        ? user.userRoles[0]?.role.name ?? 'user'
        : 'user';

    return {
      id: user.id,
      email: user.email,
      role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
