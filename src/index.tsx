import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import api from './routes/api'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// API 라우트
app.route('/api', api)

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// 관리자 페이지
app.get('/admin', (c) => {
  return c.html(adminHTML())
})

// 메인 앱
app.get('/', (c) => {
  return c.html(mainHTML())
})

// 나머지 경로 → 메인
app.get('*', (c) => {
  return c.html(mainHTML())
})

function mainHTML(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>생태ON | 제주 생태 모니터링</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; background: #f0f7f0; }
    .app-container { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #fff; position: relative; }
    
    /* 헤더 */
    .app-header {
      background: linear-gradient(135deg, #1a7a3c 0%, #2d9e52 50%, #43b86a 100%);
      padding: 16px 20px 20px;
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    }
    .header-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .logo-icon { 
      width: 42px; height: 42px; background: rgba(255,255,255,0.2); 
      border-radius: 12px; display: flex; align-items: center; 
      justify-content: center; font-size: 22px;
      border: 1.5px solid rgba(255,255,255,0.3);
    }
    .logo-text { color: #fff; }
    .logo-main { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; line-height: 1; }
    .logo-main span.on { color: #a8e6bc; }
    .logo-sub { font-size: 12px; opacity: 0.9; margin-top: 2px; }
    .header-badge {
      display: inline-block; background: rgba(255,255,255,0.2);
      color: #fff; font-size: 11px; padding: 2px 10px; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.35); margin-top: 4px;
    }

    /* 탭 네비게이션 */
    .tab-nav { display: flex; background: #fff; border-bottom: 2px solid #e8f5e9; }
    .tab-btn { flex: 1; padding: 12px 0; text-align: center; font-size: 13px; font-weight: 600;
      color: #888; cursor: pointer; transition: all 0.2s; border-bottom: 3px solid transparent; margin-bottom: -2px; }
    .tab-btn.active { color: #1a7a3c; border-bottom-color: #1a7a3c; }
    .tab-btn i { display: block; font-size: 16px; margin-bottom: 2px; }

    /* 컨텐츠 */
    .content { padding: 16px; padding-bottom: 80px; }
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    /* 카드 */
    .card { background: #fff; border-radius: 16px; padding: 16px; margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07); border: 1px solid #e8f5e9; }
    .card-title { font-size: 14px; font-weight: 700; color: #1a7a3c; 
      display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
      padding-bottom: 8px; border-bottom: 1px solid #e8f5e9; }

    /* 폼 요소 */
    .form-group { margin-bottom: 14px; }
    .form-label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 5px; display: block; }
    .form-label .required { color: #e53935; margin-left: 2px; }
    .form-input, .form-select, .form-textarea {
      width: 100%; padding: 10px 12px; border: 1.5px solid #ddd; border-radius: 10px;
      font-size: 14px; color: #333; background: #fafafa;
      transition: border-color 0.2s; outline: none;
      -webkit-appearance: none;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #2d9e52; background: #fff; }
    .form-textarea { min-height: 80px; resize: vertical; }
    .form-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23666' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }

    /* 상태 선택 */
    .status-group { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .status-btn { padding: 8px 4px; border-radius: 10px; font-size: 12px; font-weight: 600;
      border: 2px solid #e0e0e0; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa; }
    .status-btn.active-good { background: #e8f5e9; border-color: #4caf50; color: #2e7d32; }
    .status-btn.active-normal { background: #fff3e0; border-color: #ff9800; color: #e65100; }
    .status-btn.active-bad { background: #fce4ec; border-color: #f44336; color: #c62828; }
    .status-btn.active-dead { background: #efebe9; border-color: #795548; color: #3e2723; }

    /* 사진 업로드 */
    .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .photo-slot { aspect-ratio: 1; border-radius: 10px; border: 2px dashed #ccc; 
      background: #fafafa; display: flex; align-items: center; justify-content: center;
      cursor: pointer; overflow: hidden; position: relative; }
    .photo-slot img { width: 100%; height: 100%; object-fit: cover; }
    .photo-slot.has-photo { border-style: solid; border-color: #2d9e52; }
    .photo-add-icon { color: #aaa; font-size: 20px; }
    .photo-remove { position: absolute; top: 3px; right: 3px; width: 20px; height: 20px;
      background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center;
      justify-content: center; color: white; font-size: 10px; cursor: pointer; }
    .photo-count { text-align: right; font-size: 11px; color: #888; margin-top: 4px; }

    /* 위치 선택 */
    .location-display { 
      background: #f1f8e9; border: 1.5px solid #a5d6a7; border-radius: 10px;
      padding: 10px 12px; font-size: 13px; color: #2e7d32; margin-top: 8px;
      display: none; 
    }
    .location-display.visible { display: flex; align-items: center; gap: 8px; }
    #mapModal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7); z-index: 9999; align-items: center; justify-content: center; }
    #mapModal.visible { display: flex; }
    .map-container { background: #fff; border-radius: 20px; overflow: hidden;
      width: calc(100vw - 32px); max-width: 460px; max-height: 90vh; 
      display: flex; flex-direction: column; }
    .map-header { padding: 14px 16px; background: #1a7a3c; color: #fff;
      display: flex; justify-content: space-between; align-items: center; }
    .map-header h3 { font-size: 16px; font-weight: 700; }
    #mapFrame { flex: 1; min-height: 350px; width: 100%; border: none; }
    .map-footer { padding: 12px 16px; border-top: 1px solid #eee; background: #f9f9f9; }
    .map-coords { font-size: 12px; color: #666; margin-bottom: 8px; }

    /* 체크리스트 */
    .checklist-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; 
      align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
    .checklist-row:last-child { border-bottom: none; }
    .checklist-label { font-size: 13px; color: #333; }
    .checklist-sub { font-size: 11px; color: #888; margin-top: 2px; }
    .checklist-select { padding: 5px 8px; border: 1.5px solid #ddd; border-radius: 8px; 
      font-size: 12px; background: #fafafa; }

    /* 재점검 체크박스 */
    .check-item { display: flex; align-items: center; gap: 10px; padding: 8px 0;
      border-bottom: 1px solid #f5f5f5; cursor: pointer; }
    .check-item:last-child { border-bottom: none; }
    .custom-checkbox { width: 20px; height: 20px; border: 2px solid #ccc; border-radius: 5px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: all 0.2s; }
    .custom-checkbox.checked { background: #2d9e52; border-color: #2d9e52; }
    .custom-checkbox.checked::after { content: '✓'; color: #fff; font-size: 13px; font-weight: 700; }
    .check-label { font-size: 13px; color: #444; }

    /* 버튼 */
    .btn-primary { width: 100%; padding: 14px; background: linear-gradient(135deg, #1a7a3c, #2d9e52);
      color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-secondary { padding: 8px 16px; background: #f5f5f5; color: #555; border: 1.5px solid #ddd;
      border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-danger { padding: 6px 12px; background: #fff; color: #e53935; border: 1.5px solid #e53935;
      border-radius: 8px; font-size: 12px; cursor: pointer; }
    .btn-edit { padding: 6px 12px; background: #fff; color: #1a7a3c; border: 1.5px solid #1a7a3c;
      border-radius: 8px; font-size: 12px; cursor: pointer; }

    /* 기록 목록 */
    .record-card { background: #fff; border-radius: 14px; padding: 14px;
      margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid #2d9e52; }
    .record-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .record-species { font-size: 16px; font-weight: 700; color: #1a7a3c; }
    .record-date { font-size: 11px; color: #aaa; }
    .record-info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px; }
    .record-info-item { font-size: 12px; color: #666; }
    .record-info-item i { width: 16px; color: #2d9e52; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-양호 { background: #e8f5e9; color: #2e7d32; }
    .status-보통 { background: #fff3e0; color: #e65100; }
    .status-불량 { background: #fce4ec; color: #c62828; }
    .status-고사 { background: #efebe9; color: #3e2723; }
    .record-photos { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
    .record-photo-thumb { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }

    /* 로딩/빈 상태 */
    .empty-state { text-align: center; padding: 40px 20px; color: #aaa; }
    .empty-state i { font-size: 48px; margin-bottom: 12px; display: block; }
    .loading { text-align: center; padding: 30px; color: #888; }

    /* 토스트 */
    .toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: #333; color: #fff; padding: 10px 20px; border-radius: 20px;
      font-size: 13px; z-index: 9998; display: none; white-space: nowrap; }
    .toast.show { display: block; animation: fadeInOut 2.5s forwards; }
    @keyframes fadeInOut { 0%{opacity:0;transform:translateX(-50%) translateY(10px)} 
      15%{opacity:1;transform:translateX(-50%) translateY(0)} 
      75%{opacity:1} 100%{opacity:0} }

    /* 푸터 */
    .app-footer { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: 480px; background: #f8f8f8; 
      border-top: 1px solid #e0e0e0; padding: 8px 16px;
      text-align: center; z-index: 50; }
    .footer-text { font-size: 10px; color: #aaa; line-height: 1.5; }

    /* 모달 */
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 8000; overflow-y: auto; }
    .modal-overlay.visible { display: flex; align-items: flex-start; justify-content: center; padding: 20px; }
    .modal-box { background: #fff; border-radius: 20px; padding: 20px;
      width: 100%; max-width: 440px; margin: auto; }
    .modal-title { font-size: 18px; font-weight: 700; color: #1a7a3c; margin-bottom: 16px; }

    /* 상세 보기 */
    .detail-row { padding: 8px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; 
      display: flex; gap: 8px; }
    .detail-key { color: #888; width: 90px; flex-shrink: 0; }
    .detail-val { color: #333; font-weight: 500; flex: 1; }
  </style>
</head>
<body>
<div class="app-container">
  <!-- 헤더 -->
  <header class="app-header">
    <div class="header-logo">
      <div class="logo-icon">🌿</div>
      <div class="logo-text">
        <div class="logo-main">생태<span class="on">ON</span></div>
        <div class="logo-sub">제주 생태 모니터링</div>
      </div>
    </div>
    <span class="header-badge">제주형 생태계서비스지불제</span>
  </header>

  <!-- 탭 네비게이션 -->
  <nav class="tab-nav">
    <button class="tab-btn active" onclick="switchTab('record')" id="tab-record">
      <i class="fas fa-plus-circle"></i>기록하기
    </button>
    <button class="tab-btn" onclick="switchTab('list')" id="tab-list">
      <i class="fas fa-list"></i>목록
    </button>
  </nav>

  <!-- 컨텐츠 -->
  <main class="content">
    <!-- 기록하기 탭 -->
    <div class="tab-panel active" id="panel-record">
      <form id="monitoringForm" onsubmit="submitForm(event)">
        
        <!-- 기본 정보 카드 -->
        <div class="card">
          <div class="card-title"><i class="fas fa-user-circle"></i> 기본 정보</div>
          
          <div class="form-group">
            <label class="form-label">이름 <span class="required">*</span></label>
            <input type="text" class="form-input" id="reporterName" placeholder="이름을 입력하세요" required />
          </div>

          <div class="form-group">
            <label class="form-label">장소명 <span class="required">*</span></label>
            <input type="text" class="form-input" id="locationName" placeholder="조사 장소명을 입력하세요" required />
          </div>

          <div class="form-group">
            <label class="form-label">종명 <span class="required">*</span></label>
            <input type="text" class="form-input" id="speciesName" placeholder="식물/동물 종명을 입력하세요" required />
          </div>

          <div class="form-group">
            <label class="form-label">상태</label>
            <div class="status-group">
              <button type="button" class="status-btn active-good" id="status-양호" onclick="selectStatus('양호')">🟢 양호</button>
              <button type="button" class="status-btn" id="status-보통" onclick="selectStatus('보통')">🟡 보통</button>
              <button type="button" class="status-btn" id="status-불량" onclick="selectStatus('불량')">🔴 불량</button>
              <button type="button" class="status-btn" id="status-고사" onclick="selectStatus('고사')">⬛ 고사</button>
            </div>
            <input type="hidden" id="conditionStatus" value="양호" />
          </div>

          <div class="form-group">
            <label class="form-label">특이사항</label>
            <textarea class="form-textarea" id="specialNotes" placeholder="특이사항이나 관찰 내용을 입력하세요..."></textarea>
          </div>
        </div>

        <!-- 위치 정보 카드 -->
        <div class="card">
          <div class="card-title"><i class="fas fa-map-marker-alt"></i> 위치 정보</div>
          <button type="button" class="btn-primary" style="background: linear-gradient(135deg, #1565c0, #1e88e5);" onclick="openMap()">
            <i class="fas fa-map-marked-alt"></i> 지도에서 위치 선택
          </button>
          <div class="location-display" id="locationDisplay">
            <i class="fas fa-check-circle"></i>
            <div>
              <div id="locationText" style="font-weight:700;">위치 선택됨</div>
              <div id="coordsText" style="font-size:11px; color:#666; margin-top:2px;"></div>
            </div>
          </div>
          <input type="hidden" id="latitude" />
          <input type="hidden" id="longitude" />
        </div>

        <!-- 사진 업로드 카드 -->
        <div class="card">
          <div class="card-title"><i class="fas fa-camera"></i> 사진 등록 <span style="font-size:11px; color:#888; font-weight:400;">(최대 10장)</span></div>
          <div class="photo-grid" id="photoGrid"></div>
          <div class="photo-count"><span id="photoCount">0</span>/10장</div>
          <input type="file" id="photoInput" accept="image/*" multiple style="display:none;" onchange="handlePhotoAdd(event)" />
        </div>

        <!-- 재점검 사항 카드 -->
        <div class="card">
          <div class="card-title"><i class="fas fa-redo"></i> 재점검 사항</div>
          
          <div class="check-item" onclick="toggleCheck('removalDone')">
            <div class="custom-checkbox" id="check-removalDone"></div>
            <span class="check-label">☑ 제거 완료</span>
          </div>
          <div class="check-item" onclick="toggleCheck('noRecurrence')">
            <div class="custom-checkbox" id="check-noRecurrence"></div>
            <span class="check-label">☑ 재발생 없음</span>
          </div>
          <div class="check-item" onclick="toggleCheck('spreadCheck')">
            <div class="custom-checkbox" id="check-spreadCheck"></div>
            <span class="check-label">☑ 확산 확인</span>
          </div>

          <div class="form-group" style="margin-top:12px;">
            <label class="form-label">재점검 일자</label>
            <input type="date" class="form-input" id="reinspectionDate" />
          </div>
          <div class="form-group">
            <label class="form-label">재점검 메모</label>
            <textarea class="form-textarea" id="reinspectionMemo" placeholder="재점검 내용을 입력하세요..." style="min-height:60px;"></textarea>
          </div>
        </div>

        <!-- 생태 모니터링 체크리스트 카드 -->
        <div class="card">
          <div class="card-title"><i class="fas fa-clipboard-check"></i> 생태 모니터링 체크리스트</div>
          
          <div class="checklist-row">
            <div>
              <div class="checklist-label"><b>① 식생 훼손 여부</b></div>
              <div class="checklist-sub">훼손 및 훼손 우려지역 존재 여부</div>
            </div>
            <select class="checklist-select" id="cl-vegetation">
              <option value="양호">양호</option>
              <option value="보통">보통</option>
              <option value="미흡">미흡</option>
            </select>
          </div>

          <div class="checklist-row">
            <div>
              <div class="checklist-label"><b>② 외래종 발생</b></div>
              <div class="checklist-sub">외래식물·교란종 확인 여부</div>
            </div>
            <select class="checklist-select" id="cl-invasive">
              <option value="없음">없음</option>
              <option value="있음">있음</option>
            </select>
          </div>

          <div class="checklist-row">
            <div>
              <div class="checklist-label"><b>③ 환경 관리</b></div>
              <div class="checklist-sub">불법투기 및 폐기물 발생 여부</div>
            </div>
            <select class="checklist-select" id="cl-environment">
              <option value="없음">없음</option>
              <option value="있음">있음</option>
            </select>
          </div>

          <div class="checklist-row">
            <div>
              <div class="checklist-label"><b>④ 탐방로 상태</b></div>
              <div class="checklist-sub">탐방로 침식·파손 여부 확인</div>
            </div>
            <select class="checklist-select" id="cl-trail">
              <option value="양호">양호</option>
              <option value="정비 필요">정비 필요</option>
            </select>
          </div>

          <div class="checklist-row">
            <div>
              <div class="checklist-label"><b>⑤ 사진 기록</b></div>
              <div class="checklist-sub">동일지점 사진 촬영 여부</div>
            </div>
            <select class="checklist-select" id="cl-photo">
              <option value="완료">완료</option>
              <option value="미완료">미완료</option>
            </select>
          </div>

          <div class="checklist-row">
            <div>
              <div class="checklist-label"><b>⑥ 안내시설</b></div>
              <div class="checklist-sub">안내판 및 시설물 상태 확인</div>
            </div>
            <select class="checklist-select" id="cl-guide">
              <option value="양호">양호</option>
              <option value="보통">보통</option>
              <option value="미흡">미흡</option>
            </select>
          </div>
        </div>

        <!-- 제출 버튼 -->
        <button type="submit" class="btn-primary" id="submitBtn">
          <i class="fas fa-paper-plane"></i> 모니터링 기록 제출
        </button>
      </form>
    </div>

    <!-- 목록 탭 -->
    <div class="tab-panel" id="panel-list">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-size:13px; color:#666;">
          총 <span id="recordTotal" style="font-weight:700; color:#1a7a3c;">0</span>건의 기록
        </div>
        <button class="btn-secondary" onclick="loadRecords()">
          <i class="fas fa-sync-alt"></i> 새로고침
        </button>
      </div>
      <div id="recordList"><div class="loading"><i class="fas fa-spinner fa-spin"></i> 로딩 중...</div></div>
    </div>
  </main>

  <!-- 푸터 -->
  <footer class="app-footer">
    <div class="footer-text">© 제주녹색환경지원센터(제주생태계서비스지원센터)</div>
  </footer>
</div>

<!-- 지도 모달 -->
<div id="mapModal">
  <div class="map-container">
    <div class="map-header">
      <h3><i class="fas fa-map-marked-alt"></i> 위치 선택</h3>
      <button onclick="closeMap()" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer;">✕</button>
    </div>
    <iframe id="mapFrame" src="about:blank"></iframe>
    <div class="map-footer">
      <div class="map-coords" id="mapCoords">지도를 클릭하여 위치를 선택하세요.</div>
      <div style="display:flex; gap:8px;">
        <button class="btn-secondary" onclick="closeMap()" style="flex:1;">취소</button>
        <button class="btn-primary" onclick="confirmLocation()" style="flex:2; padding:10px;" id="confirmLocationBtn" disabled>
          <i class="fas fa-check"></i> 이 위치 선택
        </button>
      </div>
    </div>
  </div>
</div>

<!-- 상세 보기 모달 -->
<div class="modal-overlay" id="detailModal">
  <div class="modal-box">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div class="modal-title"><i class="fas fa-leaf"></i> 상세 정보</div>
      <button onclick="closeDetail()" style="background:none; border:none; font-size:22px; color:#888; cursor:pointer;">✕</button>
    </div>
    <div id="detailContent"></div>
  </div>
</div>

<!-- 토스트 -->
<div class="toast" id="toast"></div>

<script>
// ==================== 전역 상태 ====================
let photos = [];
let selectedLat = null, selectedLng = null;
let pendingLat = null, pendingLng = null;
let checks = { removalDone: false, noRecurrence: false, spreadCheck: false };

// ==================== 탭 전환 ====================
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
  if (tab === 'list') loadRecords();
}

// ==================== 상태 선택 ====================
function selectStatus(status) {
  const statusMap = { '양호': 'active-good', '보통': 'active-normal', '불량': 'active-bad', '고사': 'active-dead' };
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.className = 'status-btn';
  });
  const btn = document.getElementById('status-' + status);
  if (btn) btn.classList.add(statusMap[status]);
  document.getElementById('conditionStatus').value = status;
}

// ==================== 체크박스 ====================
function toggleCheck(key) {
  checks[key] = !checks[key];
  const el = document.getElementById('check-' + key);
  if (checks[key]) el.classList.add('checked');
  else el.classList.remove('checked');
}

// ==================== 사진 업로드 ====================
function renderPhotoGrid() {
  const grid = document.getElementById('photoGrid');
  grid.innerHTML = '';
  
  photos.forEach((photo, idx) => {
    const slot = document.createElement('div');
    slot.className = 'photo-slot has-photo';
    slot.innerHTML = \`
      <img src="\${photo.data}" alt="photo \${idx+1}" />
      <div class="photo-remove" onclick="removePhoto(\${idx})"><i class="fas fa-times"></i></div>
    \`;
    grid.appendChild(slot);
  });

  if (photos.length < 10) {
    const addSlot = document.createElement('div');
    addSlot.className = 'photo-slot';
    addSlot.innerHTML = '<i class="fas fa-plus photo-add-icon"></i>';
    addSlot.onclick = () => document.getElementById('photoInput').click();
    grid.appendChild(addSlot);
  }

  document.getElementById('photoCount').textContent = photos.length;
}

function handlePhotoAdd(event) {
  const files = Array.from(event.target.files);
  const remaining = 10 - photos.length;
  const toAdd = files.slice(0, remaining);
  
  let loaded = 0;
  toAdd.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      photos.push({ data: e.target.result, name: file.name });
      loaded++;
      if (loaded === toAdd.length) renderPhotoGrid();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
  if (files.length > remaining) showToast(\`사진은 최대 10장까지만 등록 가능합니다.\`);
}

function removePhoto(idx) {
  photos.splice(idx, 1);
  renderPhotoGrid();
}

// ==================== 지도 ====================
function openMap() {
  const modal = document.getElementById('mapModal');
  modal.classList.add('visible');
  
  const centerLat = selectedLat || 33.4996;
  const centerLng = selectedLng || 126.5312;
  
  const iframe = document.getElementById('mapFrame');
  iframe.src = \`https://maps.google.com/maps?q=\${centerLat},\${centerLng}&z=13&output=embed&hl=ko\`;
  
  document.getElementById('mapCoords').textContent = '지도를 클릭하여 위치를 선택하세요.';
  document.getElementById('confirmLocationBtn').disabled = true;
  pendingLat = null;
  pendingLng = null;
  
  // 지도 클릭 처리를 위한 오버레이
  setupMapClickHandler();
}

function setupMapClickHandler() {
  const mapContainer = document.getElementById('mapFrame').parentElement;
  let overlay = document.getElementById('mapClickOverlay');
  if (overlay) overlay.remove();
  
  overlay = document.createElement('div');
  overlay.id = 'mapClickOverlay';
  overlay.style.cssText = 'position:absolute; top:0; left:0; right:0; bottom:0; cursor:crosshair; z-index:1;';
  overlay.style.background = 'transparent';
  
  const mapHeader = document.querySelector('.map-header');
  const mapFooter = document.querySelector('.map-footer');
  const iframe = document.getElementById('mapFrame');
  
  // 직접 좌표 입력 폼 추가
  const coordInput = document.createElement('div');
  coordInput.style.cssText = 'padding:8px 16px; background:#f0f7f0; border-bottom:1px solid #e0e0e0;';
  coordInput.innerHTML = \`
    <div style="font-size:12px; color:#555; margin-bottom:6px;">
      <i class="fas fa-info-circle" style="color:#2d9e52;"></i> 
      제주도 지역 좌표를 직접 입력하거나 아래 버튼을 사용하세요
    </div>
    <div style="display:flex; gap:6px; align-items:center;">
      <input type="number" id="manualLat" placeholder="위도 (예: 33.4996)" step="0.0001" 
        style="flex:1; padding:7px 10px; border:1.5px solid #ddd; border-radius:8px; font-size:13px;"
        value="33.4996">
      <input type="number" id="manualLng" placeholder="경도 (예: 126.5312)" step="0.0001"
        style="flex:1; padding:7px 10px; border:1.5px solid #ddd; border-radius:8px; font-size:13px;"
        value="126.5312">
      <button onclick="applyManualCoords()" 
        style="padding:7px 14px; background:#1a7a3c; color:#fff; border:none; border-radius:8px; font-size:13px; cursor:pointer; white-space:nowrap;">
        확인
      </button>
    </div>
    <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
      <button onclick="setPresetLocation(33.5097, 126.5219, '제주시청')" 
        style="padding:5px 10px; background:#fff; border:1px solid #ccc; border-radius:6px; font-size:11px; cursor:pointer;">📍 제주시청</button>
      <button onclick="setPresetLocation(33.2530, 126.5101, '서귀포시청')" 
        style="padding:5px 10px; background:#fff; border:1px solid #ccc; border-radius:6px; font-size:11px; cursor:pointer;">📍 서귀포시청</button>
      <button onclick="setPresetLocation(33.3617, 126.5292, '한라산')" 
        style="padding:5px 10px; background:#fff; border:1px solid #ccc; border-radius:6px; font-size:11px; cursor:pointer;">🏔 한라산</button>
      <button onclick="setPresetLocation(33.5131, 126.5195, '용두암')" 
        style="padding:5px 10px; background:#fff; border:1px solid #ccc; border-radius:6px; font-size:11px; cursor:pointer;">📍 용두암</button>
    </div>
  \`;
  
  const mapContainerEl = document.querySelector('.map-container');
  mapContainerEl.insertBefore(coordInput, iframe);
}

function applyManualCoords() {
  const lat = parseFloat(document.getElementById('manualLat').value);
  const lng = parseFloat(document.getElementById('manualLng').value);
  if (isNaN(lat) || isNaN(lng)) { showToast('올바른 좌표를 입력하세요.'); return; }
  if (lat < 33.0 || lat > 34.0 || lng < 126.0 || lng > 127.0) {
    showToast('제주도 범위의 좌표를 입력하세요.');
  }
  setMapLocation(lat, lng);
}

function setPresetLocation(lat, lng, name) {
  document.getElementById('manualLat').value = lat;
  document.getElementById('manualLng').value = lng;
  setMapLocation(lat, lng, name);
}

function setMapLocation(lat, lng, name) {
  pendingLat = lat;
  pendingLng = lng;
  const iframe = document.getElementById('mapFrame');
  iframe.src = \`https://maps.google.com/maps?q=\${lat},\${lng}&z=15&output=embed&hl=ko\`;
  const coordText = name 
    ? \`📍 \${name} (위도: \${lat.toFixed(6)}, 경도: \${lng.toFixed(6)})\`
    : \`📍 위도: \${lat.toFixed(6)}, 경도: \${lng.toFixed(6)}\`;
  document.getElementById('mapCoords').textContent = coordText;
  document.getElementById('confirmLocationBtn').disabled = false;
}

function confirmLocation() {
  if (pendingLat === null) { showToast('위치를 먼저 선택하세요.'); return; }
  selectedLat = pendingLat;
  selectedLng = pendingLng;
  document.getElementById('latitude').value = selectedLat;
  document.getElementById('longitude').value = selectedLng;
  
  const display = document.getElementById('locationDisplay');
  display.classList.add('visible');
  document.getElementById('locationText').textContent = '위치 선택 완료';
  document.getElementById('coordsText').textContent = 
    \`위도: \${selectedLat.toFixed(6)}, 경도: \${selectedLng.toFixed(6)}\`;
  
  closeMap();
  showToast('위치가 선택되었습니다.');
}

function closeMap() {
  const modal = document.getElementById('mapModal');
  modal.classList.remove('visible');
  // 추가된 좌표 입력 UI 제거
  const coordInput = document.querySelector('.map-container > div:nth-child(2)');
  if (coordInput && coordInput.querySelector('#manualLat')) {
    coordInput.remove();
  }
  document.getElementById('mapFrame').src = 'about:blank';
}

// ==================== 폼 제출 ====================
async function submitForm(event) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 저장 중...';

  try {
    const payload = {
      reporter_name: document.getElementById('reporterName').value,
      location_name: document.getElementById('locationName').value,
      species_name: document.getElementById('speciesName').value,
      condition_status: document.getElementById('conditionStatus').value,
      latitude: selectedLat,
      longitude: selectedLng,
      special_notes: document.getElementById('specialNotes').value,
      photos: photos,
      reinspection: {
        removal_done: checks.removalDone,
        no_recurrence: checks.noRecurrence,
        spread_check: checks.spreadCheck,
        reinspection_memo: document.getElementById('reinspectionMemo').value,
        reinspection_date: document.getElementById('reinspectionDate').value
      },
      checklist: {
        vegetation_damage: document.getElementById('cl-vegetation').value,
        invasive_species: document.getElementById('cl-invasive').value,
        environment_mgmt: document.getElementById('cl-environment').value,
        trail_condition: document.getElementById('cl-trail').value,
        photo_record: document.getElementById('cl-photo').value,
        guide_facility: document.getElementById('cl-guide').value
      }
    };

    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if (data.success) {
      showToast('✅ 모니터링 기록이 저장되었습니다!');
      resetForm();
      setTimeout(() => switchTab('list'), 1500);
    } else {
      showToast('❌ 오류: ' + (data.error || '저장에 실패했습니다.'));
    }
  } catch (e) {
    showToast('❌ 네트워크 오류가 발생했습니다.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 모니터링 기록 제출';
  }
}

function resetForm() {
  document.getElementById('monitoringForm').reset();
  photos = [];
  selectedLat = null; selectedLng = null;
  checks = { removalDone: false, noRecurrence: false, spreadCheck: false };
  renderPhotoGrid();
  selectStatus('양호');
  document.getElementById('locationDisplay').classList.remove('visible');
  document.querySelectorAll('.custom-checkbox').forEach(cb => cb.classList.remove('checked'));
}

// ==================== 목록 로드 ====================
async function loadRecords() {
  const list = document.getElementById('recordList');
  list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> 로딩 중...</div>';
  
  try {
    const res = await fetch('/api/records');
    const data = await res.json();
    
    if (!data.success || !data.data.length) {
      document.getElementById('recordTotal').textContent = '0';
      list.innerHTML = \`<div class="empty-state">
        <i class="fas fa-leaf"></i>
        <p>아직 기록이 없습니다.</p>
        <p style="font-size:12px;">첫 번째 생태 모니터링을 시작해보세요!</p>
      </div>\`;
      return;
    }
    
    document.getElementById('recordTotal').textContent = data.data.length;
    list.innerHTML = data.data.map(r => recordCard(r)).join('');
  } catch (e) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>데이터를 불러오는 데 실패했습니다.</p></div>';
  }
}

function recordCard(r) {
  const date = new Date(r.created_at).toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' });
  const coordText = r.latitude ? \`위도 \${parseFloat(r.latitude).toFixed(4)}, 경도 \${parseFloat(r.longitude).toFixed(4)}\` : '위치 미등록';
  return \`
    <div class="record-card">
      <div class="record-header">
        <div class="record-species"><i class="fas fa-leaf" style="color:#2d9e52; margin-right:4px;"></i>\${r.species_name}</div>
        <div class="record-date">\${date}</div>
      </div>
      <div class="record-info">
        <div class="record-info-item"><i class="fas fa-user"></i> \${r.reporter_name}</div>
        <div class="record-info-item"><i class="fas fa-map-marker-alt"></i> \${r.location_name}</div>
        <div class="record-info-item" style="grid-column:1/-1;"><i class="fas fa-map-pin"></i> \${coordText}</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="status-badge status-\${r.condition_status}">\${r.condition_status}</span>
        <span style="font-size:11px; color:#aaa;">사진 \${r.photo_count || 0}장</span>
        <button class="btn-edit" onclick="viewDetail(\${r.id})">
          <i class="fas fa-eye"></i> 상세
        </button>
      </div>
    </div>
  \`;
}

// ==================== 상세 보기 ====================
async function viewDetail(id) {
  try {
    const res = await fetch(\`/api/records/\${id}\`);
    const data = await res.json();
    if (!data.success) { showToast('상세 정보를 불러올 수 없습니다.'); return; }
    
    const r = data.data;
    const date = new Date(r.created_at).toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
    
    let photosHTML = '';
    if (r.photos && r.photos.length > 0) {
      photosHTML = \`<div style="display:flex; gap:6px; overflow-x:auto; padding:8px 0;">
        \${r.photos.map(p => \`<img src="\${p.photo_data}" style="width:70px; height:70px; border-radius:8px; object-fit:cover; flex-shrink:0;" />\`).join('')}
      </div>\`;
    }

    let reinspHTML = '';
    if (r.reinspection) {
      const ri = r.reinspection;
      reinspHTML = \`
        <div style="margin-top:12px; padding-top:12px; border-top:1px solid #f0f0f0;">
          <div style="font-size:13px; font-weight:700; color:#1a7a3c; margin-bottom:8px;">📋 재점검 사항</div>
          <div style="font-size:12px; color:#555; line-height:1.8;">
            \${ri.removal_done ? '✅' : '⬜'} 제거 완료 &nbsp;
            \${ri.no_recurrence ? '✅' : '⬜'} 재발생 없음 &nbsp;
            \${ri.spread_check ? '✅' : '⬜'} 확산 확인
            \${ri.reinspection_date ? '<br>재점검 일자: ' + ri.reinspection_date : ''}
            \${ri.reinspection_memo ? '<br>메모: ' + ri.reinspection_memo : ''}
          </div>
        </div>
      \`;
    }

    let checklistHTML = '';
    if (r.checklist) {
      const cl = r.checklist;
      const items = [
        ['식생 훼손 여부', cl.vegetation_damage],
        ['외래종 발생', cl.invasive_species],
        ['환경 관리', cl.environment_mgmt],
        ['탐방로 상태', cl.trail_condition],
        ['사진 기록', cl.photo_record],
        ['안내시설', cl.guide_facility]
      ];
      checklistHTML = \`
        <div style="margin-top:12px; padding-top:12px; border-top:1px solid #f0f0f0;">
          <div style="font-size:13px; font-weight:700; color:#1a7a3c; margin-bottom:8px;">✅ 생태 체크리스트</div>
          \${items.map(([k, v]) => \`
            <div style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid #f5f5f5;">
              <span style="color:#666;">\${k}</span>
              <span style="font-weight:600; color:#333;">\${v}</span>
            </div>
          \`).join('')}
        </div>
      \`;
    }
    
    document.getElementById('detailContent').innerHTML = \`
      <div class="detail-row"><span class="detail-key">종명</span><span class="detail-val" style="color:#1a7a3c; font-size:16px; font-weight:700;">\${r.species_name}</span></div>
      <div class="detail-row"><span class="detail-key">작성자</span><span class="detail-val">\${r.reporter_name}</span></div>
      <div class="detail-row"><span class="detail-key">장소</span><span class="detail-val">\${r.location_name}</span></div>
      <div class="detail-row"><span class="detail-key">상태</span><span class="detail-val"><span class="status-badge status-\${r.condition_status}">\${r.condition_status}</span></span></div>
      <div class="detail-row"><span class="detail-key">좌표</span><span class="detail-val">\${r.latitude ? '위도 ' + parseFloat(r.latitude).toFixed(6) + ', 경도 ' + parseFloat(r.longitude).toFixed(6) : '미등록'}</span></div>
      <div class="detail-row"><span class="detail-key">특이사항</span><span class="detail-val">\${r.special_notes || '없음'}</span></div>
      <div class="detail-row"><span class="detail-key">등록일시</span><span class="detail-val">\${date}</span></div>
      \${r.updated_at ? \`<div class="detail-row"><span class="detail-key">수정일시</span><span class="detail-val">\${new Date(r.updated_at).toLocaleString('ko-KR')}\${r.updated_by ? ' (' + r.updated_by + ')' : ''}</span></div>\` : ''}
      \${photosHTML}
      \${reinspHTML}
      \${checklistHTML}
    \`;
    
    document.getElementById('detailModal').classList.add('visible');
  } catch (e) {
    showToast('오류가 발생했습니다.');
  }
}

function closeDetail() {
  document.getElementById('detailModal').classList.remove('visible');
}

// ==================== 토스트 ====================
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(() => { toast.className = 'toast'; }, 2500);
}

// ==================== 초기화 ====================
document.addEventListener('DOMContentLoaded', () => {
  renderPhotoGrid();
  selectStatus('양호');
});
</script>
</body>
</html>`
}

function adminHTML(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>생태ON | 관리자</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; background: #f0f7f0; margin: 0; }
    .admin-wrap { max-width: 1200px; margin: 0 auto; padding: 20px; }
    
    .admin-header { 
      background: linear-gradient(135deg, #1a7a3c, #2d9e52); 
      color: #fff; padding: 16px 24px; border-radius: 16px; margin-bottom: 20px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .admin-logo { display: flex; align-items: center; gap: 12px; }
    .admin-logo .logo-main { font-size: 24px; font-weight: 900; }
    .admin-logo .logo-main span { color: #a8e6bc; }
    .admin-badge { font-size: 12px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3); }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: #fff; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.07); border-top: 4px solid; }
    .stat-card.green { border-top-color: #4caf50; }
    .stat-card.orange { border-top-color: #ff9800; }
    .stat-card.red { border-top-color: #f44336; }
    .stat-card.brown { border-top-color: #795548; }
    .stat-num { font-size: 32px; font-weight: 800; color: #1a7a3c; }
    .stat-label { font-size: 13px; color: #888; margin-top: 4px; }
    
    .section-card { background: #fff; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
    .section-title { font-size: 16px; font-weight: 700; color: #1a7a3c; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    
    .login-box { max-width: 360px; margin: 60px auto; background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .login-logo { text-align: center; margin-bottom: 24px; }
    .login-logo .logo-main { font-size: 32px; font-weight: 900; color: #1a7a3c; }
    .login-logo .logo-main span { color: #4caf50; }
    .login-logo .logo-sub { font-size: 14px; color: #888; margin-top: 4px; }
    
    .form-group { margin-bottom: 14px; }
    .form-label { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; display: block; }
    .form-input { width: 100%; padding: 11px 14px; border: 1.5px solid #ddd; border-radius: 10px; font-size: 14px; outline: none; }
    .form-input:focus { border-color: #2d9e52; }
    .form-select { width: 100%; padding: 8px 12px; border: 1.5px solid #ddd; border-radius: 8px; font-size: 13px; }
    .form-textarea { width: 100%; padding: 8px 12px; border: 1.5px solid #ddd; border-radius: 8px; font-size: 13px; min-height: 70px; resize: vertical; }
    
    .btn-primary { padding: 10px 20px; background: linear-gradient(135deg, #1a7a3c, #2d9e52); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-secondary { padding: 8px 16px; background: #f5f5f5; color: #555; border: 1.5px solid #ddd; border-radius: 8px; font-size: 13px; cursor: pointer; }
    .btn-danger { padding: 6px 12px; background: #fff; color: #e53935; border: 1.5px solid #e53935; border-radius: 8px; font-size: 12px; cursor: pointer; }
    .btn-edit { padding: 6px 12px; background: #fff; color: #1565c0; border: 1.5px solid #1565c0; border-radius: 8px; font-size: 12px; cursor: pointer; }
    
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f1f8e9; padding: 10px 12px; text-align: left; font-weight: 700; color: #2e7d32; border-bottom: 2px solid #a5d6a7; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr:hover td { background: #fafffe; }
    
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-양호 { background: #e8f5e9; color: #2e7d32; }
    .status-보통 { background: #fff3e0; color: #e65100; }
    .status-불량 { background: #fce4ec; color: #c62828; }
    .status-고사 { background: #efebe9; color: #3e2723; }
    
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; overflow-y: auto; }
    .modal-overlay.visible { display: flex; align-items: flex-start; justify-content: center; padding: 20px; }
    .modal-box { background: #fff; border-radius: 20px; padding: 24px; width: 100%; max-width: 600px; margin: auto; }
    .modal-title { font-size: 18px; font-weight: 700; color: #1a7a3c; margin-bottom: 16px; }
    
    .toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 10px 24px; border-radius: 20px; font-size: 13px; z-index: 99999; display: none; white-space: nowrap; }
    .toast.show { display: block; animation: fadeInOut 2.5s forwards; }
    @keyframes fadeInOut { 0%{opacity:0;transform:translateX(-50%) translateY(10px)} 15%{opacity:1;transform:translateX(-50%) translateY(0)} 75%{opacity:1} 100%{opacity:0} }
    
    .admin-footer { text-align: center; padding: 16px; font-size: 11px; color: #aaa; border-top: 1px solid #e0e0e0; margin-top: 20px; }

    .filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .search-input { padding: 8px 14px; border: 1.5px solid #ddd; border-radius: 10px; font-size: 13px; min-width: 180px; }
    .export-btn { padding: 8px 16px; background: #4caf50; color: #fff; border: none; border-radius: 10px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    
    .check-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
    .check-row input[type=checkbox] { width: 16px; height: 16px; accent-color: #2d9e52; }
    .check-row label { font-size: 13px; color: #444; }
  </style>
</head>
<body>

<!-- 로그인 화면 -->
<div id="loginScreen">
  <div class="admin-wrap">
    <div class="login-box">
      <div class="login-logo">
        <div class="logo-main">생태<span>ON</span></div>
        <div class="logo-sub">관리자 페이지</div>
      </div>
      <div class="form-group">
        <label class="form-label">아이디</label>
        <input type="text" class="form-input" id="loginId" placeholder="admin" value="admin" />
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호</label>
        <input type="password" class="form-input" id="loginPw" placeholder="비밀번호 입력" value="admin1234" onkeydown="if(event.key==='Enter')doLogin()" />
      </div>
      <button class="btn-primary" style="width:100%; padding:13px;" onclick="doLogin()">
        <i class="fas fa-sign-in-alt"></i> 로그인
      </button>
      <div style="margin-top:12px; text-align:center;">
        <a href="/" style="font-size:12px; color:#888; text-decoration:none;"><i class="fas fa-arrow-left"></i> 앱으로 돌아가기</a>
      </div>
    </div>
  </div>
</div>

<!-- 관리자 화면 -->
<div id="adminScreen" style="display:none;">
  <div class="admin-wrap">
    <div class="admin-header">
      <div class="admin-logo">
        <div>🌿</div>
        <div>
          <div class="logo-main">생태<span>ON</span></div>
          <div style="font-size:11px; opacity:0.8;">제주 생태 모니터링 관리자</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <span class="admin-badge"><i class="fas fa-user-shield"></i> 관리자</span>
        <button onclick="doLogout()" style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.3); padding:7px 14px; border-radius:8px; font-size:12px; cursor:pointer;">
          <i class="fas fa-sign-out-alt"></i> 로그아웃
        </button>
        <a href="/" style="background:rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.3); padding:7px 14px; border-radius:8px; font-size:12px; text-decoration:none; cursor:pointer;">
          <i class="fas fa-home"></i> 앱으로
        </a>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div class="stat-card green">
        <div class="stat-num" id="statTotal">-</div>
        <div class="stat-label">전체 기록</div>
      </div>
      <div class="stat-card green">
        <div class="stat-num" id="statGood">-</div>
        <div class="stat-label">양호</div>
      </div>
      <div class="stat-card orange">
        <div class="stat-num" id="statNormal">-</div>
        <div class="stat-label">보통</div>
      </div>
      <div class="stat-card red">
        <div class="stat-num" id="statBad">-</div>
        <div class="stat-label">불량</div>
      </div>
      <div class="stat-card brown">
        <div class="stat-num" id="statDead">-</div>
        <div class="stat-label">고사</div>
      </div>
    </div>

    <!-- 데이터 목록 -->
    <div class="section-card">
      <div class="section-title"><i class="fas fa-table"></i> 모니터링 기록 목록</div>
      
      <div class="filter-bar">
        <input type="text" class="search-input" id="searchInput" placeholder="🔍 종명, 장소, 이름 검색..." oninput="filterRecords()" />
        <select id="statusFilter" class="form-select" style="width:auto;" onchange="filterRecords()">
          <option value="">전체 상태</option>
          <option value="양호">양호</option>
          <option value="보통">보통</option>
          <option value="불량">불량</option>
          <option value="고사">고사</option>
        </select>
        <button class="export-btn" onclick="exportCSV()">
          <i class="fas fa-download"></i> CSV 내보내기
        </button>
        <button class="btn-secondary" onclick="loadAdminRecords()">
          <i class="fas fa-sync-alt"></i> 새로고침
        </button>
      </div>

      <div style="overflow-x:auto;">
        <table id="recordTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>종명</th>
              <th>장소</th>
              <th>작성자</th>
              <th>상태</th>
              <th>좌표</th>
              <th>등록일</th>
              <th>사진수</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody id="recordTableBody">
            <tr><td colspan="9" style="text-align:center; color:#aaa; padding:30px;">
              <i class="fas fa-spinner fa-spin"></i> 로딩 중...
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  
  <div class="admin-footer">© 제주녹색환경지원센터(제주생태계서비스지원센터)</div>
</div>

<!-- 수정 모달 -->
<div class="modal-overlay" id="editModal">
  <div class="modal-box">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div class="modal-title"><i class="fas fa-edit"></i> 기록 수정</div>
      <button onclick="closeEditModal()" style="background:none; border:none; font-size:22px; color:#888; cursor:pointer;">✕</button>
    </div>
    
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" class="form-input" id="edit-reporterName" />
      </div>
      <div class="form-group">
        <label class="form-label">장소명 *</label>
        <input type="text" class="form-input" id="edit-locationName" />
      </div>
      <div class="form-group">
        <label class="form-label">종명 *</label>
        <input type="text" class="form-input" id="edit-speciesName" />
      </div>
      <div class="form-group">
        <label class="form-label">상태</label>
        <select class="form-select" id="edit-conditionStatus">
          <option value="양호">양호</option>
          <option value="보통">보통</option>
          <option value="불량">불량</option>
          <option value="고사">고사</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">위도</label>
        <input type="number" class="form-input" id="edit-latitude" step="0.000001" />
      </div>
      <div class="form-group">
        <label class="form-label">경도</label>
        <input type="number" class="form-input" id="edit-longitude" step="0.000001" />
      </div>
    </div>
    
    <div class="form-group">
      <label class="form-label">특이사항</label>
      <textarea class="form-textarea" id="edit-specialNotes"></textarea>
    </div>
    
    <div class="form-group">
      <label class="form-label">수정자 이름</label>
      <input type="text" class="form-input" id="edit-updatedBy" placeholder="수정자 이름 입력" />
    </div>

    <!-- 재점검 사항 -->
    <div style="border-top:1px solid #f0f0f0; padding-top:14px; margin-top:6px;">
      <div class="form-label" style="font-weight:700; color:#1a7a3c; margin-bottom:10px;">📋 재점검 사항</div>
      <div class="check-row"><input type="checkbox" id="edit-removalDone" /><label for="edit-removalDone">제거 완료</label></div>
      <div class="check-row"><input type="checkbox" id="edit-noRecurrence" /><label for="edit-noRecurrence">재발생 없음</label></div>
      <div class="check-row"><input type="checkbox" id="edit-spreadCheck" /><label for="edit-spreadCheck">확산 확인</label></div>
      <div class="form-group" style="margin-top:10px;">
        <label class="form-label">재점검 일자</label>
        <input type="date" class="form-input" id="edit-reinspectionDate" />
      </div>
      <div class="form-group">
        <label class="form-label">재점검 메모</label>
        <textarea class="form-textarea" id="edit-reinspectionMemo" style="min-height:60px;"></textarea>
      </div>
    </div>

    <!-- 체크리스트 -->
    <div style="border-top:1px solid #f0f0f0; padding-top:14px; margin-top:6px;">
      <div class="form-label" style="font-weight:700; color:#1a7a3c; margin-bottom:10px;">✅ 생태 체크리스트</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div class="form-group">
          <label class="form-label">① 식생 훼손</label>
          <select class="form-select" id="edit-cl-vegetation">
            <option>양호</option><option>보통</option><option>미흡</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">② 외래종 발생</label>
          <select class="form-select" id="edit-cl-invasive">
            <option>없음</option><option>있음</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">③ 환경 관리</label>
          <select class="form-select" id="edit-cl-environment">
            <option>없음</option><option>있음</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">④ 탐방로 상태</label>
          <select class="form-select" id="edit-cl-trail">
            <option>양호</option><option>정비 필요</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">⑤ 사진 기록</label>
          <select class="form-select" id="edit-cl-photo">
            <option>완료</option><option>미완료</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">⑥ 안내시설</label>
          <select class="form-select" id="edit-cl-guide">
            <option>양호</option><option>보통</option><option>미흡</option>
          </select>
        </div>
      </div>
    </div>

    <div style="display:flex; gap:10px; margin-top:16px;">
      <button class="btn-secondary" onclick="closeEditModal()" style="flex:1;">취소</button>
      <button class="btn-primary" onclick="saveEdit()" style="flex:2;">
        <i class="fas fa-save"></i> 저장하기
      </button>
    </div>
  </div>
</div>

<div class="toast" id="adminToast"></div>

<script>
let currentEditId = null;
let allRecords = [];

// ==================== 로그인 ====================
async function doLogin() {
  const username = document.getElementById('loginId').value;
  const password = document.getElementById('loginPw').value;
  
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('adminLoggedIn', '1');
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminScreen').style.display = 'block';
      loadAdminRecords();
    } else {
      showToast('❌ ' + (data.error || '로그인 실패'));
    }
  } catch (e) {
    showToast('❌ 서버 연결 오류');
  }
}

function doLogout() {
  sessionStorage.removeItem('adminLoggedIn');
  document.getElementById('adminScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'block';
}

// 세션 유지
if (sessionStorage.getItem('adminLoggedIn') === '1') {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminScreen').style.display = 'block';
  loadAdminRecords();
}

// ==================== 기록 로드 ====================
async function loadAdminRecords() {
  try {
    const res = await fetch('/api/records');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    
    allRecords = data.data || [];
    updateStats();
    renderTable(allRecords);
  } catch (e) {
    document.getElementById('recordTableBody').innerHTML = 
      '<tr><td colspan="9" style="text-align:center; color:#e53935;">데이터 로드 실패</td></tr>';
  }
}

function updateStats() {
  document.getElementById('statTotal').textContent = allRecords.length;
  document.getElementById('statGood').textContent = allRecords.filter(r => r.condition_status === '양호').length;
  document.getElementById('statNormal').textContent = allRecords.filter(r => r.condition_status === '보통').length;
  document.getElementById('statBad').textContent = allRecords.filter(r => r.condition_status === '불량').length;
  document.getElementById('statDead').textContent = allRecords.filter(r => r.condition_status === '고사').length;
}

function renderTable(records) {
  const tbody = document.getElementById('recordTableBody');
  if (!records.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#aaa; padding:30px;">기록이 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = records.map(r => {
    const date = new Date(r.created_at).toLocaleDateString('ko-KR');
    const coords = r.latitude ? parseFloat(r.latitude).toFixed(4) + ', ' + parseFloat(r.longitude).toFixed(4) : '-';
    return \`
      <tr>
        <td style="color:#aaa; font-size:12px;">#\${r.id}</td>
        <td style="font-weight:600; color:#1a7a3c;">\${r.species_name}</td>
        <td>\${r.location_name}</td>
        <td>\${r.reporter_name}</td>
        <td><span class="status-badge status-\${r.condition_status}">\${r.condition_status}</span></td>
        <td style="font-size:11px; color:#888;">\${coords}</td>
        <td style="font-size:12px; color:#888;">\${date}</td>
        <td style="text-align:center;">\${r.photo_count || 0}</td>
        <td>
          <div style="display:flex; gap:5px;">
            <button class="btn-edit" onclick="openEditModal(\${r.id})"><i class="fas fa-edit"></i> 수정</button>
            <button class="btn-danger" onclick="deleteRecord(\${r.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    \`;
  }).join('');
}

// ==================== 필터 ====================
function filterRecords() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('statusFilter').value;
  const filtered = allRecords.filter(r => {
    const matchKw = !keyword || 
      r.species_name.toLowerCase().includes(keyword) ||
      r.location_name.toLowerCase().includes(keyword) ||
      r.reporter_name.toLowerCase().includes(keyword);
    const matchStatus = !status || r.condition_status === status;
    return matchKw && matchStatus;
  });
  renderTable(filtered);
}

// ==================== CSV 내보내기 ====================
function exportCSV() {
  const headers = ['ID', '종명', '장소', '작성자', '상태', '위도', '경도', '특이사항', '등록일시', '수정일시', '수정자'];
  const rows = allRecords.map(r => [
    r.id, r.species_name, r.location_name, r.reporter_name, r.condition_status,
    r.latitude || '', r.longitude || '', (r.special_notes || '').replace(/,/g, '；'),
    r.created_at, r.updated_at || '', r.updated_by || ''
  ]);
  const csv = '\\uFEFF' + [headers, ...rows].map(r => r.join(',')).join('\\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '생태ON_모니터링_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ CSV 파일을 내보냈습니다.');
}

// ==================== 수정 ====================
async function openEditModal(id) {
  currentEditId = id;
  try {
    const res = await fetch(\`/api/records/\${id}\`);
    const data = await res.json();
    if (!data.success) { showToast('데이터를 불러올 수 없습니다.'); return; }
    
    const r = data.data;
    document.getElementById('edit-reporterName').value = r.reporter_name || '';
    document.getElementById('edit-locationName').value = r.location_name || '';
    document.getElementById('edit-speciesName').value = r.species_name || '';
    document.getElementById('edit-conditionStatus').value = r.condition_status || '양호';
    document.getElementById('edit-latitude').value = r.latitude || '';
    document.getElementById('edit-longitude').value = r.longitude || '';
    document.getElementById('edit-specialNotes').value = r.special_notes || '';
    document.getElementById('edit-updatedBy').value = '';
    
    // 재점검
    if (r.reinspection) {
      document.getElementById('edit-removalDone').checked = !!r.reinspection.removal_done;
      document.getElementById('edit-noRecurrence').checked = !!r.reinspection.no_recurrence;
      document.getElementById('edit-spreadCheck').checked = !!r.reinspection.spread_check;
      document.getElementById('edit-reinspectionDate').value = r.reinspection.reinspection_date || '';
      document.getElementById('edit-reinspectionMemo').value = r.reinspection.reinspection_memo || '';
    }
    
    // 체크리스트
    if (r.checklist) {
      document.getElementById('edit-cl-vegetation').value = r.checklist.vegetation_damage || '양호';
      document.getElementById('edit-cl-invasive').value = r.checklist.invasive_species || '없음';
      document.getElementById('edit-cl-environment').value = r.checklist.environment_mgmt || '없음';
      document.getElementById('edit-cl-trail').value = r.checklist.trail_condition || '양호';
      document.getElementById('edit-cl-photo').value = r.checklist.photo_record || '완료';
      document.getElementById('edit-cl-guide').value = r.checklist.guide_facility || '양호';
    }
    
    document.getElementById('editModal').classList.add('visible');
  } catch (e) {
    showToast('오류가 발생했습니다.');
  }
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('visible');
  currentEditId = null;
}

async function saveEdit() {
  if (!currentEditId) return;
  
  const payload = {
    reporter_name: document.getElementById('edit-reporterName').value,
    location_name: document.getElementById('edit-locationName').value,
    species_name: document.getElementById('edit-speciesName').value,
    condition_status: document.getElementById('edit-conditionStatus').value,
    latitude: parseFloat(document.getElementById('edit-latitude').value) || null,
    longitude: parseFloat(document.getElementById('edit-longitude').value) || null,
    special_notes: document.getElementById('edit-specialNotes').value,
    updated_by: document.getElementById('edit-updatedBy').value,
    reinspection: {
      removal_done: document.getElementById('edit-removalDone').checked,
      no_recurrence: document.getElementById('edit-noRecurrence').checked,
      spread_check: document.getElementById('edit-spreadCheck').checked,
      reinspection_date: document.getElementById('edit-reinspectionDate').value,
      reinspection_memo: document.getElementById('edit-reinspectionMemo').value
    },
    checklist: {
      vegetation_damage: document.getElementById('edit-cl-vegetation').value,
      invasive_species: document.getElementById('edit-cl-invasive').value,
      environment_mgmt: document.getElementById('edit-cl-environment').value,
      trail_condition: document.getElementById('edit-cl-trail').value,
      photo_record: document.getElementById('edit-cl-photo').value,
      guide_facility: document.getElementById('edit-cl-guide').value
    }
  };
  
  try {
    const res = await fetch(\`/api/records/\${currentEditId}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ 수정이 완료되었습니다.');
      closeEditModal();
      loadAdminRecords();
    } else {
      showToast('❌ ' + (data.error || '수정 실패'));
    }
  } catch (e) {
    showToast('❌ 네트워크 오류');
  }
}

// ==================== 삭제 ====================
async function deleteRecord(id) {
  if (!confirm(\`기록 #\${id}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.\`)) return;
  
  try {
    const res = await fetch(\`/api/records/\${id}\`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('✅ 삭제되었습니다.');
      loadAdminRecords();
    } else {
      showToast('❌ ' + (data.error || '삭제 실패'));
    }
  } catch (e) {
    showToast('❌ 네트워크 오류');
  }
}

// ==================== 토스트 ====================
function showToast(msg) {
  const toast = document.getElementById('adminToast');
  toast.textContent = msg;
  toast.className = 'toast show';
  setTimeout(() => { toast.className = 'toast'; }, 2500);
}
</script>
</body>
</html>`
}

export default app
