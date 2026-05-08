import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "savings_contributions" (
      "id" serial PRIMARY KEY NOT NULL,
      "user_id" integer NOT NULL,
      "goal_id" integer NOT NULL,
      "source_wallet_id" integer NOT NULL,
      "amount" numeric NOT NULL,
      "date" timestamp(3) with time zone NOT NULL,
      "movement_type" varchar DEFAULT 'contribution' NOT NULL,
      "description" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "savings_contributions"
        ADD CONSTRAINT "savings_contributions_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "savings_contributions"
        ADD CONSTRAINT "savings_contributions_goal_id_savings_goals_id_fk"
        FOREIGN KEY ("goal_id") REFERENCES "public"."savings_goals"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "savings_contributions"
        ADD CONSTRAINT "savings_contributions_source_wallet_id_wallets_id_fk"
        FOREIGN KEY ("source_wallet_id") REFERENCES "public"."wallets"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "savings_contributions_user_idx" ON "savings_contributions" USING btree ("user_id");
    CREATE INDEX IF NOT EXISTS "savings_contributions_goal_idx" ON "savings_contributions" USING btree ("goal_id");
    CREATE INDEX IF NOT EXISTS "savings_contributions_source_wallet_idx" ON "savings_contributions" USING btree ("source_wallet_id");
    CREATE INDEX IF NOT EXISTS "savings_contributions_date_idx" ON "savings_contributions" USING btree ("date");
    CREATE INDEX IF NOT EXISTS "savings_contributions_updated_at_idx" ON "savings_contributions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "savings_contributions_created_at_idx" ON "savings_contributions" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "savings_contributions" CASCADE;
  `)
}
