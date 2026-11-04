-- DB-Migration: Tabellen 'widerrufe' und 'widerruf_consent'
-- Gesetzliche Grundlage: § 356a BGB n.F. (Widerrufsbutton) und § 356 Abs. 5 BGB (Widerrufsausschluss bei digitalen Inhalten)

CREATE TABLE IF NOT EXISTS widerrufe (
  id VARCHAR(64) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'eingegangen' -- eingegangen | in_bearbeitung | bestaetigt | abgelehnt
);

CREATE INDEX IF NOT EXISTS idx_widerrufe_email ON widerrufe(email);
CREATE INDEX IF NOT EXISTS idx_widerrufe_transaction ON widerrufe(transaction_id);

CREATE TABLE IF NOT EXISTS widerruf_consent (
  id VARCHAR(64) PRIMARY KEY,
  transaction_id VARCHAR(255) NOT NULL,
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_hash VARCHAR(128) NOT NULL,
  email VARCHAR(255),
  consent_early_execution BOOLEAN NOT NULL DEFAULT TRUE,
  consent_loss_of_withdrawal BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_widerruf_consent_tx ON widerruf_consent(transaction_id);
