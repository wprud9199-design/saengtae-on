-- 회원 테이블 (관리자 승인 회원제)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  organization TEXT,             -- 소속 기관/단체
  role TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, suspended
  is_admin INTEGER DEFAULT 0,    -- 0: 일반회원, 1: 관리자
  region TEXT,                   -- 담당 지역
  approved_at DATETIME,
  approved_by TEXT,
  reject_reason TEXT,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

-- monitoring_records에 user_id 연결 컬럼 추가
ALTER TABLE monitoring_records ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE monitoring_records ADD COLUMN region TEXT;

-- 기본 관리자 계정
INSERT OR IGNORE INTO users (username, password_hash, full_name, email, role, is_admin, approved_at)
  VALUES ('admin', 'admin1234', '시스템 관리자', 'admin@jejugreen.or.kr', 'approved', 1, CURRENT_TIMESTAMP);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_records_user ON monitoring_records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_region ON monitoring_records(region);
