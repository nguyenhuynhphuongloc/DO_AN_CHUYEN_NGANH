import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from './authenticated-user.interface';
import { verifyAccessToken } from './jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthenticatedUser;
    }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = verifyAccessToken(
      token,
      this.configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
    );

    request.user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      token,
    };

    return true;
  }
}
