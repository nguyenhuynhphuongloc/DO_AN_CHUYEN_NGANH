import * as migration_20260506_185600_add_savings_contributions from './20260506_185600_add_savings_contributions';
import * as migration_20260508_130000_add_ai_chat_logs_schema from './20260508_130000_add_ai_chat_logs_schema';

export const migrations = [
  {
    up: migration_20260506_185600_add_savings_contributions.up,
    down: migration_20260506_185600_add_savings_contributions.down,
    name: '20260506_185600_add_savings_contributions'
  },
  {
    up: migration_20260508_130000_add_ai_chat_logs_schema.up,
    down: migration_20260508_130000_add_ai_chat_logs_schema.down,
    name: '20260508_130000_add_ai_chat_logs_schema'
  },
];
