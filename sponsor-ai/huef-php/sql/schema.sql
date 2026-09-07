-- =============================================================================
-- HUEF Online Application Screening and Management System
-- MySQL / MariaDB schema (PHP, HTML, CSS, JavaScript edition)
-- Academic year: 2026 Tuition Fee Assistance
--
-- Import this file first in phpMyAdmin or:
--   mysql -u USER -p DATABASE_NAME < sql/schema.sql
-- Then import sql/seed.sql for demo records.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS screening_history;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS applicants;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS institutions;
DROP TABLE IF EXISTS llgs;
DROP TABLE IF EXISTS districts;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS application_periods;
DROP TABLE IF EXISTS system_settings;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE districts (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE llgs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  district_id VARCHAR(36) NOT NULL,
  UNIQUE KEY uq_llg_district_name (district_id, name),
  CONSTRAINT fk_llg_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE institutions (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  code VARCHAR(16) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(120) NOT NULL,
  province VARCHAR(120) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE programs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  institution_id VARCHAR(36) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  KEY idx_program_name (name),
  CONSTRAINT fk_program_institution FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  google_id VARCHAR(190) NULL UNIQUE,
  auth_provider VARCHAR(40) NOT NULL DEFAULT 'PASSWORD',
  role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applicants (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  given_name VARCHAR(120) NOT NULL,
  surname VARCHAR(120) NOT NULL,
  gender CHAR(1) NOT NULL,
  date_of_birth VARCHAR(20) NULL,
  age INT NULL,
  phone VARCHAR(40) NOT NULL,
  student_id VARCHAR(80) NULL,
  photo_mime VARCHAR(80) NULL,
  photo_bytes LONGBLOB NULL,
  clan_name VARCHAR(120) NULL,
  ward_village VARCHAR(160) NULL,
  llg_name VARCHAR(120) NULL,
  llg_id VARCHAR(36) NULL,
  district_id VARCHAR(36) NULL,
  province VARCHAR(80) NULL DEFAULT 'Hela',
  father_full_name VARCHAR(160) NULL,
  father_occupation VARCHAR(160) NULL,
  father_clan VARCHAR(120) NULL,
  father_ward VARCHAR(120) NULL,
  father_llg VARCHAR(120) NULL,
  father_district VARCHAR(120) NULL,
  father_province VARCHAR(80) NULL,
  father_phone VARCHAR(40) NULL,
  father_email VARCHAR(160) NULL,
  mother_full_name VARCHAR(160) NULL,
  mother_occupation VARCHAR(160) NULL,
  mother_clan VARCHAR(120) NULL,
  mother_ward VARCHAR(120) NULL,
  mother_llg VARCHAR(120) NULL,
  mother_district VARCHAR(120) NULL,
  mother_province VARCHAR(80) NULL,
  mother_phone VARCHAR(40) NULL,
  mother_email VARCHAR(160) NULL,
  eligibility_path VARCHAR(40) NOT NULL DEFAULT 'HELA_ORIGIN',
  public_servant_who VARCHAR(80) NULL,
  public_servant_department VARCHAR(160) NULL,
  public_servant_occupation VARCHAR(160) NULL,
  public_servant_years INT NULL,
  public_servant_supervisor VARCHAR(160) NULL,
  public_servant_supervisor_phone VARCHAR(40) NULL,
  parent_origin_district VARCHAR(120) NULL,
  parent_origin_province VARCHAR(80) NULL,
  CONSTRAINT fk_applicant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_applicant_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
  CONSTRAINT fk_applicant_llg FOREIGN KEY (llg_id) REFERENCES llgs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applications (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  applicant_id VARCHAR(36) NOT NULL,
  institution_id VARCHAR(36) NOT NULL,
  district_id VARCHAR(36) NULL,
  academic_year VARCHAR(8) NOT NULL DEFAULT '2026',
  program_name VARCHAR(255) NOT NULL,
  study_type VARCHAR(80) NULL,
  study_level VARCHAR(80) NOT NULL,
  year_of_study VARCHAR(80) NOT NULL,
  expected_completion VARCHAR(40) NULL,
  institution_province VARCHAR(80) NULL,
  registrar_phone VARCHAR(40) NULL,
  registrar_email VARCHAR(160) NULL,
  applicant_type VARCHAR(40) NOT NULL,
  last_secondary_school VARCHAR(160) NULL,
  year_completed VARCHAR(20) NULL,
  fee_category VARCHAR(40) NOT NULL,
  other_fee_type VARCHAR(120) NULL,
  tuition_fees VARCHAR(40) NULL,
  account_name VARCHAR(160) NULL,
  account_number VARCHAR(80) NULL,
  bank_name VARCHAR(80) NULL,
  bank_branch VARCHAR(80) NULL,
  witness_name VARCHAR(160) NULL,
  witness_title VARCHAR(120) NULL,
  witness_village VARCHAR(120) NULL,
  witness_district VARCHAR(120) NULL,
  witness_phone VARCHAR(40) NULL,
  declared_at DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  status_note TEXT NULL,
  submitted_at DATETIME NULL,
  decided_at DATETIME NULL,
  decided_by_email VARCHAR(190) NULL,
  screening_json LONGTEXT NULL,
  screening_status VARCHAR(40) NULL,
  info_requested_at DATETIME NULL,
  info_request_note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_app_status (status),
  KEY idx_app_year (academic_year),
  KEY idx_app_screening (screening_status),
  CONSTRAINT fk_app_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_institution FOREIGN KEY (institution_id) REFERENCES institutions(id),
  CONSTRAINT fk_app_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE documents (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  application_id VARCHAR(36) NOT NULL,
  type VARCHAR(40) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_path VARCHAR(500) NOT NULL DEFAULT '',
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INT NOT NULL,
  contents LONGBLOB NULL,
  sha256 CHAR(64) NULL,
  screening_status VARCHAR(40) NULL,
  screening_json LONGTEXT NULL,
  extracted_text LONGTEXT NULL,
  page_estimate INT NULL,
  is_current TINYINT(1) NOT NULL DEFAULT 1,
  superseded_at DATETIME NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_doc_current (application_id, type, is_current),
  KEY idx_doc_hash (sha256),
  CONSTRAINT fk_doc_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE screening_history (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  application_id VARCHAR(36) NOT NULL,
  result_json LONGTEXT NOT NULL,
  overall_status VARCHAR(40) NOT NULL,
  run_by VARCHAR(190) NOT NULL DEFAULT 'SYSTEM',
  coordinator_override VARCHAR(40) NULL,
  override_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_hist_app (application_id),
  CONSTRAINT fk_hist_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NULL,
  application_id VARCHAR(36) NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'INFO',
  category VARCHAR(40) NOT NULL DEFAULT 'APPLICATION',
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_note_user (user_id, read_at),
  KEY idx_note_created (created_at),
  CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_note_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE announcements (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  audience VARCHAR(40) NOT NULL DEFAULT 'ALL',
  published TINYINT(1) NOT NULL DEFAULT 1,
  deadline_at DATETIME NULL,
  created_by_id VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ann_user FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  actor_id VARCHAR(36) NULL,
  actor_email VARCHAR(190) NOT NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(36) NULL,
  application_id VARCHAR(36) NULL,
  details TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_created (created_at),
  KEY idx_audit_action (action),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE application_periods (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  academic_year VARCHAR(8) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  opens_at DATETIME NOT NULL,
  closes_at DATETIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE document_types (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  label VARCHAR(160) NOT NULL,
  required_for_new TINYINT(1) NOT NULL DEFAULT 0,
  required_for_continuing TINYINT(1) NOT NULL DEFAULT 0,
  required_for_non_hela TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE system_settings (
  setting_key VARCHAR(80) NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
