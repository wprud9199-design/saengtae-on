import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import api from './routes/api'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.route('/api', api)
app.use('/static/*', serveStatic({ root: './public' }))

app.get('/admin', (c) => c.html(adminHTML()))
app.get('*',      (c) => c.html(mainHTML()))

// ═══════════════════════════════════════════
// MAIN APP HTML
// ═══════════════════════════════════════════
function mainHTML(): string { return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<title>생태ON | 제주 생태 모니터링</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#f0f7f0;margin:0}
.app{max-width:480px;margin:0 auto;min-height:100vh;background:#fff;display:flex;flex-direction:column}

/* ── 헤더 ── */
.app-header{background:linear-gradient(135deg,#1a7a3c 0%,#2d9e52 50%,#43b86a 100%);padding:14px 18px 16px;position:sticky;top:0;z-index:100;box-shadow:0 2px 12px rgba(0,0,0,.15)}
.hdr-row{display:flex;align-items:center;justify-content:space-between}
.logo-wrap{display:flex;align-items:center;gap:9px}
.logo-icon{width:40px;height:40px;background:rgba(255,255,255,.2);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:20px;border:1.5px solid rgba(255,255,255,.3)}
.logo-main{font-size:26px;font-weight:900;color:#fff;line-height:1;letter-spacing:-.5px}
.logo-main .on{color:#a8e6bc}
.logo-sub{font-size:11px;color:rgba(255,255,255,.85);margin-top:1px}
.hdr-badge{font-size:10px;background:rgba(255,255,255,.18);color:#fff;padding:2px 9px;border-radius:20px;border:1px solid rgba(255,255,255,.3);margin-top:5px;display:inline-block}
.hdr-user-btn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;padding:6px 10px;border-radius:8px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:5px}

/* ── 탭 ── */
.tab-nav{display:flex;background:#fff;border-bottom:2px solid #e8f5e9;flex-shrink:0}
.tab-btn{flex:1;padding:11px 0;text-align:center;font-size:12px;font-weight:600;color:#999;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;transition:all .2s}
.tab-btn i{display:block;font-size:15px;margin-bottom:2px}
.tab-btn.active{color:#1a7a3c;border-bottom-color:#1a7a3c}

/* ── 콘텐츠 ── */
.content{flex:1;overflow-y:auto;padding:14px 14px 90px}
.panel{display:none}.panel.active{display:block}

/* ── 카드 ── */
.card{background:#fff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.07);border:1px solid #e8f5e9}
.card-ttl{font-size:13px;font-weight:700;color:#1a7a3c;display:flex;align-items:center;gap:6px;margin-bottom:11px;padding-bottom:8px;border-bottom:1px solid #e8f5e9}

/* ── 폼 ── */
.fg{margin-bottom:12px}
.fl{font-size:12px;font-weight:600;color:#555;margin-bottom:4px;display:block}
.fl .req{color:#e53935;margin-left:2px}
.fi,.fs,.ft{width:100%;padding:9px 11px;border:1.5px solid #ddd;border-radius:9px;font-size:13px;color:#333;background:#fafafa;outline:none;transition:border-color .2s;-webkit-appearance:none}
.fi:focus,.fs:focus,.ft:focus{border-color:#2d9e52;background:#fff}
.ft{min-height:70px;resize:vertical}
.fs{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23666' d='M6 8L0 0h12z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center;padding-right:30px}

/* ── 상태버튼 ── */
.sbg{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.sbtn{padding:7px 4px;border-radius:9px;font-size:11px;font-weight:600;border:2px solid #e0e0e0;text-align:center;cursor:pointer;transition:all .2s;background:#fafafa}
.sbtn.ag{background:#e8f5e9;border-color:#4caf50;color:#2e7d32}
.sbtn.an{background:#fff3e0;border-color:#ff9800;color:#e65100}
.sbtn.ab{background:#fce4ec;border-color:#f44336;color:#c62828}
.sbtn.ad{background:#efebe9;border-color:#795548;color:#3e2723}

/* ── 사진 ── */
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.pslot{aspect-ratio:1;border-radius:9px;border:2px dashed #ccc;background:#fafafa;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;position:relative}
.pslot img{width:100%;height:100%;object-fit:cover}
.pslot.hp{border-style:solid;border-color:#2d9e52}
.pdel{position:absolute;top:3px;right:3px;width:19px;height:19px;background:rgba(0,0,0,.6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;cursor:pointer}
.pcnt{text-align:right;font-size:11px;color:#888;margin-top:3px}

/* ── 위치 ── */
.loc-disp{background:#f1f8e9;border:1.5px solid #a5d6a7;border-radius:9px;padding:9px 11px;font-size:12px;color:#2e7d32;margin-top:7px;display:none}
.loc-disp.vis{display:flex;align-items:center;gap:7px}

/* ── 체크리스트 ── */
.cl-row{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;padding:9px 0;border-bottom:1px solid #f0f0f0}
.cl-row:last-child{border-bottom:none}
.cl-lbl{font-size:12px;color:#333}
.cl-sub{font-size:10px;color:#999;margin-top:1px}
.cl-sel{padding:5px 7px;border:1.5px solid #ddd;border-radius:7px;font-size:11px;background:#fafafa}

/* ── 체크박스 ── */
.ci{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid #f5f5f5;cursor:pointer}
.ci:last-child{border-bottom:none}
.cbox{width:20px;height:20px;border:2px solid #ccc;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
.cbox.ck{background:#2d9e52;border-color:#2d9e52}
.cbox.ck::after{content:'✓';color:#fff;font-size:12px;font-weight:700}

/* ── 버튼 ── */
.btn-p{width:100%;padding:13px;background:linear-gradient(135deg,#1a7a3c,#2d9e52);color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px}
.btn-s{padding:8px 15px;background:#f5f5f5;color:#555;border:1.5px solid #ddd;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer}
.btn-o{padding:7px 13px;background:#fff;color:#1a7a3c;border:1.5px solid #1a7a3c;border-radius:8px;font-size:11px;cursor:pointer}

/* ── 목록 카드 ── */
.rc{background:#fff;border-radius:13px;padding:13px;margin-bottom:11px;box-shadow:0 2px 7px rgba(0,0,0,.06);border-left:4px solid #2d9e52}
.rc-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:7px}
.rc-sp{font-size:15px;font-weight:700;color:#1a7a3c}
.rc-dt{font-size:10px;color:#bbb}
.rc-info{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-bottom:7px}
.rc-ii{font-size:11px;color:#777}
.rc-ii i{width:14px;color:#2d9e52}
.badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600}
.s-양호{background:#e8f5e9;color:#2e7d32}
.s-보통{background:#fff3e0;color:#e65100}
.s-불량{background:#fce4ec;color:#c62828}
.s-고사{background:#efebe9;color:#3e2723}

/* ── 지도 모달 ── */
#mapModal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;align-items:center;justify-content:center}
#mapModal.vis{display:flex}
.map-wrap{background:#fff;border-radius:18px;overflow:hidden;width:calc(100vw - 28px);max-width:455px;max-height:92vh;display:flex;flex-direction:column}
.map-hdr{padding:13px 15px;background:#1a7a3c;color:#fff;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
#leafletMap{flex:1;min-height:340px;width:100%;z-index:1}
.map-ft{padding:11px 15px;border-top:1px solid #eee;background:#f9f9f9;flex-shrink:0}
.map-coords-box{background:#f1f8e9;border:1.5px solid #a5d6a7;border-radius:9px;padding:8px 12px;font-size:12px;color:#2e7d32;display:flex;align-items:center;gap:7px;min-height:36px;margin-bottom:9px}
.map-hint{font-size:11px;color:#aaa;text-align:center;margin-bottom:8px}
.map-btn-row{display:flex;gap:7px}
.map-loc-btn{flex:1;padding:9px 0;background:linear-gradient(135deg,#1565c0,#1e88e5);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px}
.map-loc-btn:active{opacity:.85}
/* Leaflet z-index 조정 (모달 내부에서 정상 작동하도록) */
.leaflet-pane{z-index:2!important}
.leaflet-top,.leaflet-bottom{z-index:3!important}
.leaflet-control{z-index:3!important}

/* ── 인증 화면 ── */
.auth-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;background:linear-gradient(160deg,#1a7a3c 0%,#2d9e52 40%,#f0f7f0 70%)}
.auth-logo{text-align:center;margin-bottom:24px}
.auth-logo .lm{font-size:42px;font-weight:900;color:#fff;line-height:1}
.auth-logo .lm .on{color:#a8e6bc}
.auth-logo .ls{font-size:14px;color:rgba(255,255,255,.85);margin-top:4px}
.auth-logo .lb{font-size:11px;background:rgba(255,255,255,.2);color:#fff;padding:3px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.3);margin-top:8px;display:inline-block}
.auth-box{background:#fff;border-radius:20px;padding:24px 20px;width:100%;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,.15)}
.auth-tabs{display:flex;border-bottom:2px solid #e8f5e9;margin-bottom:18px}
.auth-tab{flex:1;padding:10px;text-align:center;font-size:13px;font-weight:600;color:#999;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px}
.auth-tab.active{color:#1a7a3c;border-bottom-color:#1a7a3c}
.auth-panel{display:none}.auth-panel.active{display:block}
.auth-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.region-opts{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
.region-btn{padding:5px 10px;border:1.5px solid #ddd;border-radius:7px;font-size:11px;cursor:pointer;background:#fafafa}
.region-btn.sel{background:#e8f5e9;border-color:#2d9e52;color:#1a7a3c;font-weight:700}
.pending-box{background:#fff8e1;border:1.5px solid #ffc107;border-radius:12px;padding:16px;text-align:center;margin-top:12px}

/* ── 모달 ── */
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:8000;overflow-y:auto}
.modal-bg.vis{display:flex;align-items:flex-start;justify-content:center;padding:16px}
.mbox{background:#fff;border-radius:18px;padding:18px;width:100%;max-width:440px;margin:auto}
.mttl{font-size:16px;font-weight:700;color:#1a7a3c;margin-bottom:14px}
.drow{padding:7px 0;border-bottom:1px solid #f5f5f5;font-size:12px;display:flex;gap:7px}
.dk{color:#999;width:80px;flex-shrink:0}.dv{color:#333;font-weight:500;flex:1}

/* ── 빈상태/로딩 ── */
.empty{text-align:center;padding:36px 16px;color:#bbb}
.empty i{font-size:42px;margin-bottom:10px;display:block}
.spin{text-align:center;padding:24px;color:#888}

/* ── 토스트 ── */
.toast{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:9px 18px;border-radius:18px;font-size:12px;z-index:9998;display:none;white-space:nowrap}
.toast.show{display:block;animation:fio 2.5s forwards}
@keyframes fio{0%{opacity:0;transform:translateX(-50%) translateY(8px)}15%{opacity:1;transform:translateX(-50%)}75%{opacity:1}100%{opacity:0}}

/* ── 푸터 ── */
.app-footer{background:transparent;border-top:1px solid #e0e8d8;padding:14px 16px;text-align:center;flex-shrink:0}
.footer-logos{display:flex;justify-content:center;align-items:center;gap:24px;margin-bottom:6px;flex-wrap:wrap}
.footer-logo-img{height:38px;width:auto;object-fit:contain}
.footer-txt{font-size:10px;color:#aaa;line-height:1.5}
</style>
</head>
<body>

<!-- ══════════ 인증 화면 ══════════ -->
<div id="authWrap" class="auth-wrap">
  <div class="auth-logo">
    <div class="lm">생태<span class="on">ON</span></div>
    <div class="ls">제주 생태 모니터링</div>
    <div class="lb">제주형 생태계서비스지불제</div>
  </div>
  <div class="auth-box">
    <div class="auth-tabs">
      <div class="auth-tab active" id="atab-login" onclick="switchAuth('login')">로그인</div>
      <div class="auth-tab" id="atab-register" onclick="switchAuth('register')">회원가입</div>
    </div>
    <!-- 로그인 -->
    <div class="auth-panel active" id="apanel-login">
      <div class="fg"><label class="fl">아이디</label><input class="fi" id="login-id" placeholder="아이디 입력" onkeydown="if(event.key==='Enter')doLogin()"/></div>
      <div class="fg"><label class="fl">비밀번호</label><input class="fi" type="password" id="login-pw" placeholder="비밀번호 입력" onkeydown="if(event.key==='Enter')doLogin()"/></div>
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:12px;cursor:pointer" onclick="tglSave()">
        <div class="cbox" id="save-cbox" style="width:18px;height:18px;border-radius:4px"></div>
        <span style="font-size:12px;color:#666">아이디 · 비밀번호 저장</span>
      </div>
      <button class="btn-p" onclick="doLogin()" id="loginBtn"><i class="fas fa-sign-in-alt"></i> 로그인</button>
      <div id="loginMsg" style="margin-top:10px;font-size:12px;text-align:center;color:#e53935;display:none"></div>
      <div class="pending-box" id="pendingBox" style="display:none">
        <i class="fas fa-hourglass-half" style="color:#ffc107;font-size:24px;margin-bottom:8px;display:block"></i>
        <div style="font-size:13px;font-weight:700;color:#f57f17;margin-bottom:4px">관리자 승인 대기 중</div>
        <div style="font-size:12px;color:#795548">가입 신청이 접수되었습니다.<br>관리자 승인 후 서비스 이용이 가능합니다.</div>
      </div>
    </div>
    <!-- 회원가입 -->
    <div class="auth-panel" id="apanel-register">
      <div class="fg"><label class="fl">아이디 <span class="req">*</span></label><input class="fi" id="reg-id" placeholder="영문+숫자 4~20자"/></div>
      <div class="fg"><label class="fl">비밀번호 <span class="req">*</span></label><input class="fi" type="password" id="reg-pw" placeholder="6자 이상"/></div>
      <div class="auth-grid">
        <div class="fg"><label class="fl">이름 <span class="req">*</span></label><input class="fi" id="reg-name" placeholder="실명 입력"/></div>
        <div class="fg"><label class="fl">연락처</label><input class="fi" id="reg-phone" placeholder="010-0000-0000"/></div>
      </div>
      <div class="fg"><label class="fl">이메일</label><input class="fi" id="reg-email" type="email" placeholder="이메일 주소"/></div>
      <div class="fg"><label class="fl">소속 기관/단체</label><input class="fi" id="reg-org" placeholder="기관명 또는 단체명"/></div>
      <div class="fg">
        <label class="fl">담당 지역</label>
        <div class="region-opts" id="regRegionOpts">
          ${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면','우도면','추자면','전체'].map(r=>`<div class="region-btn" onclick="selRegion('${r}',this)">${r}</div>`).join('')}
        </div>
        <input type="hidden" id="reg-region" value=""/>
      </div>
      <button class="btn-p" onclick="doRegister()" id="regBtn"><i class="fas fa-user-plus"></i> 가입 신청</button>
      <div id="regMsg" style="margin-top:10px;font-size:12px;text-align:center;display:none"></div>
    </div>
  </div>
  <div style="text-align:center;margin-top:12px">
    <span style="font-size:11px;color:rgba(255,255,255,.7)">© 제주녹색환경지원센터</span>
  </div>
</div>

<!-- ══════════ 메인 앱 ══════════ -->
<div id="appWrap" class="app" style="display:none">
  <header class="app-header">
    <div class="hdr-row">
      <div class="logo-wrap">
        <div class="logo-icon">🌿</div>
        <div><div class="logo-main">생태<span class="on">ON</span></div><div class="logo-sub">제주 생태 모니터링</div></div>
      </div>
      <button class="hdr-user-btn" onclick="showUserMenu()">
        <i class="fas fa-user-circle"></i><span id="hdrUserName">사용자</span><i class="fas fa-chevron-down" style="font-size:9px"></i>
      </button>
    </div>
    <span class="hdr-badge">제주형 생태계서비스지불제</span>
  </header>

  <nav class="tab-nav">
    <button class="tab-btn active" onclick="sw('record')" id="tab-record"><i class="fas fa-plus-circle"></i>기록하기</button>
    <button class="tab-btn" onclick="sw('list')" id="tab-list"><i class="fas fa-list"></i>목록</button>
    <button class="tab-btn" onclick="sw('mypage')" id="tab-mypage"><i class="fas fa-user"></i>내정보</button>
  </nav>

  <div class="content">
    <!-- 기록하기 -->
    <div class="panel active" id="panel-record">
      <form id="mForm" onsubmit="submitForm(event)">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-user-circle"></i> 기본 정보</div>
          <div class="fg"><label class="fl">이름 <span class="req">*</span></label><input class="fi" id="rName" placeholder="이름 입력" required/></div>
          <!-- 조사일자 / 조사일시 -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="fg">
              <label class="fl">조사일자 <span class="req">*</span></label>
              <input type="date" class="fi" id="rSurveyDate" required/>
            </div>
            <div class="fg">
              <label class="fl">조사시각 <span class="req">*</span></label>
              <input type="time" class="fi" id="rSurveyTime" required/>
            </div>
          </div>
          <!-- 날씨 -->
          <div class="fg">
            <label class="fl">날씨 <span class="req">*</span></label>
            <select class="fs" id="rWeather" required>
              <option value="">-- 날씨를 선택하세요 --</option>
              <option>☀️ 맑음</option>
              <option>⛅ 구름 조금</option>
              <option>☁️ 흐림</option>
              <option>🌧️ 비</option>
              <option>⛈️ 천둥번개</option>
              <option>🌨️ 눈</option>
              <option>🌬️ 바람</option>
              <option>🌫️ 안개</option>
            </select>
          </div>
          <!-- 생태계 유형 -->
          <div class="fg">
            <label class="fl">생태계 유형 <span class="req">*</span></label>
            <select class="fs" id="rEcoType" required>
              <option value="">-- 생태계 유형을 선택하세요 --</option>
              <option>산림</option>
              <option>초지·습초지</option>
              <option>습지·하천</option>
              <option>해안·연안</option>
              <option>농경지</option>
              <option>도시·인공지</option>
              <option>오름</option>
              <option>곶자왈</option>
              <option>기타</option>
            </select>
          </div>
          <div class="fg"><label class="fl">장소명 <span class="req">*</span></label><input class="fi" id="rLoc" placeholder="조사 장소명" required/></div>
          <div class="fg">
            <label class="fl">지역 <span class="req">*</span></label>
            <select class="fs" id="rRegion" required>
              <option value="">-- 지역을 선택하세요 --</option>
              ${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면','우도면','추자면'].map(r=>`<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
          <div class="fg">
            <label class="fl">종명 <span class="req">*</span></label>
            <input class="fi" id="rSpecies" placeholder="식물/동물 종명 (모를 경우 '모름' 입력)" required/>
            <div style="font-size:11px;color:#f57f17;margin-top:4px"><i class="fas fa-info-circle"></i> 종명을 모르실 경우 <b>'모름'</b>으로 입력해주세요.</div>
          </div>
          <div class="fg">
            <label class="fl">상태</label>
            <div class="sbg">
              <button type="button" class="sbtn ag" id="sb-양호" onclick="selSt('양호')">🟢 양호</button>
              <button type="button" class="sbtn" id="sb-보통" onclick="selSt('보통')">🟡 보통</button>
              <button type="button" class="sbtn" id="sb-불량" onclick="selSt('불량')">🔴 불량</button>
              <button type="button" class="sbtn" id="sb-고사" onclick="selSt('고사')">⬛ 고사</button>
            </div>
            <input type="hidden" id="rStatus" value="양호"/>
          </div>
          <div class="fg"><label class="fl">특이사항 <span class="req">*</span></label><textarea class="ft" id="rNotes" placeholder="특이사항을 입력해주세요 (필수)" required></textarea></div>
        </div>

        <div class="card">
          <div class="card-ttl"><i class="fas fa-map-marker-alt"></i> 위치 정보</div>
          <button type="button" class="btn-p" style="background:linear-gradient(135deg,#1565c0,#1e88e5)" onclick="openMap()">
            <i class="fas fa-map-marked-alt"></i> 지도에서 위치 선택
          </button>
          <div class="loc-disp" id="locDisp">
            <i class="fas fa-check-circle"></i>
            <div><div id="locTxt" style="font-weight:700">위치 선택됨</div><div id="coordTxt" style="font-size:10px;color:#666;margin-top:1px"></div></div>
          </div>
          <input type="hidden" id="rLat"/><input type="hidden" id="rLng"/>
        </div>

        <div class="card">
          <div class="card-ttl"><i class="fas fa-camera"></i> 사진 등록 <span style="font-size:11px;color:#aaa;font-weight:400">(최대 10장)</span></div>
          <div class="pgrid" id="pgrid"></div>
          <div class="pcnt"><span id="pcnt">0</span>/10장</div>
          <!-- accept에 image/* 만 지정 → 갤럭시/애플 모두 갤러리+카메라 선택 가능 -->
          <input type="file" id="pinput" accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif" multiple style="display:none" onchange="addPhotos(event)"/>
        </div>

        <div class="card">
          <div class="card-ttl"><i class="fas fa-redo"></i> 재점검 사항</div>

          <!-- 등록 유형 선택 -->
          <div class="fg">
            <label class="fl">등록 유형 <span class="req">*</span></label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <button type="button" id="regBtn-new" class="reg-btn reg-active" onclick="setRegType('신규등록')">
                <i class="fas fa-plus-circle"></i> 신규등록
              </button>
              <button type="button" id="regBtn-re" class="reg-btn" onclick="setRegType('재점검')">
                <i class="fas fa-search"></i> 재점검
              </button>
            </div>
            <input type="hidden" id="rRegType" value="신규등록"/>
          </div>

          <!-- 재점검 결과 (재점검 선택 시만 표시) -->
          <div id="riSection" style="display:none;margin-top:4px">
            <div style="font-size:12px;font-weight:700;color:#555;margin-bottom:7px">
              재점검 결과 <span class="req">*</span>
              <span style="font-size:10px;font-weight:400;color:#aaa">(1개 이상 선택 필수)</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 8px">
              <div class="ci" onclick="tgl('ri-1')"><div class="cbox" id="ri-1"></div><span style="font-size:11px;color:#444">제거(교란종 등) 완료</span></div>
              <div class="ci" onclick="tgl('ri-2')"><div class="cbox" id="ri-2"></div><span style="font-size:11px;color:#444">재발생 없음</span></div>
              <div class="ci" onclick="tgl('ri-3')"><div class="cbox" id="ri-3"></div><span style="font-size:11px;color:#444">재발생 확인</span></div>
              <div class="ci" onclick="tgl('ri-4')"><div class="cbox" id="ri-4"></div><span style="font-size:11px;color:#444">확산 확인</span></div>
              <div class="ci" onclick="tgl('ri-5')"><div class="cbox" id="ri-5"></div><span style="font-size:11px;color:#444">개체 수 감소</span></div>
              <div class="ci" onclick="tgl('ri-6')"><div class="cbox" id="ri-6"></div><span style="font-size:11px;color:#444">개체 수 증가</span></div>
              <div class="ci" onclick="tgl('ri-7')"><div class="cbox" id="ri-7"></div><span style="font-size:11px;color:#444">추가 조치 필요</span></div>
              <div class="ci" onclick="tgl('ri-8')"><div class="cbox" id="ri-8"></div><span style="font-size:11px;color:#444">지속 관찰 필요</span></div>
              <div class="ci" onclick="tgl('ri-9')"><div class="cbox" id="ri-9"></div><span style="font-size:11px;color:#444">이전 조사와 동일</span></div>
            </div>
            <div class="fg" style="margin-top:10px">
              <label class="fl">재점검 메모 <span class="req">*</span></label>
              <textarea class="ft" id="riMemo" style="min-height:55px" placeholder="재점검 내용을 입력해주세요..."></textarea>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-ttl"><i class="fas fa-clipboard-check"></i> 생태 모니터링 체크리스트</div>
          <div class="cl-row"><div><div class="cl-lbl"><b>① 식생 훼손 여부</b></div><div class="cl-sub">훼손 및 우려지역 존재 여부</div></div><select class="cl-sel" id="cl-v"><option value="">-- 선택 --</option><option>양호</option><option>보통</option><option>미흡</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>② 외래종 발생</b></div><div class="cl-sub">외래식물·교란종 확인 여부</div></div><select class="cl-sel" id="cl-i"><option value="">-- 선택 --</option><option>없음</option><option>있음</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>③ 환경 관리</b></div><div class="cl-sub">불법투기 및 폐기물 발생 여부</div></div><select class="cl-sel" id="cl-e"><option value="">-- 선택 --</option><option>없음</option><option>있음</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>④ 탐방로 상태</b></div><div class="cl-sub">탐방로 침식·파손 여부</div></div><select class="cl-sel" id="cl-t"><option value="">-- 선택 --</option><option>양호</option><option>정비 필요</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>⑤ 사진 기록</b></div><div class="cl-sub">동일지점 사진 촬영 여부</div></div><select class="cl-sel" id="cl-p"><option value="">-- 선택 --</option><option>완료</option><option>미완료</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>⑥ 안내시설</b></div><div class="cl-sub">안내판 및 시설물 상태</div></div><select class="cl-sel" id="cl-g"><option value="">-- 선택 --</option><option>양호</option><option>보통</option><option>미흡</option><option>안내시설 없음</option></select></div>
        </div>

        <button type="submit" class="btn-p" id="subBtn"><i class="fas fa-paper-plane"></i> 기록 제출</button>
      </form>
    </div>

    <!-- 목록 -->
    <div class="panel" id="panel-list">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;color:#777">총 <span id="rTotal" style="font-weight:700;color:#1a7a3c">0</span>건</div>
        <button class="btn-s" onclick="loadRec()"><i class="fas fa-sync-alt"></i> 새로고침</button>
      </div>
      <div id="recList"><div class="spin"><i class="fas fa-spinner fa-spin"></i></div></div>
    </div>

    <!-- 내정보 -->
    <div class="panel" id="panel-mypage">
      <div class="card">
        <div class="card-ttl"><i class="fas fa-user-circle"></i> 내 정보</div>
        <div id="myInfo"></div>
      </div>
      <div class="card">
        <div class="card-ttl"><i class="fas fa-chart-bar"></i> 나의 기록 현황</div>
        <div id="myStats"></div>
      </div>
      <button class="btn-p" style="background:linear-gradient(135deg,#666,#888);margin-top:8px" onclick="doLogout()">
        <i class="fas fa-sign-out-alt"></i> 로그아웃
      </button>
    </div>
  </div>

  <footer class="app-footer">
    <div class="footer-logos">
      <img src="/static/logo_jgec.png" alt="제주녹색환경지원센터" class="footer-logo-img">
      <img src="/static/logo_jpesc.png" alt="제주특별자치도 생태계서비스지원센터" class="footer-logo-img">
    </div>
    <div class="footer-txt">© 제주녹색환경지원센터 · 제주특별자치도 생태계서비스지원센터</div>
  </footer>
</div>

<!-- 지도 모달 -->
<div id="mapModal">
  <div class="map-wrap">
    <div class="map-hdr">
      <h3 style="font-size:14px;font-weight:700"><i class="fas fa-map-marked-alt"></i> 위치 선택</h3>
      <button onclick="closeMap()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;line-height:1">✕</button>
    </div>
    <!-- Leaflet 지도 컨테이너 -->
    <div id="leafletMap"></div>
    <div class="map-ft">
      <!-- 선택된 좌표 표시 -->
      <div class="map-coords-box" id="mapCoordsBox">
        <i class="fas fa-map-pin" style="color:#a5d6a7;flex-shrink:0"></i>
        <span id="mapCoordsText">지도를 탭하여 위치를 선택하세요</span>
      </div>
      <div class="map-hint">📍 원하는 위치를 탭하면 마커가 자동으로 설치됩니다</div>
      <!-- 내 위치 + 확인/취소 버튼 -->
      <div class="map-btn-row">
        <button class="map-loc-btn" onclick="goMyLoc()" style="background:linear-gradient(135deg,#0277bd,#0288d1)">
          <i class="fas fa-location-arrow"></i> 내 위치
        </button>
        <button class="btn-s" onclick="closeMap()" style="flex:1">취소</button>
        <button class="btn-p" onclick="confirmLoc()" style="flex:2;padding:9px 0;justify-content:center" id="confirmLocBtn" disabled>
          <i class="fas fa-check"></i> 이 위치 선택
        </button>
      </div>
    </div>
  </div>
</div>

<!-- 상세 모달 -->
<div class="modal-bg" id="detailModal">
  <div class="mbox">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:13px">
      <div class="mttl"><i class="fas fa-leaf"></i> 상세 정보</div>
      <button onclick="closeDetail()" style="background:none;border:none;font-size:20px;color:#aaa;cursor:pointer">✕</button>
    </div>
    <div id="detailCnt"></div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script src="/static/app.js"></script>
</body>
</html>`
}

// ═══════════════════════════════════════════
// ADMIN HTML — 전면 재구현
// ═══════════════════════════════════════════
function adminHTML(): string { return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>생태ON 관리자</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#f0f4f0;margin:0}

/* ── 레이아웃 ── */
.sidebar{width:220px;background:linear-gradient(180deg,#1a3a2a 0%,#1a7a3c 100%);min-height:100vh;position:fixed;left:0;top:0;display:flex;flex-direction:column;z-index:200}
.main{margin-left:220px;min-height:100vh;display:flex;flex-direction:column}
@media(max-width:768px){.sidebar{width:100%;min-height:auto;position:sticky;flex-direction:row;flex-wrap:wrap;padding:8px}.main{margin-left:0}}

/* ── 사이드바 ── */
.sb-logo{padding:20px 16px 14px;border-bottom:1px solid rgba(255,255,255,.12)}
.sb-lm{font-size:22px;font-weight:900;color:#fff;line-height:1}
.sb-lm span{color:#a8e6bc}
.sb-ls{font-size:11px;color:rgba(255,255,255,.6);margin-top:2px}
.sb-badge{font-size:10px;background:rgba(255,255,255,.15);color:rgba(255,255,255,.8);padding:2px 8px;border-radius:12px;display:inline-block;margin-top:5px}
.nav-item{display:flex;align-items:center;gap:10px;padding:11px 16px;color:rgba(255,255,255,.75);cursor:pointer;transition:all .15s;font-size:13px;font-weight:500;border-left:3px solid transparent;text-decoration:none}
.nav-item:hover{background:rgba(255,255,255,.08);color:#fff}
.nav-item.active{background:rgba(255,255,255,.15);color:#fff;border-left-color:#a8e6bc}
.nav-item i{width:18px;text-align:center;font-size:14px}
.nav-section{font-size:10px;color:rgba(255,255,255,.35);padding:12px 16px 4px;font-weight:700;letter-spacing:.5px}
.sb-footer{margin-top:auto;padding:12px 16px;border-top:1px solid rgba(255,255,255,.1)}

/* ── 탑바 ── */
.topbar{background:#fff;border-bottom:1px solid #e0e8e0;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100}
.topbar-title{font-size:16px;font-weight:700;color:#1a3a2a}
.topbar-right{display:flex;align-items:center;gap:10px}
.pending-alert{background:#fff3cd;border:1px solid #ffc107;color:#856404;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;display:none}

/* ── 콘텐츠 ── */
.page-wrap{padding:18px 20px;flex:1}
.section{display:none}.section.active{display:block}

/* ── 카드 ── */
.card{background:#fff;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);border:1px solid #e8f0e8}
.card-ttl{font-size:14px;font-weight:700;color:#1a3a2a;display:flex;align-items:center;gap:7px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #eef4ee}

/* ── 통계 카드 ── */
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:16px}
.stat-c{background:#fff;border-radius:12px;padding:14px;box-shadow:0 2px 7px rgba(0,0,0,.06);border-top:4px solid;text-align:center}
.stat-c.green{border-top-color:#4caf50}
.stat-c.blue{border-top-color:#2196f3}
.stat-c.orange{border-top-color:#ff9800}
.stat-c.red{border-top-color:#f44336}
.stat-c.purple{border-top-color:#9c27b0}
.stat-c.brown{border-top-color:#795548}
.stat-n{font-size:28px;font-weight:800;color:#1a3a2a;margin:4px 0}
.stat-l{font-size:11px;color:#888}

/* ── 테이블 ── */
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#f1f8e9;padding:9px 11px;text-align:left;font-weight:700;color:#2e7d32;border-bottom:2px solid #a5d6a7;white-space:nowrap}
td{padding:9px 11px;border-bottom:1px solid #f0f4f0;vertical-align:middle}
tr:hover td{background:#fafffe}

/* ── 배지 ── */
.badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600}
.b-pending{background:#fff3cd;color:#856404}
.b-approved{background:#e8f5e9;color:#2e7d32}
.b-rejected{background:#fce4ec;color:#c62828}
.b-suspended{background:#f3e5f5;color:#7b1fa2}
.b-admin{background:#e3f2fd;color:#1565c0}
.s-양호{background:#e8f5e9;color:#2e7d32}
.s-보통{background:#fff3e0;color:#e65100}
.s-불량{background:#fce4ec;color:#c62828}
.s-고사{background:#efebe9;color:#3e2723}
.rv-검토중{background:#fff3cd;color:#856404}
.rv-승인{background:#e8f5e9;color:#2e7d32}
.rv-반려{background:#fce4ec;color:#c62828}
.rv-수정요청{background:#e3f2fd;color:#1565c0}

/* ── 버튼 ── */
.btn-p{padding:8px 16px;background:linear-gradient(135deg,#1a7a3c,#2d9e52);color:#fff;border:none;border-radius:9px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px}
.btn-s{padding:7px 13px;background:#f5f5f5;color:#555;border:1.5px solid #ddd;border-radius:8px;font-size:12px;cursor:pointer}
.btn-d{padding:5px 10px;background:#fff;color:#e53935;border:1.5px solid #e53935;border-radius:7px;font-size:11px;cursor:pointer}
.btn-e{padding:5px 10px;background:#fff;color:#1565c0;border:1.5px solid #1565c0;border-radius:7px;font-size:11px;cursor:pointer}
.btn-a{padding:5px 10px;background:#e8f5e9;color:#2e7d32;border:1.5px solid #4caf50;border-radius:7px;font-size:11px;cursor:pointer;font-weight:700}
.btn-r{padding:5px 10px;background:#fce4ec;color:#c62828;border:1.5px solid #ef9a9a;border-radius:7px;font-size:11px;cursor:pointer;font-weight:700}

/* ── 폼 ── */
.fg{margin-bottom:11px}
.fl{font-size:12px;font-weight:600;color:#555;margin-bottom:4px;display:block}
.fi,.fs,.ft{width:100%;padding:8px 10px;border:1.5px solid #ddd;border-radius:8px;font-size:13px;outline:none;background:#fafafa}
.fi:focus,.fs:focus,.ft:focus{border-color:#2d9e52}
.ft{min-height:65px;resize:vertical}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}

/* ── 필터 바 ── */
.filter-bar{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.fi-sm{padding:7px 11px;border:1.5px solid #ddd;border-radius:8px;font-size:12px;min-width:140px}

/* ── 지도 ── */
#adminMap{width:100%;height:420px;border-radius:12px;border:1px solid #ddd;overflow:hidden}
.map-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.map-leg-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#555}
.map-dot{width:12px;height:12px;border-radius:50%;display:inline-block}

/* ── 모달 ── */
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;overflow-y:auto}
.modal-bg.vis{display:flex;align-items:flex-start;justify-content:center;padding:20px}
.mbox{background:#fff;border-radius:18px;padding:22px;width:100%;max-width:560px;margin:auto}
.mttl{font-size:17px;font-weight:700;color:#1a3a2a;margin-bottom:16px}

/* ── 로그인 ── */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#1a3a2a 0%,#1a7a3c 50%,#f0f7f0 100%)}
.login-box{background:#fff;border-radius:20px;padding:32px;width:320px;box-shadow:0 8px 32px rgba(0,0,0,.15)}

/* ── 토스트 ── */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:9px 20px;border-radius:18px;font-size:12px;z-index:99999;display:none;white-space:nowrap}
.toast.show{display:block;animation:fio 2.5s forwards}
@keyframes fio{0%{opacity:0;transform:translateX(-50%) translateY(8px)}15%{opacity:1;transform:translateX(-50%)}75%{opacity:1}100%{opacity:0}}

.check-row{display:flex;align-items:center;gap:8px;padding:5px 0}
.check-row input{width:15px;height:15px;accent-color:#2d9e52}

/* ── 등록유형 버튼 (메인앱) ── */
.reg-btn{padding:9px 0;border-radius:10px;font-size:13px;font-weight:700;border:2px solid #e0e0e0;background:#fafafa;color:#888;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px}
.reg-btn.reg-active{background:#e8f5e9;border-color:#2d9e52;color:#1a7a3c}
</style>
</head>
<body>

<!-- ═══════════ 로그인 ═══════════ -->
<div id="loginWrap" class="login-wrap">
  <div class="login-box">
    <div style="text-align:center;margin-bottom:22px">
      <div style="font-size:28px;font-weight:900;color:#1a7a3c">생태<span style="color:#4caf50">ON</span></div>
      <div style="font-size:13px;color:#888;margin-top:4px">관리자 페이지</div>
    </div>
    <div class="fg"><label class="fl">아이디</label><input class="fi" id="aId" value="admin" onkeydown="if(event.key==='Enter')aLogin()"/></div>
    <div class="fg"><label class="fl">비밀번호</label><input class="fi" type="password" id="aPw" value="admin1234" onkeydown="if(event.key==='Enter')aLogin()"/></div>
    <button class="btn-p" style="width:100%;padding:12px;justify-content:center;font-size:14px" onclick="aLogin()"><i class="fas fa-lock"></i> 로그인</button>
    <div id="aLoginMsg" style="margin-top:9px;font-size:12px;text-align:center;color:#e53935;display:none"></div>
    <div style="text-align:center;margin-top:12px"><a href="/" style="font-size:11px;color:#aaa;text-decoration:none"><i class="fas fa-arrow-left"></i> 앱으로 돌아가기</a></div>
  </div>
</div>

<!-- ═══════════ 관리자 화면 ═══════════ -->
<div id="adminWrap" style="display:none">
  <!-- 사이드바 -->
  <div class="sidebar">
    <div class="sb-logo">
      <div class="sb-lm">생태<span>ON</span></div>
      <div class="sb-ls">제주 생태 모니터링</div>
      <div class="sb-badge">관리자 페이지</div>
    </div>
    <div style="padding:8px 0;flex:1;overflow-y:auto">
      <div class="nav-section">OVERVIEW</div>
      <div class="nav-item active" onclick="goSec('dashboard')" id="nav-dashboard"><i class="fas fa-tachometer-alt"></i> 대시보드</div>
      <div class="nav-section">데이터 관리</div>
      <div class="nav-item" onclick="goSec('records')" id="nav-records"><i class="fas fa-database"></i> 기록 관리</div>
      <div class="nav-item" onclick="goSec('review')" id="nav-review"><i class="fas fa-clipboard-check"></i> 검수 관리 <span id="reviewBadge" style="background:#ff9800;color:#fff;padding:1px 6px;border-radius:10px;font-size:10px;margin-left:auto;display:none">0</span></div>
      <div class="nav-item" onclick="goSec('map')" id="nav-map"><i class="fas fa-map-marked-alt"></i> 지도 시각화</div>
      <div class="nav-item" onclick="goSec('points')" id="nav-points"><i class="fas fa-map-pin"></i> 고정 지점 관리</div>
      <div class="nav-item" onclick="goSec('photos')" id="nav-photos"><i class="fas fa-images"></i> 사진 관리</div>
      <div class="nav-item" onclick="goSec('stats')" id="nav-stats"><i class="fas fa-chart-bar"></i> 통계 분석</div>
      <div class="nav-section">회원 관리</div>
      <div class="nav-item" onclick="goSec('users')" id="nav-users"><i class="fas fa-users"></i> 회원 관리 <span id="pendingBadge" style="background:#ffc107;color:#fff;padding:1px 6px;border-radius:10px;font-size:10px;margin-left:auto;display:none">0</span></div>
      <div class="nav-section">시스템</div>
      <div class="nav-item" onclick="goSec('export')" id="nav-export"><i class="fas fa-download"></i> 데이터 내보내기</div>
    </div>
    <div class="sb-footer">
      <div style="font-size:10px;color:rgba(255,255,255,.4);margin-bottom:6px">© 제주녹색환경지원센터</div>
      <button onclick="aLogout()" style="background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.2);padding:6px 12px;border-radius:7px;font-size:11px;cursor:pointer;width:100%"><i class="fas fa-sign-out-alt"></i> 로그아웃</button>
    </div>
  </div>

  <!-- 메인 -->
  <div class="main">
    <div class="topbar">
      <div class="topbar-title" id="topbarTitle">📊 대시보드</div>
      <div class="topbar-right">
        <div class="pending-alert" id="pendingAlert" onclick="goSec('users')"><i class="fas fa-bell"></i> 승인 대기 회원이 있습니다</div>
        <span id="adminName" style="font-size:12px;color:#555"><i class="fas fa-user-shield" style="color:#2d9e52"></i> 관리자</span>
        <a href="/" style="font-size:11px;color:#888;text-decoration:none;padding:5px 10px;border:1px solid #ddd;border-radius:7px"><i class="fas fa-home"></i> 앱</a>
      </div>
    </div>

    <div class="page-wrap">

      <!-- ── 대시보드 ── -->
      <div class="section active" id="sec-dashboard">
        <div class="stat-grid" id="dashStats">
          <div class="stat-c green"><div class="stat-n" id="ds-total">-</div><div class="stat-l">전체 기록</div></div>
          <div class="stat-c blue"><div class="stat-n" id="ds-users">-</div><div class="stat-l">승인 회원</div></div>
          <div class="stat-c orange"><div class="stat-n" id="ds-pending">-</div><div class="stat-l">승인 대기</div></div>
          <div class="stat-c green"><div class="stat-n" id="ds-good">-</div><div class="stat-l">양호</div></div>
          <div class="stat-c orange"><div class="stat-n" id="ds-normal">-</div><div class="stat-l">보통</div></div>
          <div class="stat-c red"><div class="stat-n" id="ds-bad">-</div><div class="stat-l">불량</div></div>
          <div class="stat-c brown"><div class="stat-n" id="ds-dead">-</div><div class="stat-l">고사</div></div>
          <div class="stat-c purple"><div class="stat-n" id="ds-photos">-</div><div class="stat-l">등록 사진</div></div>
        </div>
        <!-- 검수 현황 요약 -->
        <div class="card">
          <div class="card-ttl"><i class="fas fa-clipboard-check"></i> 검수 현황</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:120px;background:#fff3cd;border-radius:10px;padding:12px;text-align:center;cursor:pointer" onclick="goSec('review')">
              <div style="font-size:26px;font-weight:800;color:#856404" id="rv-pending">-</div>
              <div style="font-size:11px;color:#856404;font-weight:600">검토중</div>
            </div>
            <div style="flex:1;min-width:120px;background:#e8f5e9;border-radius:10px;padding:12px;text-align:center;cursor:pointer" onclick="goSec('review')">
              <div style="font-size:26px;font-weight:800;color:#2e7d32" id="rv-approved">-</div>
              <div style="font-size:11px;color:#2e7d32;font-weight:600">승인</div>
            </div>
            <div style="flex:1;min-width:120px;background:#fce4ec;border-radius:10px;padding:12px;text-align:center;cursor:pointer" onclick="goSec('review')">
              <div style="font-size:26px;font-weight:800;color:#c62828" id="rv-rejected">-</div>
              <div style="font-size:11px;color:#c62828;font-weight:600">반려</div>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="card">
            <div class="card-ttl"><i class="fas fa-chart-line"></i> 최근 30일 기록 추이</div>
            <canvas id="chartDaily" height="200"></canvas>
          </div>
          <div class="card">
            <div class="card-ttl"><i class="fas fa-chart-pie"></i> 상태별 분포</div>
            <canvas id="chartStatus" height="200"></canvas>
          </div>
          <div class="card">
            <div class="card-ttl"><i class="fas fa-chart-bar"></i> 지역별 기록</div>
            <canvas id="chartRegion" height="200"></canvas>
          </div>
          <div class="card">
            <div class="card-ttl"><i class="fas fa-calendar"></i> 월별 기록 추이</div>
            <canvas id="chartMonthly" height="200"></canvas>
          </div>
          <div class="card">
            <div class="card-ttl"><i class="fas fa-tags"></i> 등록유형별 현황</div>
            <canvas id="chartRegType" height="200"></canvas>
          </div>
          <div class="card">
            <div class="card-ttl"><i class="fas fa-check-circle"></i> 검수 상태 분포</div>
            <canvas id="chartReview" height="200"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-ttl"><i class="fas fa-trophy"></i> 활동 회원 TOP 10</div>
          <div id="topUserList"></div>
        </div>
        <div class="card">
          <div class="card-ttl"><i class="fas fa-clock"></i> 최근 등록 기록</div>
          <div id="recentRecords"></div>
        </div>
      </div>

      <!-- ── 기록 관리 ── -->
      <div class="section" id="sec-records">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-database"></i> 모니터링 기록 관리</div>
          <div class="filter-bar">
            <input class="fi-sm" id="rf-kw" placeholder="🔍 종명·장소·이름 검색" oninput="filterRecs()"/>
            <select class="fi-sm" id="rf-st" onchange="filterRecs()" style="min-width:100px"><option value="">전체 상태</option><option>양호</option><option>보통</option><option>불량</option><option>고사</option></select>
            <select class="fi-sm" id="rf-rg" onchange="filterRecs()" style="min-width:110px"><option value="">전체 지역</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select>
            <select class="fi-sm" id="rf-rv" onchange="filterRecs()" style="min-width:100px"><option value="">전체 검수</option><option value="검토중">검토중</option><option value="승인">승인</option><option value="반려">반려</option><option value="수정요청">수정요청</option></select>
            <input type="date" class="fi-sm" id="rf-from" onchange="filterRecs()" style="min-width:130px"/>
            <input type="date" class="fi-sm" id="rf-to" onchange="filterRecs()" style="min-width:130px"/>
            <button class="btn-s" onclick="loadAdminRecs()"><i class="fas fa-sync-alt"></i> 새로고침</button>
          </div>
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>ID</th><th>종명</th><th>장소/지역</th><th>작성자</th><th>상태</th><th>검수</th><th>사진</th><th>조사일</th><th>등록일</th><th>관리</th></tr></thead>
              <tbody id="recTbody"><tr><td colspan="10" style="text-align:center;padding:24px;color:#aaa"><i class="fas fa-spinner fa-spin"></i></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── 검수 관리 ── -->
      <div class="section" id="sec-review">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-clipboard-check"></i> 데이터 검수 관리</div>
          <div class="filter-bar">
            <select class="fi-sm" id="rv-filter" onchange="filterReview()" style="min-width:110px">
              <option value="">전체 상태</option>
              <option value="검토중" selected>검토중</option>
              <option value="승인">승인</option>
              <option value="반려">반려</option>
              <option value="수정요청">수정요청</option>
            </select>
            <select class="fi-sm" id="rv-rg" onchange="filterReview()" style="min-width:110px"><option value="">전체 지역</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select>
            <input class="fi-sm" id="rv-kw" placeholder="🔍 검색" oninput="filterReview()" style="min-width:160px"/>
            <button class="btn-s" onclick="loadAdminRecs()"><i class="fas fa-sync-alt"></i> 새로고침</button>
          </div>
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>ID</th><th>종명</th><th>장소/지역</th><th>작성자</th><th>상태</th><th>검수상태</th><th>조사일</th><th>사진</th><th>검수 처리</th></tr></thead>
              <tbody id="reviewTbody"><tr><td colspan="9" style="text-align:center;padding:24px;color:#aaa"><i class="fas fa-spinner fa-spin"></i></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── 지도 시각화 ── -->
      <div class="section" id="sec-map">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-map-marked-alt"></i> 지도 기반 데이터 시각화</div>
          <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <select class="fi-sm" id="map-st-filter" onchange="renderMap()" style="min-width:110px"><option value="">전체 상태</option><option>양호</option><option>보통</option><option>불량</option><option>고사</option></select>
            <select class="fi-sm" id="map-rg-filter" onchange="renderMap()" style="min-width:120px"><option value="">전체 지역</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select>
            <select class="fi-sm" id="map-rt-filter" onchange="renderMap()" style="min-width:110px"><option value="">전체 유형</option><option value="신규등록">신규등록</option><option value="재점검">재점검</option></select>
            <input type="date" class="fi-sm" id="map-from" onchange="renderMap()" style="min-width:130px"/>
            <input type="date" class="fi-sm" id="map-to" onchange="renderMap()" style="min-width:130px"/>
            <button class="btn-p" onclick="renderMap()"><i class="fas fa-sync-alt"></i> 새로고침</button>
          </div>
          <div id="adminMap" style="height:460px;border-radius:12px;border:1px solid #ddd"></div>
          <div class="map-legend" style="margin-top:10px">
            <div style="font-size:11px;font-weight:700;color:#555;margin-right:6px">상태별:</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#4caf50"></div>양호</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#ff9800"></div>보통</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#f44336"></div>불량</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#795548"></div>고사</div>
            <div style="font-size:11px;font-weight:700;color:#555;margin-left:12px;margin-right:6px">유형별:</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#2196f3;border:2px solid #0d47a1"></div>신규등록</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#9c27b0;border:2px solid #6a1b9a"></div>재점검</div>
          </div>
          <div id="mapInfo" style="margin-top:6px;font-size:12px;color:#888"></div>
        </div>
        <div class="card">
          <div class="card-ttl"><i class="fas fa-list-ul"></i> 좌표 등록 기록 목록</div>
          <div id="mapRecordList"></div>
        </div>
      </div>

      <!-- ── 통계 분석 ── -->
      <div class="section" id="sec-stats">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-filter"></i> 조회 기간 설정</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <input type="date" class="fi-sm" id="st-from" style="min-width:130px"/>
            <span style="font-size:13px;color:#888">~</span>
            <input type="date" class="fi-sm" id="st-to" style="min-width:130px"/>
            <button class="btn-p" onclick="loadStats()"><i class="fas fa-search"></i> 조회</button>
            <button class="btn-s" onclick="clearStatFilter()">전체 기간</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="card">
            <div class="card-ttl"><i class="fas fa-map-pin"></i> 지역별 기록 현황</div>
            <div id="regionStatList"></div>
          </div>
          <div class="card">
            <div class="card-ttl"><i class="fas fa-leaf"></i> 종별 기록 현황 (TOP 10)</div>
            <div id="speciesStatList"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="card">
            <div class="card-ttl"><i class="fas fa-calendar-alt"></i> 월별 기록 추이</div>
            <canvas id="chartStMonth" height="180"></canvas>
          </div>
          <div class="card">
            <div class="card-ttl"><i class="fas fa-calendar-check"></i> 연도별 기록</div>
            <canvas id="chartStYear" height="180"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-ttl"><i class="fas fa-user-chart"></i> 사용자별 활동 현황</div>
          <div id="userStatList"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="card">
            <div class="card-ttl"><i class="fas fa-chart-bar"></i> 상태별 분포</div>
            <canvas id="chartStatStatus" height="180"></canvas>
          </div>
          <div class="card">
            <div class="card-ttl"><i class="fas fa-tags"></i> 등록유형별 현황</div>
            <canvas id="chartStatRegType" height="180"></canvas>
          </div>
        </div>
      </div>

      <!-- ── 회원 관리 ── -->
      <div class="section" id="sec-users">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-users"></i> 회원 관리</div>
          <div class="filter-bar">
            <select class="fi-sm" id="uf-role" onchange="filterUsers()" style="min-width:110px">
              <option value="">전체 상태</option>
              <option value="pending">승인 대기</option>
              <option value="approved">승인 완료</option>
              <option value="rejected">거절</option>
              <option value="suspended">정지</option>
            </select>
            <select class="fi-sm" id="uf-region" onchange="filterUsers()" style="min-width:120px"><option value="">전체 지역</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select>
            <input class="fi-sm" id="uf-kw" placeholder="이름·아이디·기관 검색" oninput="filterUsers()" style="min-width:160px"/>
            <button class="btn-s" onclick="loadUsers()"><i class="fas fa-sync-alt"></i> 새로고침</button>
          </div>
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>ID</th><th>아이디</th><th>이름</th><th>소속</th><th>지역</th><th>상태</th><th>권한</th><th>가입일</th><th>기록수</th><th>관리</th></tr></thead>
              <tbody id="userTbody"><tr><td colspan="10" style="text-align:center;padding:24px;color:#aaa"><i class="fas fa-spinner fa-spin"></i></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── 고정 지점 관리 ── -->
      <div class="section" id="sec-points">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-map-pin"></i> 고정 모니터링 지점 관리
            <button class="btn-p" onclick="openPointModal()" style="margin-left:auto;padding:6px 13px"><i class="fas fa-plus"></i> 지점 추가</button>
          </div>
          <div class="filter-bar">
            <select class="fi-sm" id="pt-filter-rg" onchange="filterPoints()" style="min-width:120px"><option value="">전체 지역</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select>
            <input class="fi-sm" id="pt-filter-kw" placeholder="🔍 지점명 검색" oninput="filterPoints()" style="min-width:160px"/>
            <button class="btn-s" onclick="loadPoints()"><i class="fas fa-sync-alt"></i> 새로고침</button>
          </div>
          <div id="pointMapWrap" style="height:300px;border-radius:12px;border:1px solid #ddd;margin-bottom:14px"></div>
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>ID</th><th>지점명</th><th>지역</th><th>생태계유형</th><th>좌표</th><th>설명</th><th>등록일</th><th>관리</th></tr></thead>
              <tbody id="pointTbody"><tr><td colspan="8" style="text-align:center;padding:24px;color:#aaa"><i class="fas fa-spinner fa-spin"></i></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── 사진 관리 ── -->
      <div class="section" id="sec-photos">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-images"></i> 사진 관리</div>
          <div class="filter-bar">
            <select class="fi-sm" id="ph-rg" onchange="loadPhotos()" style="min-width:120px"><option value="">전체 지역</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select>
            <select class="fi-sm" id="ph-rt" onchange="loadPhotos()" style="min-width:110px"><option value="">전체 유형</option><option value="신규등록">신규등록</option><option value="재점검">재점검</option></select>
            <input type="date" class="fi-sm" id="ph-from" onchange="loadPhotos()" style="min-width:130px"/>
            <input type="date" class="fi-sm" id="ph-to" onchange="loadPhotos()" style="min-width:130px"/>
            <button class="btn-s" onclick="loadPhotos()"><i class="fas fa-sync-alt"></i> 조회</button>
          </div>
          <div id="photoStats" style="margin-bottom:10px;font-size:12px;color:#888"></div>
          <div id="photoGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px"></div>
          <div id="photoLoadMore" style="text-align:center;margin-top:14px;display:none">
            <button class="btn-s" onclick="loadMorePhotos()"><i class="fas fa-plus"></i> 더 보기</button>
          </div>
        </div>
      </div>

      <!-- ── 데이터 내보내기 ── -->
      <div class="section" id="sec-export">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-filter"></i> 필터 설정</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;align-items:end">
            <div>
              <label style="font-size:11px;color:#888;display:block;margin-bottom:4px">시작일</label>
              <input type="date" class="fi-sm" id="exp-from" style="width:100%"/>
            </div>
            <div>
              <label style="font-size:11px;color:#888;display:block;margin-bottom:4px">종료일</label>
              <input type="date" class="fi-sm" id="exp-to" style="width:100%"/>
            </div>
            <div>
              <label style="font-size:11px;color:#888;display:block;margin-bottom:4px">지역</label>
              <select class="fi-sm" id="exp-region" style="width:100%"><option value="">전체 지역</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select>
            </div>
            <div>
              <label style="font-size:11px;color:#888;display:block;margin-bottom:4px">등록유형</label>
              <select class="fi-sm" id="exp-regtype" style="width:100%"><option value="">전체 유형</option><option value="신규등록">신규등록</option><option value="재점검">재점검</option></select>
            </div>
          </div>
          <div style="margin-top:10px">
            <label style="font-size:11px;color:#888;display:block;margin-bottom:4px">검수 상태</label>
            <select class="fi-sm" id="exp-review" style="min-width:140px"><option value="">전체 검수</option><option value="검토중">검토중</option><option value="승인">승인</option><option value="반려">반려</option></select>
          </div>
        </div>
        <div class="card">
          <div class="card-ttl"><i class="fas fa-download"></i> 데이터 일괄 내보내기</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
            <div style="background:#f1f8e9;border-radius:12px;padding:16px;text-align:center">
              <i class="fas fa-file-csv" style="font-size:36px;color:#2d9e52;margin-bottom:10px;display:block"></i>
              <div style="font-size:14px;font-weight:700;color:#1a3a2a;margin-bottom:4px">CSV 내보내기</div>
              <div style="font-size:11px;color:#888;margin-bottom:12px">전체 필드 포함<br>GPS·조사일시·검수상태</div>
              <button class="btn-p" onclick="exportCSV()" style="width:100%;justify-content:center"><i class="fas fa-download"></i> CSV 다운로드</button>
            </div>
            <div style="background:#e3f2fd;border-radius:12px;padding:16px;text-align:center">
              <i class="fas fa-file-excel" style="font-size:36px;color:#1565c0;margin-bottom:10px;display:block"></i>
              <div style="font-size:14px;font-weight:700;color:#1a3a2a;margin-bottom:4px">Excel 내보내기</div>
              <div style="font-size:11px;color:#888;margin-bottom:12px">상세 TSV 형식<br>Excel 직접 열기 지원</div>
              <button class="btn-p" style="width:100%;justify-content:center;background:linear-gradient(135deg,#1565c0,#1e88e5)" onclick="exportExcel()"><i class="fas fa-download"></i> Excel 다운로드</button>
            </div>
            <div style="background:#fce4ec;border-radius:12px;padding:16px;text-align:center">
              <i class="fas fa-users" style="font-size:36px;color:#c62828;margin-bottom:10px;display:block"></i>
              <div style="font-size:14px;font-weight:700;color:#1a3a2a;margin-bottom:4px">회원 목록 내보내기</div>
              <div style="font-size:11px;color:#888;margin-bottom:12px">회원 정보 CSV<br>활동 현황 포함</div>
              <button class="btn-p" style="width:100%;justify-content:center;background:linear-gradient(135deg,#c62828,#e53935)" onclick="exportUsers()"><i class="fas fa-download"></i> 회원 CSV</button>
            </div>
          </div>
          <div style="margin-top:14px" id="exportPreview"></div>
        </div>
      </div>

    </div><!-- page-wrap -->
  </div><!-- main -->
</div><!-- adminWrap -->

<!-- 고정 지점 등록/수정 모달 -->
<div class="modal-bg" id="pointModal">
  <div class="mbox">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="mttl"><i class="fas fa-map-pin"></i> <span id="pointModalTitle">지점 등록</span></div>
      <button onclick="closePointModal()" style="background:none;border:none;font-size:20px;color:#aaa;cursor:pointer">✕</button>
    </div>
    <input type="hidden" id="pt-id"/>
    <div class="fgrid">
      <div class="fg" style="grid-column:1/-1"><label class="fl">지점명 *</label><input class="fi" id="pt-name" placeholder="예) 한라산 진달래밭"/></div>
      <div class="fg"><label class="fl">지역</label><select class="fs" id="pt-region"><option value="">선택</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select></div>
      <div class="fg"><label class="fl">생태계유형</label><select class="fs" id="pt-ecotype"><option value="">선택</option><option>산림</option><option>초지</option><option>습지</option><option>하천</option><option>해안</option><option>농경지</option><option>도심녹지</option></select></div>
      <div class="fg"><label class="fl">위도</label><input class="fi" type="number" id="pt-lat" step="0.000001" placeholder="33.xxxxxx"/></div>
      <div class="fg"><label class="fl">경도</label><input class="fi" type="number" id="pt-lng" step="0.000001" placeholder="126.xxxxxx"/></div>
    </div>
    <div class="fg"><label class="fl">설명</label><textarea class="ft" id="pt-desc" placeholder="해당 지점의 특징 및 설명"></textarea></div>
    <div style="display:flex;gap:9px;margin-top:14px">
      <button class="btn-s" onclick="closePointModal()" style="flex:1">취소</button>
      <button class="btn-p" onclick="savePoint()" style="flex:2;justify-content:center"><i class="fas fa-save"></i> 저장</button>
    </div>
  </div>
</div>

<!-- 검수 처리 모달 -->
<div class="modal-bg" id="reviewModal">
  <div class="mbox" style="max-width:440px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="mttl"><i class="fas fa-clipboard-check"></i> 검수 처리</div>
      <button onclick="closeReviewModal()" style="background:none;border:none;font-size:20px;color:#aaa;cursor:pointer">✕</button>
    </div>
    <div id="reviewTargetInfo" style="background:#f9f9f9;border-radius:8px;padding:10px;margin-bottom:14px;font-size:12px;color:#555"></div>
    <input type="hidden" id="rv-rec-id"/>
    <div class="fg">
      <label class="fl">검수 결과 *</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="rv-btn" id="rvb-검토중" onclick="setReviewStatus('검토중')" style="flex:1;padding:9px;border-radius:9px;border:2px solid #ffc107;background:#fff3cd;color:#856404;font-weight:700;cursor:pointer">🔍 검토중</button>
        <button type="button" class="rv-btn" id="rvb-승인" onclick="setReviewStatus('승인')" style="flex:1;padding:9px;border-radius:9px;border:2px solid #ddd;background:#fafafa;color:#888;font-weight:700;cursor:pointer">✅ 승인</button>
        <button type="button" class="rv-btn" id="rvb-반려" onclick="setReviewStatus('반려')" style="flex:1;padding:9px;border-radius:9px;border:2px solid #ddd;background:#fafafa;color:#888;font-weight:700;cursor:pointer">❌ 반려</button>
        <button type="button" class="rv-btn" id="rvb-수정요청" onclick="setReviewStatus('수정요청')" style="flex:1;padding:9px;border-radius:9px;border:2px solid #ddd;background:#fafafa;color:#888;font-weight:700;cursor:pointer">📝 수정요청</button>
      </div>
      <input type="hidden" id="rv-status" value="검토중"/>
    </div>
    <div class="fg"><label class="fl">검수 메모 <span style="font-size:10px;color:#aaa">(반려/수정요청 시 사유 입력)</span></label><textarea class="ft" id="rv-memo" placeholder="검수 의견을 입력하세요..."></textarea></div>
    <div style="display:flex;gap:9px;margin-top:14px">
      <button class="btn-s" onclick="closeReviewModal()" style="flex:1">취소</button>
      <button class="btn-p" onclick="submitReview()" style="flex:2;justify-content:center"><i class="fas fa-check"></i> 검수 저장</button>
    </div>
  </div>
</div>

<!-- 기록 수정 모달 -->
<div class="modal-bg" id="editModal">
  <div class="mbox">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="mttl"><i class="fas fa-edit"></i> 기록 수정</div>
      <button onclick="closeEdit()" style="background:none;border:none;font-size:20px;color:#aaa;cursor:pointer">✕</button>
    </div>
    <div class="fgrid">
      <div class="fg"><label class="fl">이름 *</label><input class="fi" id="e-nm"/></div>
      <div class="fg"><label class="fl">장소 *</label><input class="fi" id="e-loc"/></div>
      <div class="fg"><label class="fl">종명 *</label><input class="fi" id="e-sp"/></div>
      <div class="fg"><label class="fl">상태</label><select class="fs" id="e-st"><option>양호</option><option>보통</option><option>불량</option><option>고사</option></select></div>
      <div class="fg"><label class="fl">지역</label><select class="fs" id="e-rg"><option value="">선택</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select></div>
      <div class="fg"><label class="fl">수정자</label><input class="fi" id="e-by" placeholder="수정자 이름"/></div>
      <div class="fg"><label class="fl">위도</label><input class="fi" type="number" id="e-lat" step="0.000001"/></div>
      <div class="fg"><label class="fl">경도</label><input class="fi" type="number" id="e-lng" step="0.000001"/></div>
    </div>
    <div class="fg"><label class="fl">특이사항</label><textarea class="ft" id="e-notes"></textarea></div>
    <div style="border-top:1px solid #f0f0f0;padding-top:12px;margin-top:6px">
      <div class="fl" style="font-weight:700;color:#1a7a3c;margin-bottom:10px">📋 재점검 사항</div>
      <!-- 등록유형 -->
      <div class="fg">
        <label class="fl">등록 유형</label>
        <select class="fs" id="e-regtype">
          <option value="신규등록">신규등록</option>
          <option value="재점검">재점검</option>
        </select>
      </div>
      <!-- 재점검 결과 체크박스 -->
      <div class="fg">
        <label class="fl">재점검 결과 <span style="font-size:10px;color:#aaa">(해당 항목 모두 선택)</span></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px">
          ${['제거(교란종 등) 완료','재발생 없음','재발생 확인','확산 확인','개체 수 감소','개체 수 증가','추가 조치 필요','지속 관찰 필요','이전 조사와 동일'].map((lbl,i)=>`
          <div class="check-row"><input type="checkbox" id="e-ri-${i+1}" value="${lbl}"/><label for="e-ri-${i+1}" style="font-size:11px">${lbl}</label></div>`).join('')}
        </div>
      </div>
      <div class="fg"><label class="fl">재점검 메모</label><textarea class="ft" id="e-rimemo" style="min-height:50px"></textarea></div>
    </div>
    <div style="border-top:1px solid #f0f0f0;padding-top:12px;margin-top:6px">
      <div class="fl" style="font-weight:700;color:#1a7a3c;margin-bottom:8px">✅ 생태 체크리스트</div>
      <div class="fgrid">
        <div class="fg"><label class="fl">① 식생 훼손</label><select class="fs" id="e-cl-v"><option>양호</option><option>보통</option><option>미흡</option></select></div>
        <div class="fg"><label class="fl">② 외래종 발생</label><select class="fs" id="e-cl-i"><option>없음</option><option>있음</option></select></div>
        <div class="fg"><label class="fl">③ 환경 관리</label><select class="fs" id="e-cl-e"><option>없음</option><option>있음</option></select></div>
        <div class="fg"><label class="fl">④ 탐방로 상태</label><select class="fs" id="e-cl-t"><option>양호</option><option>정비 필요</option></select></div>
        <div class="fg"><label class="fl">⑤ 사진 기록</label><select class="fs" id="e-cl-p"><option>완료</option><option>미완료</option></select></div>
        <div class="fg"><label class="fl">⑥ 안내시설</label><select class="fs" id="e-cl-g"><option>양호</option><option>보통</option><option>미흡</option></select></div>
      </div>
    </div>
    <div style="display:flex;gap:9px;margin-top:14px">
      <button class="btn-s" onclick="closeEdit()" style="flex:1">취소</button>
      <button class="btn-p" onclick="saveEdit()" style="flex:2;justify-content:center"><i class="fas fa-save"></i> 저장</button>
    </div>
  </div>
</div>

<!-- 회원 상세 모달 -->
<div class="modal-bg" id="userModal">
  <div class="mbox">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div class="mttl"><i class="fas fa-user"></i> 회원 정보</div>
      <button onclick="closeUserModal()" style="background:none;border:none;font-size:20px;color:#aaa;cursor:pointer">✕</button>
    </div>
    <div id="userModalCnt"></div>
  </div>
</div>

<!-- 사진 뷰어 모달 -->
<div class="modal-bg" id="photoViewModal" onclick="if(event.target===this)closePhotoModal()" style="background:rgba(0,0,0,.88)">
  <div style="width:100%;max-width:680px;margin:auto;position:relative">
    <!-- 헤더 -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(255,255,255,.08);border-radius:14px 14px 0 0">
      <div style="color:#fff;font-size:14px;font-weight:700" id="pvTitle">사진 보기</div>
      <div style="display:flex;gap:8px;align-items:center">
        <button onclick="dlCurrentPhoto()" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;padding:5px 12px;border-radius:8px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px">
          <i class="fas fa-download"></i> 현재 사진 저장
        </button>
        <button onclick="dlAllPhotos()" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;padding:5px 12px;border-radius:8px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px">
          <i class="fas fa-images"></i> 전체 저장
        </button>
        <button onclick="closePhotoModal()" style="background:rgba(255,255,255,.15);border:none;color:#fff;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
      </div>
    </div>
    <!-- 사진 영역 -->
    <div style="background:#111;min-height:360px;display:flex;align-items:center;justify-content:center;position:relative">
      <img id="pvImg" src="" alt="사진" style="max-width:100%;max-height:70vh;object-fit:contain;display:block"/>
      <!-- 이전/다음 버튼 -->
      <button id="pvPrev" onclick="pvNav(-1)" style="position:absolute;left:10px;background:rgba(0,0,0,.5);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">&#8249;</button>
      <button id="pvNext" onclick="pvNav(1)"  style="position:absolute;right:10px;background:rgba(0,0,0,.5);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">&#8250;</button>
    </div>
    <!-- 인디케이터 + 썸네일 -->
    <div style="background:rgba(0,0,0,.7);padding:10px 14px;border-radius:0 0 14px 14px">
      <div style="text-align:center;color:rgba(255,255,255,.6);font-size:12px;margin-bottom:8px" id="pvCounter">1 / 1</div>
      <div id="pvThumbs" style="display:flex;gap:7px;justify-content:center;flex-wrap:wrap"></div>
    </div>
  </div>
</div>

<div class="toast" id="atoast"></div>

<script src="/static/admin.js"></script>
</body>
</html>`
}

export default app
