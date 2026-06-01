-- 검수 상태 컬럼 추가
ALTER TABLE monitoring_records ADD COLUMN review_status TEXT DEFAULT '검토중';
ALTER TABLE monitoring_records ADD COLUMN review_memo TEXT;
ALTER TABLE monitoring_records ADD COLUMN reviewed_by TEXT;
ALTER TABLE monitoring_records ADD COLUMN reviewed_at DATETIME;

-- 고정 모니터링 지점 테이블
CREATE TABLE IF NOT EXISTS monitoring_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  region TEXT,
  latitude REAL,
  longitude REAL,
  eco_type TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
