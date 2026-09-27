-- =====================================================================
-- Personal Expense Tracker — MySQL Schema
-- =====================================================================
-- Run:  mysql -u root -p < schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS expense_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE expense_tracker;

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(120)        NOT NULL,
  email          VARCHAR(190)        NOT NULL,
  password_hash  VARCHAR(255)        NOT NULL,
  created_at     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- categories
-- Seeded with defaults, but each user can also add their own.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  category_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED         NULL,  -- NULL = global/default category
  name           VARCHAR(80)          NOT NULL,
  type           ENUM('expense','income') NOT NULL DEFAULT 'expense',
  icon           VARCHAR(40)          NULL,       -- optional icon key for UI
  color_hex      VARCHAR(7)           NULL,       -- optional accent color for UI
  created_at     TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT uq_categories_user_name UNIQUE (user_id, name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED      NOT NULL,
  category_id      INT UNSIGNED      NOT NULL,
  amount           DECIMAL(12,2)     NOT NULL,
  transaction_date DATE              NOT NULL,
  description      VARCHAR(255)      NULL,
  cost_type        ENUM('fixed','variable') NOT NULL DEFAULT 'variable',
  transaction_type ENUM('expense','income')  NOT NULL DEFAULT 'expense',
  created_at       TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_transactions_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

-- Helpful indexes for the queries the API runs most often
CREATE INDEX idx_transactions_user_date  ON transactions (user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category   ON transactions (category_id);
CREATE INDEX idx_transactions_cost_type  ON transactions (cost_type);

-- ---------------------------------------------------------------------
-- Seed data: a demo user + default categories
-- ---------------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash)
VALUES ('Demo User', 'demo@example.com', 'CHANGE_ME_HASH')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO categories (user_id, name, type, icon, color_hex) VALUES
  (NULL, 'Groceries',      'expense', 'shopping-cart', '#22c55e'),
  (NULL, 'Rent',           'expense', 'home',          '#6366f1'),
  (NULL, 'Utilities',      'expense', 'bolt',          '#f59e0b'),
  (NULL, 'Transportation', 'expense', 'car',            '#0ea5e9'),
  (NULL, 'Dining Out',     'expense', 'utensils',      '#ec4899'),
  (NULL, 'Entertainment',  'expense', 'film',          '#a855f7'),
  (NULL, 'Health',         'expense', 'heart-pulse',   '#ef4444'),
  (NULL, 'Subscriptions',  'expense', 'repeat',        '#14b8a6'),
  (NULL, 'Salary',         'income',  'wallet',        '#10b981'),
  (NULL, 'Other',          'expense', 'more-horizontal','#64748b')
ON DUPLICATE KEY UPDATE name = VALUES(name);
