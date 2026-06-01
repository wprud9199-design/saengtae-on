-- 생태 모니터링 기록 테이블
CREATE TABLE IF NOT EXISTS monitoring_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_name TEXT NOT NULL,
  location_name TEXT NOT NULL,
  species_name TEXT NOT NULL,
  condition_status TEXT NOT NULL DEFAULT '양호', -- 양호, 보통, 불량, 고사
  latitude REAL,
  longitude REAL,
  special_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  updated_by TEXT
);

-- 사진 테이블 (종마다 최대 10장)
CREATE TABLE IF NOT EXISTS monitoring_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  photo_data TEXT NOT NULL, -- base64 encoded image
  photo_name TEXT,
  photo_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES monitoring_records(id) ON DELETE CASCADE
);

-- 재점검 사항 테이블
CREATE TABLE IF NOT EXISTS reinspection_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL UNIQUE,
  removal_done INTEGER DEFAULT 0,   -- 제거 완료 여부
  no_recurrence INTEGER DEFAULT 0,  -- 재발생 없음
  spread_check INTEGER DEFAULT 0,   -- 확산 확인
  reinspection_memo TEXT,
  reinspection_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (record_id) REFERENCES monitoring_records(id) ON DELETE CASCADE
);

-- 생태 체크리스트 테이블
CREATE TABLE IF NOT EXISTS ecology_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL UNIQUE,
  vegetation_damage TEXT DEFAULT '양호',  -- 식생 훼손: 양호, 보통, 미흡
  invasive_species TEXT DEFAULT '없음',   -- 외래종 발생: 있음, 없음
  environment_mgmt TEXT DEFAULT '없음',   -- 환경 관리: 있음, 없음
  trail_condition TEXT DEFAULT '양호',    -- 탐방로 상태: 양호, 정비 필요
  photo_record TEXT DEFAULT '완료',       -- 사진 기록: 완료, 미완료
  guide_facility TEXT DEFAULT '양호',     -- 안내시설: 양호, 보통, 미흡
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (record_id) REFERENCES monitoring_records(id) ON DELETE CASCADE
);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 관리자 계정 (비밀번호: admin1234)
INSERT OR IGNORE INTO admins (username, password_hash) VALUES 
  ('admin', 'admin1234');

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_records_created ON monitoring_records(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_record ON monitoring_photos(record_id);
