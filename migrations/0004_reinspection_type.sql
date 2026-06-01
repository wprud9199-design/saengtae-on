-- 재점검 기록에 등록유형 및 결과 컬럼 추가
ALTER TABLE reinspection_records ADD COLUMN registration_type TEXT DEFAULT '신규등록';
ALTER TABLE reinspection_records ADD COLUMN results TEXT DEFAULT '';
