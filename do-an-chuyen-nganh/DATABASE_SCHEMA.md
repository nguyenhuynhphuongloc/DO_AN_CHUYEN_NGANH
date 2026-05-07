# Database Schema

## Tables and Attributes

### `media`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| id | integer | NO |  |
| height | numeric | YES |  |
| focal_x | numeric | YES |  |
| focal_y | numeric | YES |  |
| user_id | integer | YES | -> users.id |
| owner_id | numeric | YES |  |
| updated_at | timestamp with time zone | NO |  |
| created_at | timestamp with time zone | NO |  |
| filesize | numeric | YES |  |
| width | numeric | YES |  |
| alt | character varying | NO |  |
| filename | character varying | YES |  |
| mime_type | character varying | YES |  |
| url | character varying | YES |  |
| thumbnail_u_r_l | character varying | YES |  |

### `categories`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| id | integer | NO |  |
| user_id | integer | YES | -> users.id |
| is_default | boolean | YES |  |
| updated_at | timestamp with time zone | NO |  |
| created_at | timestamp with time zone | NO |  |
| type | USER-DEFINED | NO |  |
| name | character varying | NO |  |
| note | character varying | YES |  |
| icon | character varying | YES |  |
| color | character varying | YES |  |

### `users`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| id | integer | NO |  |
| created_at | timestamp with time zone | NO |  |
| reset_password_expiration | timestamp with time zone | YES |  |
| login_attempts | numeric | YES |  |
| lock_until | timestamp with time zone | YES |  |
| role | USER-DEFINED | NO |  |
| currency | USER-DEFINED | YES |  |
| avatar_id | integer | YES | -> media.id |
| updated_at | timestamp with time zone | NO |  |
| name | character varying | YES |  |
| email | character varying | NO |  |
| reset_password_token | character varying | YES |  |
| hash | character varying | YES |  |
| salt | character varying | YES |  |

### `users_sessions`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| _order | integer | NO |  |
| _parent_id | integer | NO | -> users.id |
| created_at | timestamp with time zone | YES |  |
| expires_at | timestamp with time zone | NO |  |
| id | character varying | NO |  |

### `savings_goals`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| id | integer | NO |  |
| owner_id | integer | YES | -> users.id |
| updated_at | timestamp with time zone | NO |  |
| created_at | timestamp with time zone | NO |  |
| target_amount | numeric | NO |  |
| current_amount | numeric | YES |  |
| status | USER-DEFINED | YES |  |
| title | character varying | NO |  |
| color | character varying | YES |  |
| icon | character varying | YES |  |

### `notifications`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| created_at | timestamp with time zone | NO |  |
| recipient_id | integer | NO | -> users.id |
| updated_at | timestamp with time zone | NO |  |
| id | integer | NO |  |
| type | USER-DEFINED | NO |  |
| read | boolean | YES |  |
| message | character varying | NO |  |
| link | character varying | YES |  |

### `savings_goals_rels`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| id | integer | NO |  |
| order | integer | YES |  |
| parent_id | integer | NO | -> savings_goals.id |
| users_id | integer | YES | -> users.id |
| path | character varying | NO |  |

### `transactions`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| id | integer | NO |  |
| type | USER-DEFINED | NO |  |
| amount | numeric | NO |  |
| category_id | integer | NO | -> categories.id |
| receipt_id | integer | YES |  |
| user_id | integer | NO | -> users.id |
| updated_at | timestamp with time zone | NO |  |
| created_at | timestamp with time zone | NO |  |
| savings_goal_id | integer | YES | -> savings_goals.id |
| wallet_id | integer | YES | -> wallets.id |
| date | timestamp with time zone | NO |  |
| description | character varying | YES |  |
| source_type | character varying | YES |  |
| note | character varying | YES |  |
| source_ref_id | character varying | YES |  |
| currency | character varying | YES |  |
| merchant_name | character varying | YES |  |

### `receipt_parse_sessions`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| updated_at | timestamp with time zone | NO |  |
| user_id | integer | NO | -> users.id |
| ocr_confidence_score | numeric | YES |  |
| transaction_date | date | YES |  |
| total_amount | numeric | YES |  |
| tax_amount | numeric | YES |  |
| extracted_json | jsonb | YES |  |
| extraction_confidence_score | numeric | YES |  |
| reviewer_feedback_json | jsonb | YES |  |
| confirmed_receipt_id | integer | YES | -> receipts.id |
| processed_at | timestamp with time zone | YES |  |
| expires_at | timestamp with time zone | NO |  |
| finalized_at | timestamp with time zone | YES |  |
| created_at | timestamp with time zone | NO |  |
| id | uuid | NO |  |
| file_size | bigint | YES |  |
| ocr_debug_json | jsonb | YES |  |
| file_name | character varying | NO |  |
| temp_url | text | NO |  |
| permanent_url | text | YES |  |
| mime_type | character varying | YES |  |
| reviewer_note | text | YES |  |
| image_hash | character varying | YES |  |
| status | character varying | NO |  |
| ocr_provider | character varying | YES |  |
| ocr_raw_text | text | YES |  |
| review_status | character varying | NO |  |
| currency | character varying | YES |  |
| merchant_name | character varying | YES |  |
| finance_transaction_id | character varying | YES |  |

### `wallets`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| is_active | boolean | NO |  |
| user_id | integer | NO | -> users.id |
| created_at | timestamp with time zone | NO |  |
| monthly_spending_limit | numeric | YES |  |
| id | integer | NO |  |
| balance | numeric | NO |  |
| is_default | boolean | NO |  |
| updated_at | timestamp with time zone | NO |  |
| name | character varying | NO |  |
| wallet_type | character varying | NO |  |
| currency | character varying | NO |  |

### `receipts`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| id | integer | NO |  |
| user_id | integer | NO | -> users.id |
| file_size | numeric | YES |  |
| uploaded_at | timestamp with time zone | NO |  |
| processed_at | timestamp with time zone | YES |  |
| updated_at | timestamp with time zone | NO |  |
| created_at | timestamp with time zone | NO |  |
| file_name | character varying | NO |  |
| image_url | text | NO |  |
| mime_type | character varying | YES |  |
| status | character varying | NO |  |
| image_hash | character varying | YES |  |

### `receipt_parser_results`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| created_at | timestamp with time zone | NO |  |
| receipt_id | integer | NO | -> receipts.id |
| suggested_category_id | integer | YES | -> categories.id |
| updated_at | timestamp with time zone | NO |  |
| id | integer | NO |  |
| provider_json | jsonb | YES |  |
| normalized_json | jsonb | YES |  |
| provider | character varying | NO |  |
| raw_text | text | YES |  |
| suggested_description | text | YES |  |

### `budgets`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| is_active | boolean | NO |  |
| category_id | integer | NO | -> categories.id |
| amount | numeric | NO |  |
| period | USER-DEFINED | NO |  |
| user_id | integer | NO | -> users.id |
| updated_at | timestamp with time zone | NO |  |
| created_at | timestamp with time zone | NO |  |
| wallet_id | integer | YES | -> wallets.id |
| month | numeric | YES |  |
| year | numeric | YES |  |
| id | integer | NO |  |
| alert_thresholds | jsonb | YES |  |
| note | character varying | YES |  |

### `receipt_parse_jobs`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| id | uuid | NO |  |
| session_id | uuid | NO | -> receipt_parse_sessions.id |
| started_at | timestamp with time zone | YES |  |
| finished_at | timestamp with time zone | YES |  |
| created_at | timestamp with time zone | NO |  |
| job_type | character varying | NO |  |
| status | character varying | NO |  |
| error_message | text | YES |  |

### `savings_contributions`

| Column Name | Data Type | Nullable | Foreign Key |
| ----------- | --------- | -------- | ----------- |
| created_at | timestamp with time zone | NO |  |
| user_id | integer | NO | -> users.id |
| goal_id | integer | NO | -> savings_goals.id |
| source_wallet_id | integer | NO | -> wallets.id |
| amount | numeric | NO |  |
| date | timestamp with time zone | NO |  |
| id | integer | NO |  |
| updated_at | timestamp with time zone | NO |  |
| description | character varying | YES |  |

## Entity-Relationship Diagram

```mermaid
erDiagram
  media {
    integer id PK
    numeric height
    numeric focal_x
    numeric focal_y
    integer user_id FK
    numeric owner_id
    timestamp_with_time_zone updated_at
    timestamp_with_time_zone created_at
    numeric filesize
    numeric width
    character_varying alt
    character_varying filename
    character_varying mime_type
    character_varying url
    character_varying thumbnail_u_r_l
  }

  categories {
    integer id PK
    integer user_id FK
    boolean is_default
    timestamp_with_time_zone updated_at
    timestamp_with_time_zone created_at
    USER_DEFINED type
    character_varying name
    character_varying note
    character_varying icon
    character_varying color
  }

  users {
    integer id PK
    timestamp_with_time_zone created_at
    timestamp_with_time_zone reset_password_expiration
    numeric login_attempts
    timestamp_with_time_zone lock_until
    USER_DEFINED role
    USER_DEFINED currency
    integer avatar_id FK
    timestamp_with_time_zone updated_at
    character_varying name
    character_varying email
    character_varying reset_password_token
    character_varying hash
    character_varying salt
  }

  users_sessions {
    integer _order
    integer _parent_id FK
    timestamp_with_time_zone created_at
    timestamp_with_time_zone expires_at
    character_varying id PK
  }

  savings_goals {
    integer id PK
    integer owner_id FK
    timestamp_with_time_zone updated_at
    timestamp_with_time_zone created_at
    numeric target_amount
    numeric current_amount
    USER_DEFINED status
    character_varying title
    character_varying color
    character_varying icon
  }

  notifications {
    timestamp_with_time_zone created_at
    integer recipient_id FK
    timestamp_with_time_zone updated_at
    integer id PK
    USER_DEFINED type
    boolean read
    character_varying message
    character_varying link
  }

  savings_goals_rels {
    integer id PK
    integer order
    integer parent_id FK
    integer users_id FK
    character_varying path
  }

  transactions {
    integer id PK
    USER_DEFINED type
    numeric amount
    integer category_id FK
    integer receipt_id
    integer user_id FK
    timestamp_with_time_zone updated_at
    timestamp_with_time_zone created_at
    integer savings_goal_id FK
    integer wallet_id FK
    timestamp_with_time_zone date
    character_varying description
    character_varying source_type
    character_varying note
    character_varying source_ref_id
    character_varying currency
    character_varying merchant_name
  }

  receipt_parse_sessions {
    timestamp_with_time_zone updated_at
    integer user_id FK
    numeric ocr_confidence_score
    date transaction_date
    numeric total_amount
    numeric tax_amount
    jsonb extracted_json
    numeric extraction_confidence_score
    jsonb reviewer_feedback_json
    integer confirmed_receipt_id FK
    timestamp_with_time_zone processed_at
    timestamp_with_time_zone expires_at
    timestamp_with_time_zone finalized_at
    timestamp_with_time_zone created_at
    uuid id PK
    bigint file_size
    jsonb ocr_debug_json
    character_varying file_name
    text temp_url
    text permanent_url
    character_varying mime_type
    text reviewer_note
    character_varying image_hash
    character_varying status
    character_varying ocr_provider
    text ocr_raw_text
    character_varying review_status
    character_varying currency
    character_varying merchant_name
    character_varying finance_transaction_id
  }

  wallets {
    boolean is_active
    integer user_id FK
    timestamp_with_time_zone created_at
    numeric monthly_spending_limit
    integer id PK
    numeric balance
    boolean is_default
    timestamp_with_time_zone updated_at
    character_varying name
    character_varying wallet_type
    character_varying currency
  }

  receipts {
    integer id PK
    integer user_id FK
    numeric file_size
    timestamp_with_time_zone uploaded_at
    timestamp_with_time_zone processed_at
    timestamp_with_time_zone updated_at
    timestamp_with_time_zone created_at
    character_varying file_name
    text image_url
    character_varying mime_type
    character_varying status
    character_varying image_hash
  }

  receipt_parser_results {
    timestamp_with_time_zone created_at
    integer receipt_id FK
    integer suggested_category_id FK
    timestamp_with_time_zone updated_at
    integer id PK
    jsonb provider_json
    jsonb normalized_json
    character_varying provider
    text raw_text
    text suggested_description
  }

  budgets {
    boolean is_active
    integer category_id FK
    numeric amount
    USER_DEFINED period
    integer user_id FK
    timestamp_with_time_zone updated_at
    timestamp_with_time_zone created_at
    integer wallet_id FK
    numeric month
    numeric year
    integer id PK
    jsonb alert_thresholds
    character_varying note
  }

  receipt_parse_jobs {
    uuid id PK
    uuid session_id FK
    timestamp_with_time_zone started_at
    timestamp_with_time_zone finished_at
    timestamp_with_time_zone created_at
    character_varying job_type
    character_varying status
    text error_message
  }

  savings_contributions {
    timestamp_with_time_zone created_at
    integer user_id FK
    integer goal_id FK
    integer source_wallet_id FK
    numeric amount
    timestamp_with_time_zone date
    integer id PK
    timestamp_with_time_zone updated_at
    character_varying description
  }

  users ||--o{ media : "user_id"
  users ||--o{ categories : "user_id"
  media ||--o{ users : "avatar_id"
  users ||--o{ users_sessions : "_parent_id"
  users ||--o{ savings_goals : "owner_id"
  users ||--o{ notifications : "recipient_id"
  savings_goals ||--o{ savings_goals_rels : "parent_id"
  users ||--o{ savings_goals_rels : "users_id"
  categories ||--o{ transactions : "category_id"
  users ||--o{ transactions : "user_id"
  savings_goals ||--o{ transactions : "savings_goal_id"
  wallets ||--o{ transactions : "wallet_id"
  users ||--o{ receipt_parse_sessions : "user_id"
  receipts ||--o{ receipt_parse_sessions : "confirmed_receipt_id"
  users ||--o{ wallets : "user_id"
  users ||--o{ receipts : "user_id"
  receipts ||--o{ receipt_parser_results : "receipt_id"
  categories ||--o{ receipt_parser_results : "suggested_category_id"
  categories ||--o{ budgets : "category_id"
  users ||--o{ budgets : "user_id"
  wallets ||--o{ budgets : "wallet_id"
  receipt_parse_sessions ||--o{ receipt_parse_jobs : "session_id"
  users ||--o{ savings_contributions : "user_id"
  savings_goals ||--o{ savings_contributions : "goal_id"
  wallets ||--o{ savings_contributions : "source_wallet_id"
```
