import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_ai_chat_logs_kind" AS ENUM ('advisor', 'chatbot', 'other');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_ai_chat_logs_direction" AS ENUM ('incoming', 'outgoing');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_ai_chat_logs_status" AS ENUM ('success', 'error');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "ai_chat_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "kind" "enum_ai_chat_logs_kind" NOT NULL,
      "direction" "enum_ai_chat_logs_direction" NOT NULL,
      "status" "enum_ai_chat_logs_status" NOT NULL,
      "redacted_text" varchar,
      "raw_text" varchar,
      "intent" varchar,
      "linked_transaction_id" integer,
      "metadata" jsonb,
      "error_message" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "ai_chat_logs"
        ADD CONSTRAINT "ai_chat_logs_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "ai_chat_logs"
        ADD CONSTRAINT "ai_chat_logs_linked_transaction_id_transactions_id_fk"
        FOREIGN KEY ("linked_transaction_id") REFERENCES "public"."transactions"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "ai_chat_logs_user_idx" ON "ai_chat_logs" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "ai_chat_logs_linked_transaction_idx" ON "ai_chat_logs" USING btree ("linked_transaction_id");
    CREATE INDEX IF NOT EXISTS "ai_chat_logs_updated_at_idx" ON "ai_chat_logs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "ai_chat_logs_created_at_idx" ON "ai_chat_logs" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "ai_chat_logs_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_ai_chat_logs_fk"
        FOREIGN KEY ("ai_chat_logs_id") REFERENCES "public"."ai_chat_logs"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_ai_chat_logs_id_idx"
      ON "payload_locked_documents_rels" USING btree ("ai_chat_logs_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_ai_chat_logs_id_idx";

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_ai_chat_logs_fk";
    END $$;

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "ai_chat_logs_id";

    DROP TABLE IF EXISTS "ai_chat_logs" CASCADE;
    DROP TYPE IF EXISTS "enum_ai_chat_logs_status";
    DROP TYPE IF EXISTS "enum_ai_chat_logs_direction";
    DROP TYPE IF EXISTS "enum_ai_chat_logs_kind";
  `)
}
