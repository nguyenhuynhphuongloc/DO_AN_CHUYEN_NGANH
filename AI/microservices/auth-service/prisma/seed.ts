import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password.util';

const prisma = new PrismaClient();

async function main() {
  const passwordRecord = hashPassword('123456');
  const users = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM public.users
    WHERE email = ${'testuser@example.com'}
    LIMIT 1
  `;

  let userId = users[0]?.id;
  if (!userId) {
    const insertedUsers = await prisma.$queryRaw<Array<{ id: number }>>`
      INSERT INTO public.users (email, name, currency, role, salt, hash, login_attempts)
      VALUES (${ 'testuser@example.com' }, ${ 'Test User' }, ${ 'VND' }, ${ 'user' }, ${passwordRecord.salt}, ${passwordRecord.hash}, 0)
      RETURNING id
    `;
    userId = insertedUsers[0].id;
  } else {
    await prisma.$executeRaw`
      UPDATE public.users
      SET name = ${'Test User'},
          currency = ${'VND'},
          role = ${'user'},
          salt = ${passwordRecord.salt},
          hash = ${passwordRecord.hash},
          login_attempts = 0,
          lock_until = NULL,
          updated_at = NOW()
      WHERE id = ${userId}
    `;
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRaw`
    INSERT INTO public.wallets (user_id, name, wallet_type, currency, balance, is_default)
    SELECT ${userId}, ${'Default Wallet'}, ${'cash'}, ${'VND'}, 0, TRUE
    WHERE NOT EXISTS (
      SELECT 1 FROM public.wallets WHERE user_id = ${userId}
    )
  `;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
