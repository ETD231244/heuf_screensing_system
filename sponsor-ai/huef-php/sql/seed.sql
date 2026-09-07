-- Demo records for the HUEF 2026 TFA screening system.
-- Run AFTER sql/schema.sql
-- Demo passwords:
--   admin@huef.pg / coordinator@huef.pg  =  HUEF2026!
--   student@huef.pg and other students   =  student123

SET NAMES utf8mb4;

INSERT INTO districts (id, name) VALUES
  ('dist_tari', 'Tari-Pori'),
  ('dist_komo', 'Komo-Hulia'),
  ('dist_koroba', 'Koroba-Lake Kopiago'),
  ('dist_magarima', 'Magarima');

INSERT INTO llgs (id, name, district_id) VALUES
  ('llg_tari_urban', 'Tari Urban', 'dist_tari'),
  ('llg_tagali', 'Tagali', 'dist_tari'),
  ('llg_hayapuga', 'Hayapuga', 'dist_tari'),
  ('llg_tebi', 'Tebi', 'dist_tari'),
  ('llg_komo_rural', 'Komo Rural', 'dist_komo'),
  ('llg_hulia', 'Hulia', 'dist_komo'),
  ('llg_koroba', 'Koroba', 'dist_koroba'),
  ('llg_north_koroba', 'North Koroba', 'dist_koroba'),
  ('llg_lake_kopiago', 'Lake Kopiago', 'dist_koroba'),
  ('llg_awi', 'Awi', 'dist_koroba'),
  ('llg_magarima_rural', 'Magarima Rural', 'dist_magarima'),
  ('llg_lower_wage', 'Lower Wage', 'dist_magarima'),
  ('llg_upper_wage', 'Upper Wage', 'dist_magarima');

INSERT INTO institutions (id, code, name, category, is_active) VALUES
  ('inst_a1', 'A1', 'University of Papua New Guinea (UPNG)', 'Major universities', 1),
  ('inst_a2', 'A2', 'University of Goroka (UOG)', 'Major universities', 1),
  ('inst_a3', 'A3', 'PNG University of Technology (UNITECH)', 'Major universities', 1),
  ('inst_a4', 'A4', 'Pacific Adventist University (PAU)', 'Major universities', 1),
  ('inst_a5', 'A5', 'Divine Word University (DWU)', 'Major universities', 1),
  ('inst_a6', 'A6', 'Don Bosco Technological Institute', 'Major universities', 1),
  ('inst_a7', 'A7', 'University of Natural Resources & Environment (UNRE)', 'Major universities', 1),
  ('inst_a8', 'A8', 'IBS University', 'Major universities', 1),
  ('inst_b1', 'B1', 'Dauli Teachers College', 'Teachers colleges', 1),
  ('inst_b2', 'B2', 'Holy Trinity Teachers College', 'Teachers colleges', 1),
  ('inst_b3', 'B3', 'Simbu Teachers College', 'Teachers colleges', 1),
  ('inst_b4', 'B4', 'Telua (Goroka) Teachers College', 'Teachers colleges', 1),
  ('inst_b5', 'B5', 'Madang Teachers College', 'Teachers colleges', 1),
  ('inst_b6', 'B6', 'Balob Teachers College', 'Teachers colleges', 1),
  ('inst_b7', 'B7', 'PNG Education Institute', 'Teachers colleges', 1),
  ('inst_b8', 'B8', 'Melanesian Nazarene Teachers College', 'Teachers colleges', 1),
  ('inst_b9', 'B9', 'Sonoma Adventist College', 'Teachers colleges', 1),
  ('inst_b10', 'B10', 'Peter Channel College of Secondary Teacher Education', 'Teachers colleges', 1),
  ('inst_b11', 'B11', 'Innovative University of Enga', 'Teachers colleges', 1),
  ('inst_b12', 'B12', 'Gaulim Teachers College', 'Teachers colleges', 1),
  ('inst_b13', 'B13', 'Kabaleo Teachers College', 'Teachers colleges', 1),
  ('inst_b14', 'B14', 'Kelua Teachers College', 'Teachers colleges', 1),
  ('inst_b15', 'B15', 'Katagu Lutheran Teachers College', 'Teachers colleges', 1),
  ('inst_b16', 'B16', 'EA Jiwaka Teachers College', 'Teachers colleges', 1),
  ('inst_b17', 'B17', 'Rev. Maru Teachers College', 'Teachers colleges', 1),
  ('inst_b18', 'B18', 'Southern Highlands Teachers College', 'Teachers colleges', 1),
  ('inst_b19', 'B19', 'UOG DFL — Hela', 'Teachers colleges', 1),
  ('inst_b20', 'B20', 'Mesauka Teachers College', 'Teachers colleges', 1),
  ('inst_b21', 'B21', 'Nuku Teachers College', 'Teachers colleges', 1),
  ('inst_b22', 'B22', 'Sacred Heart Teachers College', 'Teachers colleges', 1),
  ('inst_b23', 'B23', 'AOG Jubilee Higher Learning Institute', 'Teachers colleges', 1),
  ('inst_c1', 'C1', 'Mendi School of Nursing', 'Nursing colleges', 1),
  ('inst_c2', 'C2', 'St. Barnabas Nursing College', 'Nursing colleges', 1),
  ('inst_c3', 'C3', 'Tombil CHW', 'Nursing colleges', 1),
  ('inst_c4', 'C4', 'Highlands Regional Nursing College', 'Nursing colleges', 1),
  ('inst_c5', 'C5', 'Rumginae Nursing College', 'Nursing colleges', 1),
  ('inst_c6', 'C6', 'Kumin CHW', 'Nursing colleges', 1),
  ('inst_c7', 'C7', 'St. Gerard’s CHW Training College', 'Nursing colleges', 1),
  ('inst_c8', 'C8', 'St. Mary’s Vunapope Nursing College', 'Nursing colleges', 1),
  ('inst_c9', 'C9', 'Raihu (Aitape) CHW Training College', 'Nursing colleges', 1),
  ('inst_c10', 'C10', 'Kundiawa College of Nursing', 'Nursing colleges', 1),
  ('inst_c11', 'C11', 'Professional Accelerate Institute — School of Nursing', 'Nursing colleges', 1),
  ('inst_c12', 'C12', 'West New Britain School of Nursing', 'Nursing colleges', 1),
  ('inst_c13', 'C13', 'Telefomin CHW Training College', 'Nursing colleges', 1),
  ('inst_c14', 'C14', 'Kundiawa CHW Training College', 'Nursing colleges', 1),
  ('inst_c15', 'C15', 'Tinsley CHW Training College', 'Nursing colleges', 1),
  ('inst_c16', 'C16', 'Tuna Bay School of Nursing', 'Nursing colleges', 1),
  ('inst_c17', 'C17', 'Rabaul CHW Training School', 'Nursing colleges', 1),
  ('inst_c18', 'C18', 'Kwikila CHW Training School', 'Nursing colleges', 1),
  ('inst_c19', 'C19', 'Lae School of Nursing', 'Nursing colleges', 1),
  ('inst_c20', 'C20', 'Kumgumanda 4Square CHW Training College', 'Nursing colleges', 1),
  ('inst_c21', 'C21', 'East Sepik School of Nursing', 'Nursing colleges', 1),
  ('inst_c22', 'C22', 'Career Training Institute (CTI)', 'Nursing colleges', 1),
  ('inst_c23', 'C23', 'Tari CHW Training College', 'Nursing colleges', 1),
  ('inst_c24', 'C24', 'Bulu (Karkar Island) CHW Training College', 'Nursing colleges', 1),
  ('inst_d1', 'D1', 'Mt. Hagen Technical College', 'Technical & business colleges', 1),
  ('inst_d2', 'D2', 'Goroka Technical College', 'Technical & business colleges', 1),
  ('inst_d3', 'D3', 'National Polytechnic College', 'Technical & business colleges', 1),
  ('inst_d4', 'D4', 'Port Moresby Technical College', 'Technical & business colleges', 1),
  ('inst_d5', 'D5', 'Port Moresby Business College', 'Technical & business colleges', 1),
  ('inst_d6a', 'D6A', 'Don Bosco Technical College — Gabutu', 'Technical & business colleges', 1),
  ('inst_d6b', 'D6B', 'Don Bosco Technical College — Simbu', 'Technical & business colleges', 1),
  ('inst_d7', 'D7', 'Madang Technical College', 'Technical & business colleges', 1),
  ('inst_d8', 'D8', 'Highlands Agricultural College', 'Technical & business colleges', 1),
  ('inst_d9', 'D9', 'Kokopo Business College', 'Technical & business colleges', 1),
  ('inst_e1', 'E1', 'Somare Institute of Leadership & Governance', 'Major private institutions', 1),
  ('inst_e2', 'E2', 'Asia Pacific Institute of Applied Science', 'Major private institutions', 1),
  ('inst_e3', 'E3', 'International Training Institute (ITI)', 'Major private institutions', 1),
  ('inst_e4', 'E4', 'DATEC — POM & Lae', 'Major private institutions', 1),
  ('inst_e5', 'E5', 'Mapex Training Institute', 'Major private institutions', 1),
  ('inst_e6', 'E6', 'Kumul Training Institute', 'Major private institutions', 1),
  ('inst_e7', 'E7', 'Acatech Aviation College', 'Major private institutions', 1),
  ('inst_e8', 'E8', 'Highlands Youth & Rehabilitation', 'Major private institutions', 1),
  ('inst_e9', 'E9', 'PNG Power College', 'Major private institutions', 1),
  ('inst_f1', 'F1', 'Institute of Banking & Business Management (IBBM)', 'Minor private institutions', 1),
  ('inst_f2', 'F2', 'Lenerg PNG Computers & Health Science Institute', 'Minor private institutions', 1),
  ('inst_f3', 'F3', 'IEA College of TAFE', 'Minor private institutions', 1),
  ('inst_f4', 'F4', 'PNG Human Resources Institute', 'Minor private institutions', 1),
  ('inst_f5', 'F5', 'Hewate TVET', 'Minor private institutions', 1),
  ('inst_f6', 'F6', 'Ipau TVET', 'Minor private institutions', 1),
  ('inst_f7', 'F7', 'Auwi TVET', 'Minor private institutions', 1),
  ('inst_f8', 'F8', 'Homaria TVET', 'Minor private institutions', 1),
  ('inst_g1', 'G1', 'Christian Leadership Training College', 'Theological / Bible colleges', 1),
  ('inst_g2', 'G2', 'Rarotonga Theological College', 'Theological / Bible colleges', 1),
  ('inst_g3', 'G3', 'Omaura School of Ministry', 'Theological / Bible colleges', 1),
  ('inst_g4', 'G4', 'Maria Bible Skul', 'Theological / Bible colleges', 1),
  ('inst_g5', 'G5', 'St. Paul’s Bible College', 'Theological / Bible colleges', 1),
  ('inst_g6', 'G6', 'Ambassadors Bible College', 'Theological / Bible colleges', 1),
  ('inst_h1', 'H1', 'Aiyura National High School', 'National high schools', 1),
  ('inst_h2', 'H2', 'Sogeri National High School', 'National high schools', 1),
  ('inst_h3', 'H3', 'Wawin National High School', 'National high schools', 1),
  ('inst_h4', 'H4', 'Kerevat National High School', 'National high schools', 1),
  ('inst_h5', 'H5', 'Passam National High School', 'National high schools', 1),
  ('inst_i1', 'I1', 'Australia (overseas studies)', 'Overseas studies', 1),
  ('inst_i2', 'I2', 'China (overseas studies)', 'Overseas studies', 1),
  ('inst_i3', 'I3', 'Fiji (overseas studies)', 'Overseas studies', 1),
  ('inst_i4', 'I4', 'New Zealand (overseas studies)', 'Overseas studies', 1),
  ('inst_i5', 'I5', 'Philippines (overseas studies)', 'Overseas studies', 1),
  ('inst_i6', 'I6', 'USA (overseas studies)', 'Overseas studies', 1),
  ('inst_i7', 'I7', 'Other overseas studies', 'Overseas studies', 1);

INSERT INTO programs (id, name, institution_id, is_active) VALUES
  ('prog_bis', 'Bachelor of Information Systems', 'inst_a5', 1),
  ('prog_bed', 'Bachelor of Education', 'inst_a2', 1),
  ('prog_bsc', 'Bachelor of Science', 'inst_a1', 1),
  ('prog_ba', 'Bachelor of Arts', 'inst_a1', 1),
  ('prog_beng', 'Bachelor of Engineering (Civil)', 'inst_a3', 1),
  ('prog_dip', 'Diploma of Primary Teaching', 'inst_b1', 1),
  ('prog_chw', 'Certificate in Community Health Work', 'inst_c23', 1),
  ('prog_nurs', 'Bachelor of Nursing', 'inst_c1', 1),
  ('prog_g11', 'Grade 11', 'inst_h1', 1),
  ('prog_g12', 'Grade 12', 'inst_h1', 1);

INSERT INTO document_types (id, code, label, required_for_new, required_for_continuing, required_for_non_hela, is_active) VALUES
  ('dt_photo', 'PASSPORT_PHOTO', 'Passport-size photo', 1, 1, 0, 1),
  ('dt_offer', 'ACCEPTANCE_LETTER', 'Acceptance / offer letter', 1, 0, 0, 1),
  ('dt_g10', 'GRADE_10', 'Grade 10 certificate', 1, 0, 0, 1),
  ('dt_g12', 'GRADE_12', 'Grade 12 certificate', 1, 0, 0, 1),
  ('dt_fee', 'FEE_STRUCTURE', '2026 school fee structure / invoice', 1, 1, 0, 1),
  ('dt_conf', 'CONFIRMATION_LETTER', 'Confirmation letter (year level)', 0, 1, 0, 1),
  ('dt_tr', 'TRANSCRIPT', 'Latest academic transcript', 0, 1, 0, 1),
  ('dt_id', 'STUDENT_ID', 'Valid student ID', 0, 1, 0, 1),
  ('dt_sup', 'SUPPORT_LETTER', 'Support letter (non-Hela origin)', 0, 0, 1, 1);

INSERT INTO application_periods (id, academic_year, title, opens_at, closes_at, is_active) VALUES
  ('period_2026', '2026', '2026 HUEF Tuition Fee Assistance', '2025-11-01 00:00:00', '2026-02-13 16:00:00', 1);

INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('support_phone', '7412 2491'),
  ('support_email', 'huefsponsorship@gmail.com'),
  ('deadline_label', 'Friday 13 February 2026'),
  ('office_hours', 'Monday–Friday, 8:00am–4:00pm'),
  ('deepseek_model', 'deepseek-v4-flash');

INSERT INTO users (id, email, password_hash, role, auth_provider, is_active) VALUES
  ('user_admin', 'admin@huef.pg', '$2b$10$SUcR4kSdnZyomVHicjXsROgaYO4hpIMqLTXpYiFMtpZvK1RdWO7iu', 'ADMIN', 'PASSWORD', 1),
  ('user_coord', 'coordinator@huef.pg', '$2b$10$SUcR4kSdnZyomVHicjXsROgaYO4hpIMqLTXpYiFMtpZvK1RdWO7iu', 'COORDINATOR', 'PASSWORD', 1),
  ('user_nancy', 'student@huef.pg', '$2b$10$UuGxanyms17kqqo9rtmLMuANymdsIJLBmanahT0XtqnZ9LDwezJnC', 'STUDENT', 'PASSWORD', 1),
  ('user_henene', 'henene.agibe@student.pg', '$2b$10$UuGxanyms17kqqo9rtmLMuANymdsIJLBmanahT0XtqnZ9LDwezJnC', 'STUDENT', 'PASSWORD', 1),
  ('user_lina', 'lina.komengi@student.pg', '$2b$10$UuGxanyms17kqqo9rtmLMuANymdsIJLBmanahT0XtqnZ9LDwezJnC', 'STUDENT', 'PASSWORD', 1),
  ('user_daniel', 'daniel.olabe@student.pg', '$2b$10$UuGxanyms17kqqo9rtmLMuANymdsIJLBmanahT0XtqnZ9LDwezJnC', 'STUDENT', 'PASSWORD', 1),
  ('user_grace', 'grace.halu@student.pg', '$2b$10$UuGxanyms17kqqo9rtmLMuANymdsIJLBmanahT0XtqnZ9LDwezJnC', 'STUDENT', 'PASSWORD', 1),
  ('user_michael', 'michael.tabe@student.pg', '$2b$10$UuGxanyms17kqqo9rtmLMuANymdsIJLBmanahT0XtqnZ9LDwezJnC', 'STUDENT', 'PASSWORD', 1),
  ('user_rose', 'rose.yokolo@student.pg', '$2b$10$UuGxanyms17kqqo9rtmLMuANymdsIJLBmanahT0XtqnZ9LDwezJnC', 'STUDENT', 'PASSWORD', 1);

INSERT INTO applicants (id, user_id, given_name, surname, gender, date_of_birth, age, phone, clan_name, ward_village, llg_name, llg_id, district_id, province, father_full_name, father_occupation, mother_full_name, mother_occupation, eligibility_path) VALUES
  ('appc_nancy', 'user_nancy', 'NANCY', 'PUNDARI', 'F', '2004-05-12', 22, '71550011', 'HULI', 'HOBURA', 'Tari Urban', 'llg_tari_urban', 'dist_tari', 'Hela', 'JOSEPH PUNDARI', 'SUBSISTENCE FARMER', 'MARY PUNDARI', 'MARKET VENDOR', 'HELA_ORIGIN'),
  ('appc_henene', 'user_henene', 'HENENE', 'AGIBE', 'M', '2003-03-05', 23, '70112233', 'HULI', 'PIAIABE', 'Tari Urban', 'llg_tari_urban', 'dist_tari', 'Hela', 'FATHER OF HENENE', 'PUBLIC SERVANT', 'MOTHER OF HENENE', 'HOME DUTIES', 'HELA_ORIGIN'),
  ('appc_lina', 'user_lina', 'LINA', 'KOMENGI', 'F', '2005-11-20', 20, '72334455', 'DUMA', 'KOMO STATION', 'Komo Rural', 'llg_komo_rural', 'dist_komo', 'Hela', 'FATHER OF LINA', 'SUBSISTENCE FARMER', 'MOTHER OF LINA', 'HOME DUTIES', 'HELA_ORIGIN'),
  ('appc_daniel', 'user_daniel', 'DANIEL', 'OLABE', 'M', '2002-08-14', 24, '73445566', 'TANI', 'MAGARIMA', 'Magarima Rural', 'llg_magarima_rural', 'dist_magarima', 'Hela', 'FATHER OF DANIEL', 'PUBLIC SERVANT', 'MOTHER OF DANIEL', 'HOME DUTIES', 'HELA_ORIGIN'),
  ('appc_grace', 'user_grace', 'GRACE', 'HALU', 'F', '2004-01-30', 22, '74556677', 'HEWA', 'KOROBA', 'Koroba', 'llg_koroba', 'dist_koroba', 'Hela', 'FATHER OF GRACE', 'PUBLIC SERVANT', 'MOTHER OF GRACE', 'HOME DUTIES', 'PUBLIC_SERVANT_CHILD'),
  ('appc_michael', 'user_michael', 'MICHAEL', 'TABE', 'M', '2001-06-09', 25, '75667788', 'HULI', 'PAJALU', 'Tagali', 'llg_tagali', 'dist_tari', 'Hela', 'FATHER OF MICHAEL', 'SUBSISTENCE FARMER', 'MOTHER OF MICHAEL', 'HOME DUTIES', 'HELA_ORIGIN'),
  ('appc_rose', 'user_rose', 'ROSE', 'YOKOLO', 'F', '2006-02-18', 20, '76778899', 'HULI', 'HULIA', 'Hulia', 'llg_hulia', 'dist_komo', 'Hela', 'FATHER OF ROSE', 'SUBSISTENCE FARMER', 'MOTHER OF ROSE', 'HOME DUTIES', 'HELA_ORIGIN');

UPDATE applicants SET public_servant_who = 'FATHER', public_servant_department = 'Education', public_servant_years = 8 WHERE id = 'appc_grace';

INSERT INTO applications (id, applicant_id, institution_id, district_id, academic_year, program_name, study_type, study_level, year_of_study, applicant_type, fee_category, tuition_fees, witness_name, status, screening_status, submitted_at, decided_at, decided_by_email) VALUES
  ('appl_nancy', 'appc_nancy', 'inst_a5', 'dist_tari', '2026', 'Bachelor of Information Systems', 'Full time', 'UNDERGRADUATE', '1st year', 'NEW_INTAKE', 'HUEF_TFA', NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL),
  ('appl_henene', 'appc_henene', 'inst_a5', 'dist_tari', '2026', 'Bachelor of Information Systems', 'Full time', 'UNDERGRADUATE', '4th year', 'CONTINUING', 'HUEF_TFA', '12800.00', 'COUNCILLOR JAMES TOBE', 'PENDING', 'UNREADABLE_DOCUMENT', DATE_SUB(NOW(), INTERVAL 6 DAY), NULL, NULL),
  ('appl_lina', 'appc_lina', 'inst_a1', 'dist_komo', '2026', 'Bachelor of Science', 'Full time', 'UNDERGRADUATE', '1st year', 'NEW_INTAKE', 'CORPORATE', '15200.00', 'WARD RECORDER PAUL KOMENGI', 'PENDING', 'UNREADABLE_DOCUMENT', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL),
  ('appl_daniel', 'appc_daniel', 'inst_a3', 'dist_magarima', '2026', 'Bachelor of Engineering (Civil)', 'Full time', 'UNDERGRADUATE', '3rd year', 'CONTINUING', 'HUEF_TFA', '14500.00', 'PASTOR JOHN TABI', 'APPROVED', 'UNREADABLE_DOCUMENT', DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), 'coordinator@huef.pg'),
  ('appl_grace', 'appc_grace', 'inst_c23', 'dist_koroba', '2026', 'Certificate in Community Health Work', 'Full time', 'UNDERGRADUATE', '1st year', 'NEW_INTAKE', 'HUEF_TFA', '6200.00', 'SISTER ANNA WAI', 'PENDING', 'UNREADABLE_DOCUMENT', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL),
  ('appl_michael', 'appc_michael', 'inst_b1', 'dist_tari', '2026', 'Diploma of Primary Teaching', 'Full time', 'UNDERGRADUATE', '2nd year', 'CONTINUING', 'HUEF_TFA', '5400.00', 'COUNCILLOR STEVEN ALI', 'REJECTED', 'MISSING_REQUIRED', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY), 'coordinator@huef.pg'),
  ('appl_rose', 'appc_rose', 'inst_h1', 'dist_komo', '2026', 'Grade 11', 'Full time', 'NATIONAL_HIGH_SCHOOL', 'Grade 11', 'NEW_INTAKE', 'HUEF_TFA', '3800.00', 'HEAD TEACHER SAMSON PELE', 'PENDING', 'UNREADABLE_DOCUMENT', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL);

INSERT INTO announcements (id, title, body, audience, published, deadline_at, created_by_id) VALUES
  ('ann_deadline', '2026 TFA closing date', 'Lodge your complete 2026 HUEF Tuition Fee Assistance application, with all required documents, by Friday 13 February 2026.', 'STUDENT', 1, '2026-02-13 16:00:00', 'user_admin');

INSERT INTO notifications (id, user_id, sender_id, title, message, type, category) VALUES
  ('note_nancy', 'user_nancy', 'user_admin', '2026 TFA closing date', 'Lodge your complete 2026 HUEF application, with all required documents, by Friday 13 February 2026.', 'ANNOUNCEMENT', 'ANNOUNCEMENT');
