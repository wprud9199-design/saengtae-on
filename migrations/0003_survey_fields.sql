-- 모니터링 기록에 조사 기본정보 컬럼 추가
ALTER TABLE monitoring_records ADD COLUMN survey_date TEXT;
ALTER TABLE monitoring_records ADD COLUMN survey_time TEXT;
ALTER TABLE monitoring_records ADD COLUMN weather TEXT;
ALTER TABLE monitoring_records ADD COLUMN eco_type TEXT;
