import { badRequest, json, serverError, unauthorized } from "../lib/http.js";
import { hashPassword, verifyPassword } from "../services/passwordService.js";
import { hashToken } from "../services/tokenService.js";

function sanitizeUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    avatar_url: user.avatar_url,
    status: user.status,
    email_verified: user.email_verified,
    last_login_at: user.last_login_at,
    roles: user.roles
  };
}

function buildAuthResponse(user, tokenBundle) {
  return {
    user: sanitizeUser(user),
    access_token: tokenBundle.accessToken,
    refresh_token: tokenBundle.refreshToken,
    token_type: "Bearer",
    access_expires_at: tokenBundle.accessExpiresAt,
    refresh_expires_at: tokenBundle.refreshExpiresAt
  };
}

function validateCredentials(body, requireFullName = false) {
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (requireFullName && !fullName) {
    return { error: "full_name is required." };
  }

  if (!email || !password) {
    return { error: "email and password are required." };
  }

  return { fullName, email, password };
}

export function createAuthController({ repository, tokenService }) {
  return {
    register: async (request, response) => {
      const payload = validateCredentials(request.body, true);
      if (payload.error) {
        badRequest(response, "INVALID_PAYLOAD", payload.error);
        return;
      }

      try {
        const existingUser = await repository.findUserByEmail(payload.email);
        if (existingUser) {
          badRequest(response, "EMAIL_EXISTS", "A user with this email already exists.");
          return;
        }

        const passwordHash = await hashPassword(payload.password);
        const user = await repository.createUser({
          fullName: payload.fullName,
          email: payload.email,
          passwordHash
        });
        const tokenBundle = tokenService.issueTokens(user);

        await repository.createRefreshToken(
          user.id,
          tokenBundle.refreshTokenHash,
          tokenBundle.refreshExpiresAt
        );

        json(response, 201, buildAuthResponse(user, tokenBundle));
      } catch (error) {
        console.error(error);
        serverError(response, "Unable to register user.");
      }
    },

    login: async (request, response) => {
      const payload = validateCredentials(request.body);
      if (payload.error) {
        badRequest(response, "INVALID_PAYLOAD", payload.error);
        return;
      }

      try {
        const user = await repository.findUserByEmail(payload.email);
        if (!user || !(await verifyPassword(payload.password, user.password_hash))) {
          unauthorized(response, "Invalid email or password.");
          return;
        }

        const tokenBundle = tokenService.issueTokens(user);
        await repository.createRefreshToken(
          user.id,
          tokenBundle.refreshTokenHash,
          tokenBundle.refreshExpiresAt
        );
        await repository.updateLastLogin(user.id);

        json(response, 200, buildAuthResponse(user, tokenBundle));
      } catch (error) {
        console.error(error);
        serverError(response, "Unable to login.");
      }
    },

    refresh: async (request, response) => {
      const refreshToken =
        typeof request.body.refresh_token === "string" ? request.body.refresh_token : "";

      if (!refreshToken) {
        badRequest(response, "INVALID_PAYLOAD", "refresh_token is required.");
        return;
      }

      try {
        const decoded = tokenService.verifyRefreshToken(refreshToken);
        const record = await repository.findRefreshToken(hashToken(refreshToken));

        if (!decoded || !record || record.revoked_at || new Date(record.expires_at) < new Date()) {
          unauthorized(response, "Invalid or expired refresh token.");
          return;
        }

        const user = await repository.findUserById(decoded.sub);
        if (!user) {
          unauthorized(response, "User no longer exists.");
          return;
        }

        await repository.revokeRefreshToken(record.token_hash);
        const tokenBundle = tokenService.issueTokens(user);
        await repository.createRefreshToken(
          user.id,
          tokenBundle.refreshTokenHash,
          tokenBundle.refreshExpiresAt
        );

        json(response, 200, buildAuthResponse(user, tokenBundle));
      } catch (error) {
        unauthorized(response, "Invalid or expired refresh token.");
      }
    },

    me: async (request, response) => {
      try {
        const userId = request.auth?.sub;
        if (!userId) {
          unauthorized(response, "Missing authenticated user.");
          return;
        }

        const user = await repository.findUserById(userId);
        if (!user) {
          unauthorized(response, "User not found.");
          return;
        }

        json(response, 200, { user: sanitizeUser(user) });
      } catch (error) {
        console.error(error);
        serverError(response, "Unable to load current user.");
      }
    }
  };
}
