import { UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { JwtPayload } from './jwt-payload.interface';

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function decodeBase64UrlBuffer(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function parsePayload(token: string): { header: { alg?: string }; payload: JwtPayload; signingInput: string; signature: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Invalid access token');
  }

  try {
    const header = JSON.parse(decodeBase64Url(parts[0])) as { alg?: string };
    const payload = JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;

    return {
      header,
      payload,
      signingInput: `${parts[0]}.${parts[1]}`,
      signature: parts[2],
    };
  } catch {
    throw new UnauthorizedException('Invalid access token');
  }
}

export function verifyAccessToken(token: string, secret: string): JwtPayload {
  const { header, payload, signingInput, signature } = parsePayload(token);

  if (header.alg !== 'HS256') {
    throw new UnauthorizedException('Unsupported access token');
  }

  const expectedSignature = createHmac('sha256', secret).update(signingInput).digest();
  const providedSignature = decodeBase64UrlBuffer(signature);

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new UnauthorizedException('Invalid access token');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.nbf === 'number' && payload.nbf > now) {
    throw new UnauthorizedException('Access token is not active');
  }

  if (typeof payload.exp === 'number' && payload.exp <= now) {
    throw new UnauthorizedException('Access token has expired');
  }

  if (!payload.sub || !payload.email || !payload.role) {
    throw new UnauthorizedException('Invalid access token');
  }

  return payload;
}
