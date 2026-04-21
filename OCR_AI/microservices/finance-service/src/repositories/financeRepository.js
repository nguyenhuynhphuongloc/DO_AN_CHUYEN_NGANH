import { withFinanceTransaction } from "../db/pool.js";

const resourceConfigs = {
  wallets: {
    table: "wallets",
    returning: `
      id,
      user_id,
      name,
      wallet_type,
      currency,
      balance::float8 as balance,
      is_default,
      created_at,
      updated_at
    `,
    insertFields: ["name", "wallet_type", "currency", "balance", "is_default"],
    updateFields: ["name", "wallet_type", "currency", "balance", "is_default"]
  },
  categories: {
    table: "categories",
    returning: `
      id,
      user_id,
      name,
      category_type,
      parent_id,
      icon,
      color,
      is_system,
      is_active,
      created_at,
      updated_at
    `,
    insertFields: ["name", "category_type", "parent_id", "icon", "color", "is_system", "is_active"],
    updateFields: ["name", "category_type", "parent_id", "icon", "color", "is_system", "is_active"]
  },
  budgetProfiles: {
    table: "budget_profiles",
    returning: `
      id,
      user_id,
      name,
      base_amount::float8 as base_amount,
      currency,
      calculation_mode,
      is_active,
      effective_from,
      effective_to,
      created_at,
      updated_at
    `,
    insertFields: ["name", "base_amount", "currency", "calculation_mode", "is_active", "effective_from", "effective_to"],
    updateFields: ["name", "base_amount", "currency", "calculation_mode", "is_active", "effective_from", "effective_to"]
  },
  categoryAllocationRules: {
    table: "category_allocation_rules",
    returning: `
      id,
      user_id,
      budget_profile_id,
      category_id,
      allocation_mode,
      allocation_value::float8 as allocation_value,
      priority,
      is_active,
      created_at,
      updated_at
    `,
    insertFields: ["budget_profile_id", "category_id", "allocation_mode", "allocation_value", "priority", "is_active"],
    updateFields: ["budget_profile_id", "category_id", "allocation_mode", "allocation_value", "priority", "is_active"]
  }
};

function buildInsert(config, userId, payload) {
  const fields = config.insertFields.filter((field) => Object.hasOwn(payload, field));
  const columns = ["user_id", ...fields];
  const values = [userId, ...fields.map((field) => payload[field])];
  const placeholders = columns.map((_column, index) => `$${index + 1}`);

  return {
    text: `insert into ${config.table} (${columns.join(", ")}) values (${placeholders.join(", ")}) returning ${config.returning}`,
    values
  };
}

function buildUpdate(config, userId, resourceId, payload) {
  const fields = config.updateFields.filter((field) => Object.hasOwn(payload, field));

  if (!fields.length) {
    return null;
  }

  const values = fields.map((field) => payload[field]);
  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);

  return {
    text: `
      update ${config.table}
      set ${assignments.join(", ")}
      where id = $${fields.length + 1} and user_id = $${fields.length + 2}
      returning ${config.returning}
    `,
    values: [...values, resourceId, userId]
  };
}

function normalizeTransaction(row) {
  return row
    ? {
        ...row,
        amount: Number(row.amount),
        ...(row.wallet_balance !== undefined ? { wallet_balance: Number(row.wallet_balance) } : {}),
        ...(row.amount_limit !== undefined ? { amount_limit: Number(row.amount_limit) } : {}),
        ...(row.spent_amount !== undefined ? { spent_amount: Number(row.spent_amount) } : {}),
        ...(row.remaining_amount !== undefined ? { remaining_amount: Number(row.remaining_amount) } : {})
      }
    : null;
}

function normalizePaymentMethod(paymentMethod) {
  if (!paymentMethod) {
    return null;
  }

  const normalized = String(paymentMethod).trim().toLowerCase();
  const mapping = {
    cash: "cash",
    "credit card": "credit_card",
    credit_card: "credit_card",
    "debit card": "debit_card",
    debit_card: "debit_card",
    "bank transfer": "bank_transfer",
    bank_transfer: "bank_transfer",
    "e-wallet": "e_wallet",
    e_wallet: "e_wallet",
    wallet: "e_wallet",
    other: "other"
  };

  return mapping[normalized] || "other";
}

export function createFinanceRepository(pool) {
  return {
    async listResource(resourceType, userId) {
      const config = resourceConfigs[resourceType];
      const result = await pool.query(
        `select ${config.returning} from ${config.table} where user_id = $1 order by created_at desc`,
        [userId]
      );
      return result.rows;
    },

    async createResource(resourceType, userId, payload) {
      const config = resourceConfigs[resourceType];
      const query = buildInsert(config, userId, payload);
      const result = await pool.query(query.text, query.values);
      return result.rows[0];
    },

    async updateResource(resourceType, userId, resourceId, payload) {
      const config = resourceConfigs[resourceType];
      const query = buildUpdate(config, userId, resourceId, payload);
      if (!query) {
        return null;
      }

      const result = await pool.query(query.text, query.values);
      return result.rows[0] || null;
    },

    async listTransactions(userId) {
      const result = await pool.query(
        `
          select
            id,
            user_id,
            wallet_id,
            category_id,
            amount::float8 as amount,
            currency,
            transaction_type,
            note,
            merchant_name,
            transaction_date,
            payment_method,
            source_type,
            source_ref_id,
            receipt_reference,
            created_at,
            updated_at
          from transactions
          where user_id = $1
          order by transaction_date desc, created_at desc
        `,
        [userId]
      );

      return result.rows.map(normalizeTransaction);
    },

    async createTransaction(userId, payload) {
      return withFinanceTransaction(pool, async (client) => {
        const walletResult = await client.query(
          "select id, balance::float8 as balance from wallets where id = $1 and user_id = $2 limit 1",
          [payload.wallet_id, userId]
        );

        if (!walletResult.rows[0]) {
          throw new Error("WALLET_NOT_FOUND");
        }

        const result = await client.query(
          `
            insert into transactions (
              user_id,
              wallet_id,
              category_id,
              amount,
              currency,
              transaction_type,
              note,
              merchant_name,
              transaction_date,
              payment_method,
              source_type,
              source_ref_id,
              receipt_reference
            )
            values (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
            returning
              id,
              user_id,
              wallet_id,
              category_id,
              amount::float8 as amount,
              currency,
              transaction_type,
              note,
              merchant_name,
              transaction_date,
              payment_method,
              source_type,
              source_ref_id,
              receipt_reference,
              created_at,
              updated_at
          `,
          [
            userId,
            payload.wallet_id,
            payload.category_id || null,
            payload.amount,
            payload.currency || "VND",
            payload.transaction_type,
            payload.note || null,
            payload.merchant_name || null,
            payload.transaction_date,
            payload.payment_method || null,
            payload.source_type || "manual",
            payload.source_ref_id || null,
            payload.receipt_reference || null
          ]
        );

        const transaction = result.rows[0];
        const walletDelta =
          payload.transaction_type === "expense"
            ? -Number(payload.amount)
            : payload.transaction_type === "income"
              ? Number(payload.amount)
              : 0;

        const walletUpdate = await client.query(
          `
            update wallets
            set balance = balance + $1
            where id = $2 and user_id = $3
            returning balance::float8 as wallet_balance
          `,
          [walletDelta, payload.wallet_id, userId]
        );

        let budgetSummary = null;

        if (payload.transaction_type === "expense" && payload.category_id) {
          const transactionDate = new Date(payload.transaction_date);
          const month = transactionDate.getUTCMonth() + 1;
          const year = transactionDate.getUTCFullYear();

          const activeProfileResult = await client.query(
            `
              select id, base_amount::float8 as base_amount
              from budget_profiles
              where user_id = $1
                and is_active = true
                and effective_from <= $2::date
                and (effective_to is null or effective_to >= $2::date)
              order by effective_from desc
              limit 1
            `,
            [userId, transactionDate.toISOString()]
          );

          const activeProfile = activeProfileResult.rows[0];

          if (activeProfile) {
            const budgetResult = await client.query(
              `
                select id, amount_limit::float8 as amount_limit, spent_amount::float8 as spent_amount
                from budgets
                where user_id = $1 and budget_profile_id = $2 and category_id = $3 and month = $4 and year = $5
                limit 1
              `,
              [userId, activeProfile.id, payload.category_id, month, year]
            );

            if (budgetResult.rows[0]) {
              const updatedBudget = await client.query(
                `
                  update budgets
                  set
                    spent_amount = spent_amount + $1,
                    remaining_amount = amount_limit - (spent_amount + $1)
                  where id = $2
                  returning
                    id,
                    amount_limit::float8 as amount_limit,
                    spent_amount::float8 as spent_amount,
                    remaining_amount::float8 as remaining_amount
                `,
                [payload.amount, budgetResult.rows[0].id]
              );
              budgetSummary = normalizeTransaction(updatedBudget.rows[0]);
            } else {
              const ruleResult = await client.query(
                `
                  select allocation_mode, allocation_value::float8 as allocation_value
                  from category_allocation_rules
                  where user_id = $1 and budget_profile_id = $2 and category_id = $3 and is_active = true
                  order by priority desc, created_at asc
                  limit 1
                `,
                [userId, activeProfile.id, payload.category_id]
              );

              const rule = ruleResult.rows[0];
              const amountLimit = rule
                ? rule.allocation_mode === "percentage"
                  ? (Number(activeProfile.base_amount) * Number(rule.allocation_value)) / 100
                  : Number(rule.allocation_value)
                : 0;

              const createdBudget = await client.query(
                `
                  insert into budgets (
                    user_id,
                    budget_profile_id,
                    category_id,
                    month,
                    year,
                    amount_limit,
                    spent_amount,
                    remaining_amount
                  )
                  values ($1, $2, $3, $4, $5, $6, $7, $8)
                  returning
                    id,
                    amount_limit::float8 as amount_limit,
                    spent_amount::float8 as spent_amount,
                    remaining_amount::float8 as remaining_amount
                `,
                [
                  userId,
                  activeProfile.id,
                  payload.category_id,
                  month,
                  year,
                  amountLimit,
                  payload.amount,
                  amountLimit - Number(payload.amount)
                ]
              );
              budgetSummary = normalizeTransaction(createdBudget.rows[0]);
            }
          }
        }

        return {
          transaction: normalizeTransaction(transaction),
          wallet_balance: walletUpdate.rows[0]?.wallet_balance ?? null,
          budget: budgetSummary
        };
      });
    },

    async createConfirmedOcrTransaction(userId, payload, context = {}) {
      const walletId = payload.wallet_id || context.walletId;

      if (!walletId) {
        throw new Error("MISSING_WALLET_ID");
      }

      let categoryId = payload.category_id || null;

      if (!categoryId && payload.final_category) {
        const categoryResult = await pool.query(
          `
            select id
            from categories
            where user_id = $1 and lower(name) = lower($2) and category_type = 'expense'
            limit 1
          `,
          [userId, payload.final_category]
        );
        categoryId = categoryResult.rows[0]?.id || null;
      }

      return this.createTransaction(userId, {
        wallet_id: walletId,
        category_id: categoryId,
        amount: payload.total_amount,
        currency: payload.currency || "VND",
        transaction_type: "expense",
        note: payload.notes || null,
        merchant_name: payload.merchant_name || null,
        transaction_date: payload.transaction_datetime,
        payment_method: normalizePaymentMethod(payload.payment_method),
        source_type: "receipt",
        receipt_reference: payload.original_suggested_category || payload.ai_suggested_category || null
      });
    }
  };
}
