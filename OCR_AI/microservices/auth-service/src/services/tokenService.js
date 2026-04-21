import { createHash } from "node:crypto";

import jwt from "jsonwebtoken";

function normalizeUser(user) {
  return {
    sub: user.id,
    email: user.email,
    roles: user.roles
  };
}

export function createTokenService(config) {
  return {
    issueTokens(user) {
      const normalizedUser = normalizeUser(user);
      const accessToken = jwt.sign(normalizedUser, config.jwtSecret, {
        expiresIn: config.accessTokenTtl
      });
      const refreshToken = jwt.sign(
        { sub: user.id, type: "refresh" },
        config.refreshTokenSecret,
        { expiresIn: config.refreshTokenTtl }
      );
      const refreshPayload = jwt.decode(refreshToken);
      const accessPayload = jwt.decode(accessToken);

      return {
        accessToken,
        refreshToken,
        refreshTokenHash: hashToken(refreshToken),
        accessExpiresAt:
          accessPayload && typeof accessPayload === "object" && accessPayload.exp
            ? new Date(accessPayload.exp * 1000).toISOString()
            : null,
        refreshExpiresAt:
          refreshPayload && typeof refreshPayload === "object" && refreshPayload.exp
            ? new Date(refreshPayload.exp * 1000).toISOString()
            : null
      };
    },

    verifyAccessToken(token) {
      return jwt.verify(token, config.jwtSecret);
    },

    verifyRefreshToken(token) {
      return jwt.verify(token, config.refreshTokenSecret);
    }
  };
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
