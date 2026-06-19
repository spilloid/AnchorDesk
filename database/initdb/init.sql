-- materialticket database schema
-- MariaDB / MySQL compatible
-- Local database is the source of truth; external systems sync into it.

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- users: identity cache from OIDC provider (Azure AD, Authentik, etc.)
-- No passwords stored here — auth is fully delegated to the IdP.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `oidc_sub`     VARCHAR(255) NOT NULL UNIQUE,   -- OIDC 'sub' claim (stable identity)
  `username`     VARCHAR(100) NOT NULL,
  `display_name` VARCHAR(150),
  `email`        VARCHAR(255),
  `role`         ENUM('admin', 'technician', 'readonly') NOT NULL DEFAULT 'technician',
  `last_seen_at` DATETIME,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- tickets: the core entity — created locally or synced from an external source
-- external_id + external_provider together identify the upstream record (nullable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tickets` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_number`     VARCHAR(50),                -- external ticket # (CW, etc.) or null
  `title`             VARCHAR(255) NOT NULL,
  `summary`           VARCHAR(500),
  `description`       TEXT,
  `status`            VARCHAR(100) NOT NULL DEFAULT 'New',
  `priority`          VARCHAR(50),
  `company_name`      VARCHAR(150),
  `assignee`          VARCHAR(100),               -- display name of assigned technician
  `assignee_id`       INT,                        -- FK to users (nullable for external)
  `source`            ENUM('local', 'connectwise', 'imap', 'api') NOT NULL DEFAULT 'local',
  `external_id`       VARCHAR(100),               -- ID in the upstream system
  `external_provider` VARCHAR(50),                -- e.g. 'connectwise', 'imap'
  `closed_at`         DATETIME,
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uq_external` (`external_id`, `external_provider`),
  FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- notes: per-ticket notes and time entries (normalized, not JSON blobs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notes` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id`   INT NOT NULL,
  `content`     TEXT NOT NULL,
  `author`      VARCHAR(150) NOT NULL,             -- display name
  `author_id`   INT,                               -- FK to users (nullable for external)
  `note_type`   ENUM('note', 'time_entry') NOT NULL DEFAULT 'note',
  `time_start`  DATETIME,
  `time_stop`   DATETIME,
  `external_id` VARCHAR(100),                      -- ID in upstream system
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- audit_log: append-only event stream — every mutation records before/after
-- Supports full revision history per ticket or any entity.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `entity_type` VARCHAR(50) NOT NULL,             -- 'ticket', 'note', etc.
  `entity_id`   INT NOT NULL,
  `action`      ENUM('create', 'update', 'delete', 'sync') NOT NULL,
  `changed_by`  VARCHAR(255),                     -- OIDC sub of acting user, or 'system'
  `old_value`   JSON,
  `new_value`   JSON,
  `occurred_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_time`   (`occurred_at`)
);

-- ---------------------------------------------------------------------------
-- sync_providers: configured external integrations
-- Credentials live in encrypted JSON config; type drives which adapter loads.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sync_providers` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `name`           VARCHAR(100) NOT NULL UNIQUE,
  `type`           ENUM('connectwise', 'imap', 'tactical_rmm', 'meshcentral') NOT NULL,
  `config`         JSON NOT NULL,                 -- provider-specific settings
  `enabled`        TINYINT(1) NOT NULL DEFAULT 1,
  `last_synced_at` DATETIME,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- sync_log: record of each sync operation per external record
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sync_log` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `provider_id` INT NOT NULL,
  `external_id` VARCHAR(100),
  `internal_id` INT,                              -- tickets.id if matched
  `direction`   ENUM('inbound', 'outbound') NOT NULL,
  `status`      ENUM('success', 'error', 'skipped') NOT NULL,
  `message`     TEXT,
  `synced_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX `idx_sync_provider` (`provider_id`, `synced_at`),
  FOREIGN KEY (`provider_id`) REFERENCES `sync_providers`(`id`) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
