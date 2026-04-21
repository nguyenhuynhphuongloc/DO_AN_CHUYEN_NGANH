import { withTransaction } from "../db/pool.js";

function mapUser(row, roles = []) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    avatar_url: row.avatar_url,
    status: row.status,
    email_verified: row.email_verified,
    last_login_at: row.last_login_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    roles
  };
}

export function createAuthRepository(pool) {
  return {
    async createUser({ fullName, email, passwordHash }) {
      return withTransaction(pool, async (client) => {
        const userResult = await client.query(
          `
            insert into users (full_name, email, password_hash)
            values ($1, $2, $3)
            returning id, full_name, email, avatar_url, status, email_verified, last_login_at, created_at, updated_at
          `,
          [fullName, email, passwordHash]
        );
        const user = userResult.rows[0];

        await client.query(
          `
            insert into user_roles (user_id, role_id)
            select $1, id from roles where name = 'user'
            on conflict do nothing
          `,
          [user.id]
        );

        const roles = await client.query(
          `
            select roles.name
            from roles
            join user_roles on user_roles.role_id = roles.id
            where user_roles.user_id = $1
            order by roles.name
          `,
          [user.id]
        );

        return mapUser(user, roles.rows.map((row) => row.name));
      });
    },

    async findUserByEmail(email) {
      const userResult = await pool.query(
        `
          select id, full_name, email, avatar_url, status, email_verified, last_login_at, created_at, updated_at, password_hash
          from users
          where lower(email) = lower($1)
          limit 1
        `,
        [email]
      );
      const row = userResult.rows[0];

      if (!row) {
        return null;
      }

      const roles = await this.getRolesForUser(row.id);

      return {
        ...mapUser(row, roles),
        password_hash: row.password_hash
      };
    },

    async findUserById(userId) {
      const userResult = await pool.query(
        `
          select id, full_name, email, avatar_url, status, email_verified, last_login_at, created_at, updated_at
          from users
          where id = $1
          limit 1
        `,
        [userId]
      );

      const row = userResult.rows[0];
      if (!row) {
        return null;
      }

      return mapUser(row, await this.getRolesForUser(userId));
    },

    async getRolesForUser(userId) {
      const result = await pool.query(
        `
          select roles.name
          from roles
          join user_roles on user_roles.role_id = roles.id
          where user_roles.user_id = $1
          order by roles.name
        `,
        [userId]
      );

      return result.rows.map((row) => row.name);
    },

    async updateLastLogin(userId) {
      await pool.query("update users set last_login_at = now() where id = $1", [userId]);
    },

    async createRefreshToken(userId, tokenHash, expiresAt) {
      const result = await pool.query(
        `
          insert into refresh_tokens (user_id, token_hash, expires_at)
          values ($1, $2, $3)
          returning id, user_id, token_hash, expires_at, revoked_at, created_at
        `,
        [userId, tokenHash, expiresAt]
      );

      return result.rows[0];
    },

    async findRefreshToken(tokenHash) {
      const result = await pool.query(
        `
          select id, user_id, token_hash, expires_at, revoked_at, created_at
          from refresh_tokens
          where token_hash = $1
          limit 1
        `,
        [tokenHash]
      );

      return result.rows[0] || null;
    },

    async revokeRefreshToken(tokenHash) {
      await pool.query(
        `
          update refresh_tokens
          set revoked_at = now()
          where token_hash = $1 and revoked_at is null
        `,
        [tokenHash]
      );
    }
  };
}
