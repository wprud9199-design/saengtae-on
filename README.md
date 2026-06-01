# 🌿 생태ON | 제주 생태 모니터링

## 프로젝트 개요

- **앱명**: 생태ON (Ecology ON)
- **부제**: 제주 생태 모니터링
- **목적**: 주민 참여 기반 제주형 생태계서비스지불제 생태 모니터링 앱
- **운영기관**: 제주녹색환경지원센터(제주생태계서비스지원센터)

## 🔗 URL

- **메인 앱**: `https://saengtae-on.pages.dev/`
- **관리자 페이지**: `https://saengtae-on.pages.dev/admin`
- **GitHub**: `https://github.com/wprud9199-design/saengtae-on`
- **API**: `https://saengtae-on.pages.dev/api/records`

---

## ✅ 구현된 기능

### 📱 사용자 앱
- **헤더**: 생태ON 로고(🌿), 제주 생태 모니터링, 제주형 생태계서비스지불제 배지
- **기록하기 탭**:
  - 기본 정보 카드: 이름, 장소, 종명 입력
  - **조사일자, 조사시각, 날씨, 생태계유형 필수 선택**
  - 상태 선택: 양호/보통/불량/고사 (버튼 형태)
  - 지역 선택 (필수)
  - 특이사항 입력 (필수)
  - 위치 정보: Leaflet.js + OpenStreetMap 인터랙티브 지도 (탭 방식)
  - 사진 등록: 최대 10장, Canvas 압축(1600px/JPEG 0.85), HEIC 지원
  - 재점검 사항 카드: 제거완료/재발생없음/확산확인 체크박스
  - 생태 체크리스트: 6개 항목 모두 필수 선택
- **목록 탭**: 등록된 기록 카드 목록
- **회원 승인제**: 가입 신청 → 관리자 승인 후 이용 가능
- **로그인 저장**: 아이디/비밀번호 localStorage 저장 기능

---

### 🔑 관리자 페이지 (`/admin`)

**로그인**: admin / admin1234

#### 1. 📊 통계 대시보드 (sec-dashboard)
- 전체 등록 건수, 이번 달 등록, 사진 등록 건수, 전체 사용자 수 요약 카드
- **검수 현황 카드**: 검토중 / 승인 / 반려 건수 한눈에 확인
- **6가지 차트**:
  - 일별 등록 현황 (7일)
  - 상태별 분포 (도넛)
  - 지역별 분포 (바 차트)
  - 월별 등록 추이 (라인)
  - 등록유형별 분포 (바)
  - 검수상태별 분포 (도넛)

#### 2. 📋 기록 목록 (sec-records)
- 전체 데이터 조회, 검색/지역/상태/검수상태 필터
- 테이블 컬럼: 번호, 이름, 지역, 조사일, 장소, 종명, 상태, **검수배지**, 등록유형, 사진, 수정/삭제
- **검수 상태 배지**: 검토중(회색) / 승인(초록) / 반려(빨강) / 수정요청(주황)

#### 3. ✅ 검수 관리 (sec-review)
- **검수 전용 섹션**: 검수상태/지역/키워드 필터
- 검수 테이블: 조사일, 등록자, 지역, 조사유형, 검수상태, 검수 버튼
- **검수 모달**: 승인 / 반려 / 수정요청 / 검토중 4가지 처리 + 메모 입력
- API: `PUT /api/admin/records/:id/review`

#### 4. 🗺️ 지도 관리 (sec-map)
- **Leaflet.js + OpenStreetMap** 기반 인터랙티브 지도 (Google Maps iframe 완전 교체)
- **조사유형별 SVG 커스텀 마커 색상 구분**
- 기간(from/to) / 지역 / 등록유형 필터
- 마커 클릭 시 팝업: 등록자, 지역, 장소, 상태, 조사일, 등록유형 표시

#### 5. 📍 고정 모니터링 지점 관리 (sec-points)
- **Leaflet 미니맵**에 고정 지점 표시
- 지점 등록 / 수정 / 삭제 CRUD
- 등록 정보: 지점명, 지역, 위도/경도, 생태계유형, 설명
- 지역/키워드 필터
- API: `GET/POST/PUT/DELETE /api/admin/points`

#### 6. 🖼️ 사진 관리 (sec-photos)
- **날짜 그룹핑 그리드 뷰**: 조사일자 기준 날짜별 사진 자동 분류
- 지역 / 조사유형 / 날짜 범위 필터
- 페이지네이션 (20개씩 더 불러오기)
- 사진 클릭 시 원본 크기 팝업
- API: `GET /api/admin/photos`

#### 7. 📈 통계 및 보고서 (sec-stats)
- **월별 등록 추이** (12개월 라인 차트)
- **연도별 등록 현황** (바 차트)
- **등록유형별 분포** (도넛 차트)
- **검수상태별 분포** (바 차트)
- Chart.js@4.4.0 기반

#### 8. 📥 엑셀/CSV 다운로드 (sec-export)
- **5가지 필터**: 시작일 / 종료일 / 지역 / 등록유형 / 검수상태
- **CSV 다운로드** (32개 컬럼):
  - 조사일, 조사시각, 날씨, 생태계유형, 검수상태, 검수자, 검수메모
  - GPS(위도/경도), 등록자, 지역, 장소, 종명, 상태, 특이사항 등
- **Excel 다운로드** (TSV 21개 컬럼):
  - 주요 필드만 포함한 엑셀 호환 파일

#### 9. 기존 기능 (유지)
- **사진 뷰어**: 🖼️ 버튼 → 슬라이드 뷰 + 다운로드
- **수정/삭제**: 전체 필드 수정 + 재점검 + 체크리스트
- **회원 관리**: 승인/거절/정지/복구, 관리자 권한 부여

---

## 📊 데이터 모델

### 테이블 목록

| 테이블 | 설명 |
|--------|------|
| `monitoring_records` | 모니터링 기록 메인 |
| `monitoring_photos` | 사진 데이터 (Base64, 최대 10장/기록) |
| `reinspection_records` | 재점검 사항 |
| `ecology_checklist` | 생태 체크리스트 |
| `users` | 회원 (pending/approved/rejected/suspended) |
| `monitoring_points` | 고정 모니터링 지점 관리 (Round 3 신규) |

### `monitoring_records` 필드

#### 기본 정보
| 필드 | 설명 |
|------|------|
| `name` | 등록자 이름 |
| `region` | 지역 |
| `location` | 장소 |
| `species` | 종명 |
| `status` | 상태 (양호/보통/불량/고사) |
| `notes` | 특이사항 |
| `latitude`, `longitude` | GPS 좌표 |

#### 조사 정보 (Round 2)
| 필드 | 설명 |
|------|------|
| `survey_date` | 조사일자 (YYYY-MM-DD) |
| `survey_time` | 조사시각 (HH:MM) |
| `weather` | 날씨 (맑음/구름조금/흐림/비/천둥번개/눈/바람/안개) |
| `eco_type` | 생태계유형 (산림/초지/습지/해안/농경지/도시/오름/곶자왈/기타) |
| `registration_type` | 등록유형 |
| `results` | 재점검 결과 |

#### 검수 정보 (Round 3 신규)
| 필드 | 설명 |
|------|------|
| `review_status` | 검수상태 (검토중/승인/반려/수정요청) |
| `review_memo` | 검수 메모 |
| `reviewed_by` | 검수자 |
| `reviewed_at` | 검수 일시 |

### `monitoring_points` 테이블 (Round 3 신규)

| 필드 | 설명 |
|------|------|
| `id` | 기본키 |
| `name` | 지점명 |
| `region` | 지역 |
| `latitude`, `longitude` | GPS 좌표 |
| `eco_type` | 생태계유형 |
| `description` | 설명 |
| `created_at`, `updated_at` | 생성/수정 일시 |

### 검수 상태 코드

| 상태 | 색상 | 설명 |
|------|------|------|
| `검토중` | 회색 | 검수 대기 (기본값) |
| `승인` | 초록 | 검수 완료·승인 |
| `반려` | 빨강 | 반려 처리 |
| `수정요청` | 주황 | 수정 요청 |

---

## 🗺️ API 엔드포인트

### 공개 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/records` | 모니터링 기록 등록 |
| `GET` | `/api/records` | 기록 목록 조회 |
| `POST` | `/api/auth/register` | 회원가입 신청 |
| `POST` | `/api/auth/login` | 로그인 |

### 관리자 API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/admin/records` | 기록 목록 (필터: region/status/keyword/review_status) |
| `PUT` | `/api/admin/records/:id` | 기록 수정 |
| `DELETE` | `/api/admin/records/:id` | 기록 삭제 |
| `PUT` | `/api/admin/records/:id/review` | 검수 상태 변경 (Round 3) |
| `GET` | `/api/admin/stats` | 통계 (일별/지역별/검수상태별/월별/연도별) |
| `GET` | `/api/admin/photos` | 사진 목록 (지역/유형/날짜 필터, 페이지네이션) (Round 3) |
| `GET` | `/api/admin/export` | CSV/Excel 내보내기 (5가지 필터) |
| `GET` | `/api/admin/points` | 고정 지점 목록 (Round 3) |
| `POST` | `/api/admin/points` | 고정 지점 등록 (Round 3) |
| `PUT` | `/api/admin/points/:id` | 고정 지점 수정 (Round 3) |
| `DELETE` | `/api/admin/points/:id` | 고정 지점 삭제 (Round 3) |
| `GET` | `/api/admin/users` | 회원 목록 |
| `PUT` | `/api/admin/users/:id` | 회원 상태 변경 |

---

## 🚀 배포 정보

- **플랫폼**: Cloudflare Pages
- **배포 상태**: ✅ 운영 중
- **D1 DB**: `saengtae-on-production` (ID: 981e19d0-fa9d-49b0-ae58-87e7f957701b)
- **기술 스택**: Hono + TypeScript + Cloudflare D1 + TailwindCSS + Leaflet.js + Chart.js

### DB 마이그레이션 이력

| 파일 | 내용 |
|------|------|
| `0001_initial.sql` | 기본 테이블 생성 |
| `0002_users.sql` | 회원 테이블 |
| `0003_survey_fields.sql` | 조사일자/시각/날씨/생태계유형 |
| `0004_reinspection_type.sql` | 등록유형, 재점검 결과 |
| `0005_review_and_points.sql` | 검수 4컬럼 + monitoring_points 테이블 |

### 로컬 개발
```bash
cd /home/user/webapp
npm run build
pm2 start ecosystem.config.cjs
```

### 프로덕션 배포
```bash
cd /home/user/webapp
npm run build
CLOUDFLARE_API_TOKEN=<token> npx wrangler pages deploy dist --project-name saengtae-on
```

---

## 👤 관리자 계정

- **아이디**: admin
- **비밀번호**: admin1234
- ⚠️ 운영 전 반드시 비밀번호 변경 필요

---

## 📝 업데이트 기록

| 날짜 | 내용 |
|------|------|
| 2026-06-01 | Round 1: 최초 구현 완료 (기록하기, 목록, 관리자 기본) |
| 2026-06-01 | Round 2: Leaflet.js 지도 교체, 사진 압축, 회원 승인제, 조사일자·날씨·생태계유형 필드, 사진 뷰어·다운로드 구현 |
| 2026-06-01 | Round 3: 관리자 데이터 관리 기능 강화 — 검수 시스템, Leaflet 지도 관리, 고정 모니터링 지점 CRUD, 사진 날짜 그룹핑 관리, 통계 차트 6종, 엑셀 내보내기 5가지 필터 |
