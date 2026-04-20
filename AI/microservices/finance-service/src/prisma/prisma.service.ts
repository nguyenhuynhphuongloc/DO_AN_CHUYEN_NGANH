import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    const maxAttempts = Number(process.env.PRISMA_CONNECT_MAX_ATTEMPTS ?? 10);
    const baseDelayMs = Number(process.env.PRISMA_CONNECT_RETRY_DELAY_MS ?? 2000);
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        const delayMs = baseDelayMs * attempt;
        console.warn(
          `[Prisma] Database connection attempt ${attempt}/${maxAttempts} failed. Retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }
}
