import * as migration_20260506_185600_add_savings_contributions from './20260506_185600_add_savings_contributions';

export const migrations = [
  {
    up: migration_20260506_185600_add_savings_contributions.up,
    down: migration_20260506_185600_add_savings_contributions.down,
    name: '20260506_185600_add_savings_contributions'
  },
];
