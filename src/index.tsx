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
.app-footer{background:#f8f8f8;border-top:1px solid #e0e0e0;padding:7px 14px;text-align:center;flex-shrink:0}
.footer-txt{font-size:10px;color:#bbb}
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
          <div class="fg"><label class="fl">장소명 <span class="req">*</span></label><input class="fi" id="rLoc" placeholder="조사 장소명" required/></div>
          <div class="fg">
            <label class="fl">지역</label>
            <select class="fs" id="rRegion">
              <option value="">지역 선택</option>
              ${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면','우도면','추자면'].map(r=>`<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
          <div class="fg"><label class="fl">종명 <span class="req">*</span></label><input class="fi" id="rSpecies" placeholder="식물/동물 종명" required/></div>
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
          <div class="fg"><label class="fl">특이사항</label><textarea class="ft" id="rNotes" placeholder="특이사항 입력..."></textarea></div>
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
          <input type="file" id="pinput" accept="image/*" multiple style="display:none" onchange="addPhotos(event)"/>
        </div>

        <div class="card">
          <div class="card-ttl"><i class="fas fa-redo"></i> 재점검 사항</div>
          <div class="ci" onclick="tgl('c-rm')"><div class="cbox" id="c-rm"></div><span style="font-size:12px;color:#444">☑ 제거 완료</span></div>
          <div class="ci" onclick="tgl('c-nr')"><div class="cbox" id="c-nr"></div><span style="font-size:12px;color:#444">☑ 재발생 없음</span></div>
          <div class="ci" onclick="tgl('c-sc')"><div class="cbox" id="c-sc"></div><span style="font-size:12px;color:#444">☑ 확산 확인</span></div>
          <div class="fg" style="margin-top:10px"><label class="fl">재점검 일자</label><input type="date" class="fi" id="riDate"/></div>
          <div class="fg"><label class="fl">재점검 메모</label><textarea class="ft" id="riMemo" style="min-height:55px" placeholder="재점검 내용..."></textarea></div>
        </div>

        <div class="card">
          <div class="card-ttl"><i class="fas fa-clipboard-check"></i> 생태 모니터링 체크리스트</div>
          <div class="cl-row"><div><div class="cl-lbl"><b>① 식생 훼손 여부</b></div><div class="cl-sub">훼손 및 우려지역 존재 여부</div></div><select class="cl-sel" id="cl-v"><option>양호</option><option>보통</option><option>미흡</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>② 외래종 발생</b></div><div class="cl-sub">외래식물·교란종 확인 여부</div></div><select class="cl-sel" id="cl-i"><option>없음</option><option>있음</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>③ 환경 관리</b></div><div class="cl-sub">불법투기 및 폐기물 발생 여부</div></div><select class="cl-sel" id="cl-e"><option>없음</option><option>있음</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>④ 탐방로 상태</b></div><div class="cl-sub">탐방로 침식·파손 여부</div></div><select class="cl-sel" id="cl-t"><option>양호</option><option>정비 필요</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>⑤ 사진 기록</b></div><div class="cl-sub">동일지점 사진 촬영 여부</div></div><select class="cl-sel" id="cl-p"><option>완료</option><option>미완료</option></select></div>
          <div class="cl-row"><div><div class="cl-lbl"><b>⑥ 안내시설</b></div><div class="cl-sub">안내판 및 시설물 상태</div></div><select class="cl-sel" id="cl-g"><option>양호</option><option>보통</option><option>미흡</option></select></div>
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
    <div class="footer-txt">© 제주녹색환경지원센터(제주생태계서비스지원센터)</div>
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

<script>
// ══ 전역 상태 ══
let G = { user:null, photos:[], lat:null, lng:null, pLat:null, pLng:null,
          checks:{rm:false,nr:false,sc:false} }

// ══ 인증 전환 ══
function switchAuth(t){
  document.querySelectorAll('.auth-tab').forEach(x=>x.classList.remove('active'))
  document.querySelectorAll('.auth-panel').forEach(x=>x.classList.remove('active'))
  document.getElementById('atab-'+t).classList.add('active')
  document.getElementById('apanel-'+t).classList.add('active')
  document.getElementById('loginMsg').style.display='none'
  document.getElementById('pendingBox').style.display='none'
  document.getElementById('regMsg').style.display='none'
}

// ══ 지역 선택 ══
function selRegion(r,el){
  document.querySelectorAll('.region-btn').forEach(b=>b.classList.remove('sel'))
  el.classList.add('sel')
  document.getElementById('reg-region').value=r
}

// ══ 로그인 ══
async function doLogin(){
  const id=document.getElementById('login-id').value.trim()
  const pw=document.getElementById('login-pw').value
  if(!id||!pw){showMsg('loginMsg','아이디와 비밀번호를 입력하세요.','#e53935');return}
  document.getElementById('loginBtn').disabled=true
  try{
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:id,password:pw})})
    const d=await r.json()
    if(d.success){
      G.user=d.data
      sessionStorage.setItem('user',JSON.stringify(d.data))
      showApp()
    } else {
      if(d.code==='PENDING'){
        document.getElementById('loginMsg').style.display='none'
        document.getElementById('pendingBox').style.display='block'
      } else {
        showMsg('loginMsg',d.error,'#e53935')
        document.getElementById('pendingBox').style.display='none'
      }
    }
  }catch(e){showMsg('loginMsg','서버 오류가 발생했습니다.','#e53935')}
  finally{document.getElementById('loginBtn').disabled=false}
}

// ══ 회원가입 ══
async function doRegister(){
  const id=document.getElementById('reg-id').value.trim()
  const pw=document.getElementById('reg-pw').value
  const nm=document.getElementById('reg-name').value.trim()
  if(!id||!pw||!nm){showMsg('regMsg','필수 항목을 입력하세요.','#e53935');return}
  if(id.length<4){showMsg('regMsg','아이디는 4자 이상이어야 합니다.','#e53935');return}
  if(pw.length<6){showMsg('regMsg','비밀번호는 6자 이상이어야 합니다.','#e53935');return}
  document.getElementById('regBtn').disabled=true
  try{
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:id,password:pw,full_name:nm,
        email:document.getElementById('reg-email').value||null,
        phone:document.getElementById('reg-phone').value||null,
        organization:document.getElementById('reg-org').value||null,
        region:document.getElementById('reg-region').value||null})})
    const d=await r.json()
    if(d.success){
      showMsg('regMsg','✅ 가입 신청이 완료되었습니다! 관리자 승인 후 로그인하세요.','#2e7d32')
      setTimeout(()=>switchAuth('login'),2000)
    } else {
      showMsg('regMsg',d.error,'#e53935')
    }
  }catch(e){showMsg('regMsg','서버 오류가 발생했습니다.','#e53935')}
  finally{document.getElementById('regBtn').disabled=false}
}

// ══ 로그아웃 ══
function doLogout(){
  G.user=null; sessionStorage.removeItem('user')
  document.getElementById('appWrap').style.display='none'
  document.getElementById('authWrap').style.display='flex'
  document.getElementById('login-id').value=''
  document.getElementById('login-pw').value=''
}

// ══ 앱 표시 ══
function showApp(){
  document.getElementById('authWrap').style.display='none'
  document.getElementById('appWrap').style.display='flex'
  document.getElementById('hdrUserName').textContent=G.user.full_name||G.user.username
  document.getElementById('rName').value=G.user.full_name||''
  loadMyPage()
  renderPhotoGrid()
  selSt('양호')
}

// ══ 사용자 메뉴 ══
function showUserMenu(){
  const u=G.user
  if(!u)return
  if(confirm(\`\${u.full_name}님으로 로그인 중입니다.\\n로그아웃 하시겠습니까?\`)) doLogout()
}

// ══ 탭 ══
function sw(t){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'))
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'))
  document.getElementById('tab-'+t).classList.add('active')
  document.getElementById('panel-'+t).classList.add('active')
  if(t==='list') loadRec()
}

// ══ 상태 ══
const stMap={'양호':'ag','보통':'an','불량':'ab','고사':'ad'}
function selSt(s){
  document.querySelectorAll('.sbtn').forEach(b=>b.className='sbtn')
  document.getElementById('sb-'+s).classList.add(stMap[s])
  document.getElementById('rStatus').value=s
}

// ══ 체크 ══
const ckMap={rm:'c-rm',nr:'c-nr',sc:'c-sc'}
function tgl(id){
  const key=Object.keys(ckMap).find(k=>ckMap[k]===id)
  G.checks[key]=!G.checks[key]
  const el=document.getElementById(id)
  G.checks[key]?el.classList.add('ck'):el.classList.remove('ck')
}

// ══ 사진 ══
function renderPhotoGrid(){
  const g=document.getElementById('pgrid'); g.innerHTML=''
  G.photos.forEach((p,i)=>{
    const s=document.createElement('div'); s.className='pslot hp'
    s.innerHTML=\`<img src="\${p.data}"/><div class="pdel" onclick="delPhoto(\${i})"><i class="fas fa-times"></i></div>\`
    g.appendChild(s)
  })
  if(G.photos.length<10){
    const a=document.createElement('div'); a.className='pslot'
    a.innerHTML='<i class="fas fa-plus" style="color:#bbb;font-size:18px"></i>'
    a.onclick=()=>document.getElementById('pinput').click()
    g.appendChild(a)
  }
  document.getElementById('pcnt').textContent=G.photos.length
}
function addPhotos(e){
  const files=Array.from(e.target.files), rem=10-G.photos.length, add=files.slice(0,rem)
  if(files.length>rem) toast('사진은 최대 10장까지 등록 가능합니다.')
  let done=0
  add.forEach(f=>{const r=new FileReader();r.onload=ev=>{G.photos.push({data:ev.target.result,name:f.name});done++;if(done===add.length)renderPhotoGrid()};r.readAsDataURL(f)})
  e.target.value=''
}
function delPhoto(i){G.photos.splice(i,1);renderPhotoGrid()}

// ══ 지도 (Leaflet.js) ══
let _map = null       // Leaflet 인스턴스
let _marker = null    // 선택 마커
let _myCircle = null  // 내 위치 파란 원
let _myDot = null     // 내 위치 중심점

function _updateCoordsUI(la, lg){
  document.getElementById('mapCoordsText').textContent =
    \`📍 위도: \${la.toFixed(6)}, 경도: \${lg.toFixed(6)}\`
  document.getElementById('mapCoordsBox').style.background='#e8f5e9'
  document.getElementById('mapCoordsBox').style.borderColor='#4caf50'
  document.getElementById('confirmLocBtn').disabled=false
  G.pLat=la; G.pLng=lg
}

function openMap(){
  document.getElementById('mapModal').classList.add('vis')
  document.getElementById('confirmLocBtn').disabled=true
  G.pLat=null; G.pLng=null

  // 좌표 표시 초기화
  document.getElementById('mapCoordsText').textContent='지도를 탭하여 위치를 선택하세요'
  document.getElementById('mapCoordsBox').style.background=''
  document.getElementById('mapCoordsBox').style.borderColor=''

  // 이미 기록된 위치가 있으면 해당 좌표, 없으면 제주도 중심
  const initLat = G.lat||33.4800
  const initLng = G.lng||126.5312

  // 지도가 이미 초기화됐으면 invalidateSize만 호출
  if(_map){
    _map.setView([initLat, initLng], G.lat?14:11)
    // 기존 선택 마커 복원
    if(G.lat){
      if(_marker) _map.removeLayer(_marker)
      _marker = L.marker([G.lat, G.lng], {icon: _pinIcon()}).addTo(_map)
      _updateCoordsUI(G.lat, G.lng)
    }
    setTimeout(()=>_map.invalidateSize(), 200)
    return
  }

  // 최초 초기화
  setTimeout(()=>{
    _map = L.map('leafletMap', {
      center:[initLat, initLng],
      zoom: G.lat?14:11,
      zoomControl:true,
      attributionControl:true
    })

    // OpenStreetMap 타일
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom:19
    }).addTo(_map)

    // 기존 위치가 있으면 마커 표시
    if(G.lat){
      _marker = L.marker([G.lat, G.lng], {icon: _pinIcon()}).addTo(_map)
      _updateCoordsUI(G.lat, G.lng)
    }

    // 지도 클릭 → 마커 설치 + 좌표 자동 입력
    _map.on('click', (e)=>{
      const la=e.latlng.lat, lg=e.latlng.lng
      if(_marker) _map.removeLayer(_marker)
      _marker = L.marker([la,lg], {icon: _pinIcon()}).addTo(_map)
      _updateCoordsUI(la, lg)
    })

    // 내 위치 실시간 표시
    _showMyLocation()

    // 크기 보정
    setTimeout(()=>_map.invalidateSize(), 250)
  }, 80)
}

// 커스텀 핀 아이콘 (초록색)
function _pinIcon(){
  return L.divIcon({
    className:'',
    html:\`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z"
        fill="#1a7a3c" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>\`,
    iconSize:[28,36], iconAnchor:[14,36], popupAnchor:[0,-36]
  })
}

// 내 위치 파란 점 표시
function _showMyLocation(){
  if(!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      const la=pos.coords.latitude, lg=pos.coords.longitude
      const acc=pos.coords.accuracy
      // 기존 내 위치 레이어 제거
      if(_myCircle){ _map.removeLayer(_myCircle); _myCircle=null }
      if(_myDot){ _map.removeLayer(_myDot); _myDot=null }
      // 정확도 원
      _myCircle = L.circle([la,lg],{
        radius:acc, color:'#2196F3', fillColor:'#2196F3',
        fillOpacity:.1, weight:1
      }).addTo(_map)
      // 파란 점
      _myDot = L.circleMarker([la,lg],{
        radius:9, color:'#fff', fillColor:'#2196F3',
        fillOpacity:1, weight:2.5
      }).addTo(_map).bindPopup('내 현재 위치')
    },
    ()=>{ /* 위치 거부 시 무시 */ },
    {enableHighAccuracy:true, timeout:8000, maximumAge:0}
  )
}

// "내 위치" 버튼
function goMyLoc(){
  if(!_map){toast('지도가 아직 로드되지 않았습니다.');return}
  if(!navigator.geolocation){toast('이 기기에서 위치 정보를 사용할 수 없습니다.');return}
  toast('📡 위치를 가져오는 중...')
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      const la=pos.coords.latitude, lg=pos.coords.longitude
      _map.setView([la,lg],16)
      // 내 위치 레이어 갱신
      if(_myCircle){ _map.removeLayer(_myCircle); _myCircle=null }
      if(_myDot){ _map.removeLayer(_myDot); _myDot=null }
      _myCircle = L.circle([la,lg],{
        radius:pos.coords.accuracy, color:'#2196F3', fillColor:'#2196F3',
        fillOpacity:.1, weight:1
      }).addTo(_map)
      _myDot = L.circleMarker([la,lg],{
        radius:9, color:'#fff', fillColor:'#2196F3',
        fillOpacity:1, weight:2.5
      }).addTo(_map).bindPopup('내 현재 위치').openPopup()
    },
    (err)=>{
      const msgs={1:'위치 권한이 거부되었습니다.',2:'위치를 확인할 수 없습니다.',3:'위치 요청 시간이 초과되었습니다.'}
      toast(msgs[err.code]||'위치를 가져올 수 없습니다.')
    },
    {enableHighAccuracy:true, timeout:10000, maximumAge:0}
  )
}

function confirmLoc(){
  if(G.pLat==null){toast('지도를 탭하여 위치를 먼저 선택하세요.');return}
  G.lat=G.pLat; G.lng=G.pLng
  document.getElementById('rLat').value=G.lat
  document.getElementById('rLng').value=G.lng
  const d=document.getElementById('locDisp'); d.classList.add('vis')
  document.getElementById('locTxt').textContent='위치 선택 완료'
  document.getElementById('coordTxt').textContent=\`위도: \${G.lat.toFixed(6)}, 경도: \${G.lng.toFixed(6)}\`
  closeMap(); toast('✅ 위치가 선택되었습니다.')
}

function closeMap(){
  document.getElementById('mapModal').classList.remove('vis')
}

// ══ 폼 제출 ══
async function submitForm(e){
  e.preventDefault()
  const btn=document.getElementById('subBtn'); btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> 저장 중...'
  try{
    const payload={
      user_id: G.user?.id||null,
      reporter_name:document.getElementById('rName').value,
      location_name:document.getElementById('rLoc').value,
      region:document.getElementById('rRegion').value||null,
      species_name:document.getElementById('rSpecies').value,
      condition_status:document.getElementById('rStatus').value,
      latitude:G.lat, longitude:G.lng,
      special_notes:document.getElementById('rNotes').value,
      photos:G.photos,
      reinspection:{removal_done:G.checks.rm,no_recurrence:G.checks.nr,spread_check:G.checks.sc,
        reinspection_memo:document.getElementById('riMemo').value,
        reinspection_date:document.getElementById('riDate').value},
      checklist:{vegetation_damage:document.getElementById('cl-v').value,
        invasive_species:document.getElementById('cl-i').value,
        environment_mgmt:document.getElementById('cl-e').value,
        trail_condition:document.getElementById('cl-t').value,
        photo_record:document.getElementById('cl-p').value,
        guide_facility:document.getElementById('cl-g').value}
    }
    const r=await fetch('/api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    const d=await r.json()
    if(d.success){ toast('✅ 기록이 저장되었습니다!'); resetForm(); setTimeout(()=>sw('list'),1500) }
    else toast('❌ '+( d.error||'저장 실패'))
  }catch(ex){toast('❌ 네트워크 오류')}
  finally{btn.disabled=false;btn.innerHTML='<i class="fas fa-paper-plane"></i> 기록 제출'}
}
function resetForm(){
  document.getElementById('mForm').reset()
  G.photos=[]; G.lat=null; G.lng=null; G.checks={rm:false,nr:false,sc:false}
  renderPhotoGrid(); selSt('양호')
  document.getElementById('locDisp').classList.remove('vis')
  document.querySelectorAll('.cbox').forEach(b=>b.classList.remove('ck'))
  document.getElementById('rName').value=G.user?.full_name||''
}

// ══ 목록 ══
async function loadRec(){
  const el=document.getElementById('recList'); el.innerHTML='<div class="spin"><i class="fas fa-spinner fa-spin"></i></div>'
  try{
    const url=G.user?.is_admin?'/api/records':\`/api/records?user_id=\${G.user?.id}\`
    const r=await fetch(url); const d=await r.json()
    if(!d.success||!d.data.length){
      document.getElementById('rTotal').textContent='0'
      el.innerHTML='<div class="empty"><i class="fas fa-leaf"></i><p>기록이 없습니다.</p></div>'
      return
    }
    document.getElementById('rTotal').textContent=d.total||d.data.length
    el.innerHTML=d.data.map(recCard).join('')
  }catch(ex){el.innerHTML='<div class="empty"><i class="fas fa-exclamation-circle"></i><p>로드 실패</p></div>'}
}
function recCard(r){
  const dt=new Date(r.created_at).toLocaleDateString('ko-KR')
  const coord=r.latitude?\`\${parseFloat(r.latitude).toFixed(4)}, \${parseFloat(r.longitude).toFixed(4)}\`:'미등록'
  return \`<div class="rc">
    <div class="rc-head"><div class="rc-sp"><i class="fas fa-leaf" style="color:#2d9e52;margin-right:4px"></i>\${r.species_name}</div><div class="rc-dt">\${dt}</div></div>
    <div class="rc-info">
      <div class="rc-ii"><i class="fas fa-user"></i>\${r.reporter_name}</div>
      <div class="rc-ii"><i class="fas fa-map-marker-alt"></i>\${r.location_name}</div>
      <div class="rc-ii" style="grid-column:1/-1"><i class="fas fa-map-pin"></i>\${coord}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="badge s-\${r.condition_status}">\${r.condition_status}</span>
      <span style="font-size:10px;color:#bbb">사진 \${r.photo_count||0}장</span>
      <button class="btn-o" onclick="viewDetail(\${r.id})"><i class="fas fa-eye"></i> 상세</button>
    </div>
  </div>\`
}

// ══ 상세 ══
async function viewDetail(id){
  try{
    const r=await fetch(\`/api/records/\${id}\`); const d=await r.json()
    if(!d.success){toast('로드 실패');return}
    const rec=d.data
    const dt=new Date(rec.created_at).toLocaleString('ko-KR')
    let photos=''
    if(rec.photos?.length){photos=\`<div style="display:flex;gap:5px;overflow-x:auto;padding:6px 0">\${rec.photos.map(p=>\`<img src="\${p.photo_data}" style="width:65px;height:65px;border-radius:7px;object-fit:cover;flex-shrink:0"/>\`).join('')}</div>\`}
    let ri=''
    if(rec.reinspection){const ri2=rec.reinspection;ri=\`<div style="border-top:1px solid #f0f0f0;padding-top:10px;margin-top:8px"><div style="font-size:12px;font-weight:700;color:#1a7a3c;margin-bottom:6px">📋 재점검 사항</div><div style="font-size:11px;color:#555;line-height:2">\${ri2.removal_done?'✅':'⬜'} 제거완료 &nbsp;\${ri2.no_recurrence?'✅':'⬜'} 재발생없음 &nbsp;\${ri2.spread_check?'✅':'⬜'} 확산확인\${ri2.reinspection_date?'<br>재점검: '+ri2.reinspection_date:''}\${ri2.reinspection_memo?'<br>메모: '+ri2.reinspection_memo:''}</div></div>\`}
    let cl=''
    if(rec.checklist){const c=rec.checklist;cl=\`<div style="border-top:1px solid #f0f0f0;padding-top:10px;margin-top:8px"><div style="font-size:12px;font-weight:700;color:#1a7a3c;margin-bottom:6px">✅ 생태 체크리스트</div>\${[['식생 훼손',c.vegetation_damage],['외래종 발생',c.invasive_species],['환경 관리',c.environment_mgmt],['탐방로 상태',c.trail_condition],['사진 기록',c.photo_record],['안내시설',c.guide_facility]].map(([k,v])=>\`<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #f5f5f5"><span style="color:#888">\${k}</span><span style="font-weight:600">\${v}</span></div>\`).join('')}</div>\`}
    document.getElementById('detailCnt').innerHTML=\`
      <div class="drow"><span class="dk">종명</span><span class="dv" style="color:#1a7a3c;font-size:15px;font-weight:700">\${rec.species_name}</span></div>
      <div class="drow"><span class="dk">작성자</span><span class="dv">\${rec.reporter_name}</span></div>
      <div class="drow"><span class="dk">장소</span><span class="dv">\${rec.location_name}\${rec.region?' ('+rec.region+')':''}</span></div>
      <div class="drow"><span class="dk">상태</span><span class="dv"><span class="badge s-\${rec.condition_status}">\${rec.condition_status}</span></span></div>
      <div class="drow"><span class="dk">좌표</span><span class="dv">\${rec.latitude?'위도 '+parseFloat(rec.latitude).toFixed(6)+', 경도 '+parseFloat(rec.longitude).toFixed(6):'미등록'}</span></div>
      <div class="drow"><span class="dk">특이사항</span><span class="dv">\${rec.special_notes||'없음'}</span></div>
      <div class="drow"><span class="dk">등록일시</span><span class="dv">\${dt}</span></div>
      \${photos}\${ri}\${cl}
    \`
    document.getElementById('detailModal').classList.add('vis')
  }catch(ex){toast('오류가 발생했습니다.')}
}
function closeDetail(){document.getElementById('detailModal').classList.remove('vis')}

// ══ 내정보 ══
async function loadMyPage(){
  if(!G.user)return
  const u=G.user
  document.getElementById('myInfo').innerHTML=\`
    <div class="drow"><span class="dk">이름</span><span class="dv" style="font-weight:700">\${u.full_name||'-'}</span></div>
    <div class="drow"><span class="dk">아이디</span><span class="dv">\${u.username}</span></div>
    <div class="drow"><span class="dk">담당지역</span><span class="dv">\${u.region||'미지정'}</span></div>
    <div class="drow"><span class="dk">권한</span><span class="dv">\${u.is_admin?'<span class="badge" style="background:#e3f2fd;color:#1565c0">관리자</span>':'<span class="badge s-양호">일반회원</span>'}</span></div>
    \${u.is_admin?'<div style="margin-top:12px"><a href="/admin" style="display:block;padding:10px;background:#1a7a3c;color:#fff;border-radius:10px;text-align:center;font-size:13px;font-weight:700;text-decoration:none"><i class="fas fa-cog"></i> 관리자 페이지 이동</a></div>':''}
  \`
  try{
    const r=await fetch(\`/api/records?user_id=\${u.id}\`); const d=await r.json()
    const recs=d.data||[]
    const stats={total:recs.length,good:recs.filter(x=>x.condition_status==='양호').length,bad:recs.filter(x=>x.condition_status==='불량').length}
    document.getElementById('myStats').innerHTML=\`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        <div style="background:#f1f8e9;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:800;color:#1a7a3c">\${stats.total}</div><div style="font-size:11px;color:#888;margin-top:2px">전체 기록</div></div>
        <div style="background:#e8f5e9;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:800;color:#2e7d32">\${stats.good}</div><div style="font-size:11px;color:#888;margin-top:2px">양호</div></div>
        <div style="background:#fce4ec;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:800;color:#c62828">\${stats.bad}</div><div style="font-size:11px;color:#888;margin-top:2px">불량</div></div>
      </div>
    \`
  }catch(ex){}
}

// ══ 유틸 ══
function showMsg(id,msg,color){const el=document.getElementById(id);el.textContent=msg;el.style.color=color;el.style.display='block'}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show';setTimeout(()=>{t.className='toast'},2500)}

// ══ 초기화 ══
const saved=sessionStorage.getItem('user')
if(saved){ try{G.user=JSON.parse(saved);showApp()}catch(e){} }
else{ document.getElementById('authWrap').style.display='flex' }
</script>
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
      <div class="nav-item" onclick="goSec('map')" id="nav-map"><i class="fas fa-map-marked-alt"></i> 지도 시각화</div>
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
            <input type="date" class="fi-sm" id="rf-from" onchange="filterRecs()" style="min-width:130px"/>
            <input type="date" class="fi-sm" id="rf-to" onchange="filterRecs()" style="min-width:130px"/>
            <button class="btn-s" onclick="loadAdminRecs()"><i class="fas fa-sync-alt"></i> 새로고침</button>
          </div>
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>ID</th><th>종명</th><th>장소/지역</th><th>작성자</th><th>상태</th><th>좌표</th><th>사진</th><th>등록일</th><th>관리</th></tr></thead>
              <tbody id="recTbody"><tr><td colspan="9" style="text-align:center;padding:24px;color:#aaa"><i class="fas fa-spinner fa-spin"></i></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── 지도 시각화 ── -->
      <div class="section" id="sec-map">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-map-marked-alt"></i> 지도 기반 데이터 시각화</div>
          <div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">
            <select class="fi-sm" id="map-st-filter" onchange="renderMap()" style="min-width:110px"><option value="">전체 상태</option><option>양호</option><option>보통</option><option>불량</option><option>고사</option></select>
            <select class="fi-sm" id="map-rg-filter" onchange="renderMap()" style="min-width:120px"><option value="">전체 지역</option>${['제주시','서귀포시','애월읍','한림읍','조천읍','구좌읍','성산읍','표선면','남원읍','안덕면','대정읍','한경면'].map(r=>`<option>${r}</option>`).join('')}</select>
            <button class="btn-p" onclick="renderMap()"><i class="fas fa-map-marker-alt"></i> 지도 새로고침</button>
          </div>
          <div id="adminMap"></div>
          <div class="map-legend">
            <div class="map-leg-item"><div class="map-dot" style="background:#4caf50"></div>양호</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#ff9800"></div>보통</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#f44336"></div>불량</div>
            <div class="map-leg-item"><div class="map-dot" style="background:#795548"></div>고사</div>
          </div>
          <div id="mapInfo" style="margin-top:10px;font-size:12px;color:#888"></div>
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
            <div class="card-ttl"><i class="fas fa-leaf"></i> 종별 기록 현황</div>
            <div id="speciesStatList"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-ttl"><i class="fas fa-user-chart"></i> 사용자별 활동 현황</div>
          <div id="userStatList"></div>
        </div>
        <div class="card">
          <div class="card-ttl"><i class="fas fa-chart-bar"></i> 상태별 분포 (기간 내)</div>
          <canvas id="chartStatStatus" height="120"></canvas>
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

      <!-- ── 데이터 내보내기 ── -->
      <div class="section" id="sec-export">
        <div class="card">
          <div class="card-ttl"><i class="fas fa-download"></i> 데이터 일괄 내보내기</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
            <div style="background:#f1f8e9;border-radius:12px;padding:16px;text-align:center">
              <i class="fas fa-file-csv" style="font-size:36px;color:#2d9e52;margin-bottom:10px;display:block"></i>
              <div style="font-size:14px;font-weight:700;color:#1a3a2a;margin-bottom:4px">CSV 내보내기</div>
              <div style="font-size:11px;color:#888;margin-bottom:12px">Excel 호환 CSV 형식<br>모든 필드 포함</div>
              <button class="btn-p" onclick="exportCSV()" style="width:100%;justify-content:center"><i class="fas fa-download"></i> CSV 다운로드</button>
            </div>
            <div style="background:#e3f2fd;border-radius:12px;padding:16px;text-align:center">
              <i class="fas fa-file-excel" style="font-size:36px;color:#1565c0;margin-bottom:10px;display:block"></i>
              <div style="font-size:14px;font-weight:700;color:#1a3a2a;margin-bottom:4px">Excel 내보내기</div>
              <div style="font-size:11px;color:#888;margin-bottom:12px">TSV 형식 (Excel 직접 열기)<br>한글 인코딩 최적화</div>
              <button class="btn-p" style="width:100%;justify-content:center;background:linear-gradient(135deg,#1565c0,#1e88e5)" onclick="exportExcel()"><i class="fas fa-download"></i> Excel 다운로드</button>
            </div>
            <div style="background:#fce4ec;border-radius:12px;padding:16px;text-align:center">
              <i class="fas fa-users" style="font-size:36px;color:#c62828;margin-bottom:10px;display:block"></i>
              <div style="font-size:14px;font-weight:700;color:#1a3a2a;margin-bottom:4px">회원 목록 내보내기</div>
              <div style="font-size:11px;color:#888;margin-bottom:12px">회원 정보 CSV<br>활동 현황 포함</div>
              <button class="btn-p" style="width:100%;justify-content:center;background:linear-gradient(135deg,#c62828,#e53935)" onclick="exportUsers()"><i class="fas fa-download"></i> 회원 CSV</button>
            </div>
          </div>
          <div style="margin-top:14px;padding:14px;background:#f9f9f9;border-radius:10px">
            <div style="font-size:13px;font-weight:700;color:#555;margin-bottom:8px"><i class="fas fa-filter"></i> 기간 필터 적용</div>
            <div style="display:flex;gap:10px;align-items:center">
              <input type="date" class="fi-sm" id="exp-from" style="min-width:130px"/>
              <span style="color:#888">~</span>
              <input type="date" class="fi-sm" id="exp-to" style="min-width:130px"/>
              <span style="font-size:11px;color:#aaa">※ 비워두면 전체 기간</span>
            </div>
          </div>
          <div style="margin-top:14px" id="exportPreview"></div>
        </div>
      </div>

    </div><!-- page-wrap -->
  </div><!-- main -->
</div><!-- adminWrap -->

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
      <div class="fl" style="font-weight:700;color:#1a7a3c;margin-bottom:8px">📋 재점검 사항</div>
      <div class="check-row"><input type="checkbox" id="e-rm"/><label for="e-rm" style="font-size:12px">제거 완료</label></div>
      <div class="check-row"><input type="checkbox" id="e-nr"/><label for="e-nr" style="font-size:12px">재발생 없음</label></div>
      <div class="check-row"><input type="checkbox" id="e-sc"/><label for="e-sc" style="font-size:12px">확산 확인</label></div>
      <div class="fgrid" style="margin-top:8px">
        <div class="fg"><label class="fl">재점검 일자</label><input type="date" class="fi" id="e-ridate"/></div>
        <div class="fg"><label class="fl">재점검 메모</label><textarea class="ft" id="e-rimemo" style="min-height:50px"></textarea></div>
      </div>
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

<div class="toast" id="atoast"></div>

<script>
// ══ 전역 ══
let aUser=null, allRecs=[], allUsers=[], statsData=null, mapMarkers=[]
let editId=null, charts={}, mapIframe=null

// ══ 관리자 로그인 ══
async function aLogin(){
  const id=document.getElementById('aId').value, pw=document.getElementById('aPw').value
  try{
    const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:id,password:pw})})
    const d=await r.json()
    if(d.success){
      aUser=d.data; sessionStorage.setItem('aUser',JSON.stringify(d.data))
      showAdmin(); loadAll()
    } else {
      document.getElementById('aLoginMsg').textContent=d.error
      document.getElementById('aLoginMsg').style.display='block'
    }
  }catch(e){document.getElementById('aLoginMsg').textContent='서버 오류';document.getElementById('aLoginMsg').style.display='block'}
}
function aLogout(){aUser=null;sessionStorage.removeItem('aUser');document.getElementById('adminWrap').style.display='none';document.getElementById('loginWrap').style.display='flex'}
function showAdmin(){document.getElementById('loginWrap').style.display='none';document.getElementById('adminWrap').style.display='block';if(aUser)document.getElementById('adminName').innerHTML=\`<i class="fas fa-user-shield" style="color:#2d9e52"></i> \${aUser.full_name||'관리자'}\`}

// ══ 네비게이션 ══
const secTitles={dashboard:'📊 대시보드',records:'🗃️ 기록 관리',map:'🗺️ 지도 시각화',stats:'📈 통계 분석',users:'👥 회원 관리',export:'📥 데이터 내보내기'}
function goSec(s){
  document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'))
  document.getElementById('sec-'+s).classList.add('active')
  document.getElementById('nav-'+s).classList.add('active')
  document.getElementById('topbarTitle').textContent=secTitles[s]
  if(s==='map') setTimeout(renderMap,100)
  if(s==='stats') loadStats()
  if(s==='users') loadUsers()
}

// ══ 전체 로드 ══
async function loadAll(){
  await Promise.all([loadDashboard(), loadAdminRecs(), loadUsers()])
}

// ══ 대시보드 ══
async function loadDashboard(){
  try{
    const r=await fetch('/api/admin/stats'); const d=await r.json()
    if(!d.success)return
    statsData=d.data
    const s=d.data.summary, u=d.data.userStats
    document.getElementById('ds-total').textContent=s?.total_records||0
    document.getElementById('ds-users').textContent=u?.approved||0
    document.getElementById('ds-pending').textContent=u?.pending||0
    document.getElementById('ds-good').textContent=s?.good||0
    document.getElementById('ds-normal').textContent=s?.normal||0
    document.getElementById('ds-bad').textContent=s?.bad||0
    document.getElementById('ds-dead').textContent=s?.dead||0
    document.getElementById('ds-photos').textContent=d.data.photoStats?.total||0

    // 승인 대기 알림
    const pc=u?.pending||0
    if(pc>0){
      document.getElementById('pendingAlert').style.display='flex'
      document.getElementById('pendingBadge').textContent=pc
      document.getElementById('pendingBadge').style.display='inline-block'
    }

    buildCharts(d.data)
    buildTopUsers(d.data.byUser||[])
    buildRecentRecords()
  }catch(e){}
}

function buildCharts(data){
  // 일별 추이
  const dly=document.getElementById('chartDaily')?.getContext('2d')
  if(dly){
    if(charts.daily)charts.daily.destroy()
    const labels=(data.byDate||[]).map(x=>x.date?.slice(5))
    const vals=(data.byDate||[]).map(x=>x.count)
    charts.daily=new Chart(dly,{type:'line',data:{labels,datasets:[{label:'기록수',data:vals,borderColor:'#2d9e52',backgroundColor:'rgba(45,158,82,.1)',fill:true,tension:.4,pointRadius:3}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})
  }
  // 상태별
  const st=document.getElementById('chartStatus')?.getContext('2d')
  if(st){
    if(charts.status)charts.status.destroy()
    const s=data.summary||{}
    charts.status=new Chart(st,{type:'doughnut',data:{labels:['양호','보통','불량','고사'],datasets:[{data:[s.good||0,s.normal||0,s.bad||0,s.dead||0],backgroundColor:['#4caf50','#ff9800','#f44336','#795548']}]},options:{responsive:true,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}})
  }
  // 지역별
  const rg=document.getElementById('chartRegion')?.getContext('2d')
  if(rg){
    if(charts.region)charts.region.destroy()
    const rd=(data.byRegion||[]).slice(0,8)
    charts.region=new Chart(rg,{type:'bar',data:{labels:rd.map(x=>x.region),datasets:[{label:'기록수',data:rd.map(x=>x.count),backgroundColor:'rgba(45,158,82,.7)',borderRadius:5}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})
  }
  // 월별
  const mn=document.getElementById('chartMonthly')?.getContext('2d')
  if(mn){
    if(charts.monthly)charts.monthly.destroy()
    const md=(data.byMonth||[]).slice(0,12).reverse()
    charts.monthly=new Chart(mn,{type:'bar',data:{labels:md.map(x=>x.month),datasets:[{label:'기록수',data:md.map(x=>x.count),backgroundColor:'rgba(33,150,243,.6)',borderRadius:5}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})
  }
}

function buildTopUsers(users){
  const el=document.getElementById('topUserList')
  if(!users.length){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">데이터가 없습니다.</div>';return}
  el.innerHTML=\`<table><thead><tr><th>순위</th><th>이름</th><th>소속</th><th>기록수</th></tr></thead><tbody>\${users.map((u,i)=>\`<tr><td>\${i+1}</td><td>\${u.full_name||u.reporter_name||'-'}</td><td>\${u.organization||'-'}</td><td><span class="badge b-approved">\${u.count}건</span></td></tr>\`).join('')}</tbody></table>\`
}

async function buildRecentRecords(){
  try{
    const r=await fetch('/api/records?limit=5'); const d=await r.json()
    const el=document.getElementById('recentRecords')
    if(!d.success||!d.data.length){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">최근 기록이 없습니다.</div>';return}
    el.innerHTML=\`<table><thead><tr><th>종명</th><th>장소</th><th>작성자</th><th>상태</th><th>등록일</th></tr></thead><tbody>\${d.data.slice(0,5).map(x=>\`<tr><td style="font-weight:600;color:#1a7a3c">\${x.species_name}</td><td>\${x.location_name}</td><td>\${x.reporter_name}</td><td><span class="badge s-\${x.condition_status}">\${x.condition_status}</span></td><td style="font-size:11px;color:#aaa">\${new Date(x.created_at).toLocaleDateString('ko-KR')}</td></tr>\`).join('')}</tbody></table>\`
  }catch(e){}
}

// ══ 기록 관리 ══
async function loadAdminRecs(){
  try{
    const r=await fetch('/api/records'); const d=await r.json()
    allRecs=d.data||[]; filterRecs()
  }catch(e){}
}
function filterRecs(){
  const kw=(document.getElementById('rf-kw')?.value||'').toLowerCase()
  const st=document.getElementById('rf-st')?.value||''
  const rg=document.getElementById('rf-rg')?.value||''
  const fr=document.getElementById('rf-from')?.value||''
  const to=document.getElementById('rf-to')?.value||''
  const f=allRecs.filter(r=>{
    if(kw&&!r.species_name?.toLowerCase().includes(kw)&&!r.location_name?.toLowerCase().includes(kw)&&!r.reporter_name?.toLowerCase().includes(kw)) return false
    if(st&&r.condition_status!==st) return false
    if(rg&&r.region!==rg) return false
    if(fr&&r.created_at<fr) return false
    if(to&&r.created_at.slice(0,10)>to) return false
    return true
  })
  renderRecTable(f)
}
function renderRecTable(recs){
  const tb=document.getElementById('recTbody')
  if(!recs.length){tb.innerHTML='<tr><td colspan="9" style="text-align:center;padding:24px;color:#aaa">기록이 없습니다.</td></tr>';return}
  tb.innerHTML=recs.map(r=>{
    const dt=new Date(r.created_at).toLocaleDateString('ko-KR')
    const coord=r.latitude?\`\${parseFloat(r.latitude).toFixed(4)},\${parseFloat(r.longitude).toFixed(4)}\`:'없음'
    return\`<tr>
      <td style="color:#bbb;font-size:11px">#\${r.id}</td>
      <td style="font-weight:600;color:#1a7a3c">\${r.species_name}</td>
      <td>\${r.location_name}<br><span style="font-size:10px;color:#aaa">\${r.region||''}</span></td>
      <td>\${r.reporter_name}</td>
      <td><span class="badge s-\${r.condition_status}">\${r.condition_status}</span></td>
      <td style="font-size:10px;color:#888">\${coord}</td>
      <td style="text-align:center">\${r.photo_count||0}</td>
      <td style="font-size:11px;color:#aaa">\${dt}</td>
      <td><div style="display:flex;gap:4px">
        <button class="btn-e" onclick="openEdit(\${r.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-d" onclick="delRec(\${r.id})"><i class="fas fa-trash"></i></button>
      </div></td>
    </tr>\`
  }).join('')
}

// ══ 지도 ══
function renderMap(){
  const stF=document.getElementById('map-st-filter')?.value||''
  const rgF=document.getElementById('map-rg-filter')?.value||''
  const mapData=(statsData?.mapData||allRecs.filter(r=>r.latitude)).filter(r=>{
    if(stF&&r.condition_status!==stF) return false
    if(rgF&&r.region!==rgF) return false
    return true
  })
  const mapDiv=document.getElementById('adminMap')
  if(!mapDiv)return

  const colors={양호:'#4caf50',보통:'#ff9800',불량:'#f44336',고사:'#795548'}
  const markers=mapData.filter(r=>r.latitude&&r.longitude).map(r=>\`
    <div style="position:absolute;transform:translate(-50%,-50%);cursor:pointer;z-index:10"
      data-lat="\${r.latitude}" data-lng="\${r.longitude}"
      title="\${r.species_name} - \${r.condition_status}\\n\${r.location_name}\\n작성자: \${r.reporter_name}"
      onclick="showMapInfo(\${r.id})">
      <div style="width:14px;height:14px;border-radius:50%;background:\${colors[r.condition_status]||'#888'};border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,.4)"></div>
    </div>
  \`).join('')

  const center_lat=33.4800, center_lng=126.5312
  mapDiv.innerHTML=\`
    <iframe 
      src="https://maps.google.com/maps?q=\${center_lat},\${center_lng}&z=10&output=embed&hl=ko"
      style="width:100%;height:420px;border:none;border-radius:12px"
      allowfullscreen>
    </iframe>
  \`
  document.getElementById('mapInfo').textContent=\`총 \${mapData.length}건의 좌표 데이터가 있습니다. (Google Maps에 핀 표시 기능은 API Key 필요)\`

  // 좌표 목록 표시
  const listEl=document.getElementById('mapRecordList')
  if(listEl){
    if(!mapData.length){listEl.innerHTML='<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">좌표가 등록된 기록이 없습니다.</div>';return}
    listEl.innerHTML=\`<table><thead><tr><th>종명</th><th>장소/지역</th><th>상태</th><th>위도</th><th>경도</th><th>작성자</th><th>등록일</th></tr></thead><tbody>\${mapData.map(r=>\`<tr>
      <td style="font-weight:600;color:#1a7a3c">\${r.species_name}</td>
      <td>\${r.location_name}<br><span style="font-size:10px;color:#aaa">\${r.region||''}</span></td>
      <td><span class="badge s-\${r.condition_status}">\${r.condition_status}</span></td>
      <td style="font-size:11px">\${parseFloat(r.latitude).toFixed(6)}</td>
      <td style="font-size:11px">\${parseFloat(r.longitude).toFixed(6)}</td>
      <td>\${r.reporter_name}</td>
      <td style="font-size:11px;color:#aaa">\${new Date(r.created_at).toLocaleDateString('ko-KR')}</td>
    </tr>\`).join('')}</tbody></table>\`
  }
}

// ══ 통계 분석 ══
async function loadStats(){
  const from=document.getElementById('st-from')?.value||''
  const to=document.getElementById('st-to')?.value||''
  let url='/api/admin/stats'
  const p=[]
  if(from) p.push('from='+from)
  if(to) p.push('to='+to)
  if(p.length) url+='?'+p.join('&')
  try{
    const r=await fetch(url); const d=await r.json()
    if(!d.success)return
    const data=d.data

    // 지역별
    const rgEl=document.getElementById('regionStatList')
    if(rgEl){
      const total=(data.byRegion||[]).reduce((a,x)=>a+x.count,0)||1
      rgEl.innerHTML=(data.byRegion||[]).length?
        (data.byRegion||[]).map(x=>\`
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span style="font-weight:600">\${x.region}</span><span style="color:#888">\${x.count}건</span>
            </div>
            <div style="background:#f0f0f0;border-radius:10px;height:8px;overflow:hidden">
              <div style="width:\${Math.round(x.count/total*100)}%;background:linear-gradient(90deg,#1a7a3c,#2d9e52);height:100%;border-radius:10px;transition:width .3s"></div>
            </div>
          </div>
        \`).join(''):
        '<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">데이터 없음</div>'
    }

    // 종별
    const spEl=document.getElementById('speciesStatList')
    if(spEl){
      spEl.innerHTML=(data.bySpecies||[]).length?
        \`<table><thead><tr><th>종명</th><th>전체</th><th>양호</th><th>불량</th></tr></thead><tbody>\${(data.bySpecies||[]).map(x=>\`<tr><td style="font-weight:600;color:#1a7a3c">\${x.species_name}</td><td>\${x.count}</td><td style="color:#2e7d32">\${x.good}</td><td style="color:#c62828">\${x.bad}</td></tr>\`).join('')}</tbody></table>\`:
        '<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">데이터 없음</div>'
    }

    // 사용자별
    const usEl=document.getElementById('userStatList')
    if(usEl){
      usEl.innerHTML=(data.byUser||[]).length?
        \`<table><thead><tr><th>이름</th><th>소속</th><th>기록수</th></tr></thead><tbody>\${(data.byUser||[]).map(x=>\`<tr><td>\${x.full_name||x.reporter_name||'-'}</td><td>\${x.organization||'-'}</td><td><span class="badge b-approved">\${x.count}건</span></td></tr>\`).join('')}</tbody></table>\`:
        '<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">데이터 없음</div>'
    }

    // 차트
    const statCtx=document.getElementById('chartStatStatus')?.getContext('2d')
    if(statCtx){
      if(charts.statStatus)charts.statStatus.destroy()
      const s=data.summary||{}
      charts.statStatus=new Chart(statCtx,{type:'bar',data:{labels:['양호','보통','불량','고사'],datasets:[{label:'기록수',data:[s.good||0,s.normal||0,s.bad||0,s.dead||0],backgroundColor:['#4caf50','#ff9800','#f44336','#795548'],borderRadius:6}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})
    }
  }catch(e){}
}
function clearStatFilter(){
  document.getElementById('st-from').value=''
  document.getElementById('st-to').value=''
  loadStats()
}

// ══ 회원 관리 ══
async function loadUsers(){
  try{
    const r=await fetch('/api/admin/users'); const d=await r.json()
    allUsers=d.data||[]; filterUsers()
  }catch(e){}
}
function filterUsers(){
  const role=document.getElementById('uf-role')?.value||''
  const region=document.getElementById('uf-region')?.value||''
  const kw=(document.getElementById('uf-kw')?.value||'').toLowerCase()
  const f=allUsers.filter(u=>{
    if(role&&u.role!==role) return false
    if(region&&u.region!==region) return false
    if(kw&&!u.username?.toLowerCase().includes(kw)&&!u.full_name?.toLowerCase().includes(kw)&&!u.organization?.toLowerCase().includes(kw)) return false
    return true
  })
  renderUserTable(f)
}
function renderUserTable(users){
  const tb=document.getElementById('userTbody')
  if(!users.length){tb.innerHTML='<tr><td colspan="10" style="text-align:center;padding:24px;color:#aaa">회원이 없습니다.</td></tr>';return}
  tb.innerHTML=users.map(u=>{
    const dt=new Date(u.created_at).toLocaleDateString('ko-KR')
    const badge={pending:'b-pending',approved:'b-approved',rejected:'b-rejected',suspended:'b-suspended'}
    const label={pending:'대기',approved:'승인',rejected:'거절',suspended:'정지'}
    return\`<tr>
      <td style="color:#bbb;font-size:11px">#\${u.id}</td>
      <td style="font-weight:600">\${u.username}</td>
      <td>\${u.full_name}</td>
      <td style="font-size:12px">\${u.organization||'-'}</td>
      <td style="font-size:12px">\${u.region||'-'}</td>
      <td><span class="badge \${badge[u.role]||''}">\${label[u.role]||u.role}</span></td>
      <td>\${u.is_admin?'<span class="badge b-admin">관리자</span>':'<span style="font-size:11px;color:#aaa">일반</span>'}</td>
      <td style="font-size:11px;color:#aaa">\${dt}</td>
      <td style="text-align:center">\${u.record_count||0}</td>
      <td><div style="display:flex;gap:3px;flex-wrap:wrap">
        \${u.role==='pending'?\`<button class="btn-a" onclick="approveUser(\${u.id})">✅승인</button><button class="btn-r" onclick="rejectUser(\${u.id})">❌거절</button>\`:''}
        \${u.role==='approved'&&!u.is_admin?\`<button class="btn-d" onclick="suspendUser(\${u.id},true)" style="padding:4px 8px">⛔정지</button>\`:''}
        \${u.role==='suspended'?\`<button class="btn-a" onclick="suspendUser(\${u.id},false)">🔓복구</button>\`:''}
        <button class="btn-e" onclick="toggleAdmin(\${u.id},\${u.is_admin})">🔑</button>
      </div></td>
    </tr>\`
  }).join('')
}

async function approveUser(id){
  if(!confirm('이 회원을 승인하시겠습니까?'))return
  const r=await fetch(\`/api/admin/users/\${id}/approve\`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({approved_by:aUser?.username||'admin'})})
  const d=await r.json()
  if(d.success){toast('✅ 승인되었습니다.');loadUsers();loadDashboard()} else toast('❌ '+d.error)
}
async function rejectUser(id){
  const reason=prompt('거절 사유를 입력하세요 (선택사항):')
  if(reason===null)return
  const r=await fetch(\`/api/admin/users/\${id}/reject\`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})})
  const d=await r.json()
  if(d.success){toast('✅ 거절처리 되었습니다.');loadUsers();loadDashboard()} else toast('❌ '+d.error)
}
async function suspendUser(id,suspend){
  if(!confirm(suspend?'이 회원을 정지시키겠습니까?':'이 회원의 정지를 해제하겠습니까?'))return
  const r=await fetch(\`/api/admin/users/\${id}/suspend\`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({suspend})})
  const d=await r.json()
  if(d.success){toast(suspend?'⛔ 정지되었습니다.':'🔓 정지 해제되었습니다.');loadUsers()} else toast('❌ '+d.error)
}
async function toggleAdmin(id,cur){
  const msg=cur?'관리자 권한을 제거하시겠습니까?':'관리자 권한을 부여하시겠습니까?'
  if(!confirm(msg))return
  const r=await fetch(\`/api/admin/users/\${id}/role\`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_admin:!cur})})
  const d=await r.json()
  if(d.success){toast('✅ 권한이 변경되었습니다.');loadUsers()} else toast('❌ '+d.error)
}
function closeUserModal(){document.getElementById('userModal').classList.remove('vis')}

// ══ 기록 수정 ══
async function openEdit(id){
  editId=id
  try{
    const r=await fetch(\`/api/records/\${id}\`); const d=await r.json()
    if(!d.success){toast('로드 실패');return}
    const rec=d.data
    document.getElementById('e-nm').value=rec.reporter_name||''
    document.getElementById('e-loc').value=rec.location_name||''
    document.getElementById('e-sp').value=rec.species_name||''
    document.getElementById('e-st').value=rec.condition_status||'양호'
    document.getElementById('e-rg').value=rec.region||''
    document.getElementById('e-lat').value=rec.latitude||''
    document.getElementById('e-lng').value=rec.longitude||''
    document.getElementById('e-notes').value=rec.special_notes||''
    document.getElementById('e-by').value=''
    if(rec.reinspection){
      document.getElementById('e-rm').checked=!!rec.reinspection.removal_done
      document.getElementById('e-nr').checked=!!rec.reinspection.no_recurrence
      document.getElementById('e-sc').checked=!!rec.reinspection.spread_check
      document.getElementById('e-ridate').value=rec.reinspection.reinspection_date||''
      document.getElementById('e-rimemo').value=rec.reinspection.reinspection_memo||''
    }
    if(rec.checklist){
      document.getElementById('e-cl-v').value=rec.checklist.vegetation_damage||'양호'
      document.getElementById('e-cl-i').value=rec.checklist.invasive_species||'없음'
      document.getElementById('e-cl-e').value=rec.checklist.environment_mgmt||'없음'
      document.getElementById('e-cl-t').value=rec.checklist.trail_condition||'양호'
      document.getElementById('e-cl-p').value=rec.checklist.photo_record||'완료'
      document.getElementById('e-cl-g').value=rec.checklist.guide_facility||'양호'
    }
    document.getElementById('editModal').classList.add('vis')
  }catch(e){toast('오류 발생')}
}
function closeEdit(){document.getElementById('editModal').classList.remove('vis');editId=null}
async function saveEdit(){
  if(!editId)return
  const payload={
    reporter_name:document.getElementById('e-nm').value,
    location_name:document.getElementById('e-loc').value,
    species_name:document.getElementById('e-sp').value,
    condition_status:document.getElementById('e-st').value,
    region:document.getElementById('e-rg').value||null,
    latitude:parseFloat(document.getElementById('e-lat').value)||null,
    longitude:parseFloat(document.getElementById('e-lng').value)||null,
    special_notes:document.getElementById('e-notes').value,
    updated_by:document.getElementById('e-by').value||aUser?.full_name||'관리자',
    reinspection:{removal_done:document.getElementById('e-rm').checked,no_recurrence:document.getElementById('e-nr').checked,spread_check:document.getElementById('e-sc').checked,reinspection_date:document.getElementById('e-ridate').value,reinspection_memo:document.getElementById('e-rimemo').value},
    checklist:{vegetation_damage:document.getElementById('e-cl-v').value,invasive_species:document.getElementById('e-cl-i').value,environment_mgmt:document.getElementById('e-cl-e').value,trail_condition:document.getElementById('e-cl-t').value,photo_record:document.getElementById('e-cl-p').value,guide_facility:document.getElementById('e-cl-g').value}
  }
  const r=await fetch(\`/api/records/\${editId}\`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  const d=await r.json()
  if(d.success){toast('✅ 수정 완료');closeEdit();loadAdminRecs();loadDashboard()} else toast('❌ '+d.error)
}

async function delRec(id){
  if(!confirm(\`기록 #\${id}를 삭제하시겠습니까?\`))return
  const r=await fetch(\`/api/records/\${id}\`,{method:'DELETE'})
  const d=await r.json()
  if(d.success){toast('✅ 삭제 완료');loadAdminRecs();loadDashboard()} else toast('❌ '+d.error)
}

// ══ 내보내기 ══
async function getExportData(){
  const from=document.getElementById('exp-from')?.value||''
  const to=document.getElementById('exp-to')?.value||''
  let url='/api/admin/export'
  const p=[]
  if(from) p.push('from='+from)
  if(to) p.push('to='+to)
  if(p.length) url+='?'+p.join('&')
  const r=await fetch(url); const d=await r.json()
  return d.success?d.data:[]
}

async function exportCSV(){
  const data=await getExportData()
  if(!data.length){toast('내보낼 데이터가 없습니다.');return}
  const hdrs=['ID','종명','장소','지역','작성자','회원명','소속','상태','위도','경도','특이사항','제거완료','재발생없음','확산확인','재점검일자','재점검메모','식생훼손','외래종','환경관리','탐방로','사진기록','안내시설','등록일시','수정일시','수정자','사진수']
  const rows=data.map(r=>[r.id,r.species_name,r.location_name,r.region||'',r.reporter_name,r.member_name||'',r.organization||'',r.condition_status,r.latitude||'',r.longitude||'',(r.special_notes||'').replace(/,/g,'；'),r.removal_done?'완료':'',r.no_recurrence?'없음':'',r.spread_check?'확인':'',r.reinspection_date||'',r.reinspection_memo||'',r.vegetation_damage||'',r.invasive_species||'',r.environment_mgmt||'',r.trail_condition||'',r.photo_record||'',r.guide_facility||'',r.created_at,r.updated_at||'',r.updated_by||'',r.photo_count||0])
  const csv='\\uFEFF'+[hdrs,...rows].map(r=>r.join(',')).join('\\n')
  dl(csv,'text/csv;charset=utf-8','생태ON_기록_'+now()+'.csv')
  toast('✅ CSV 다운로드 완료 ('+data.length+'건)')
}

async function exportExcel(){
  const data=await getExportData()
  if(!data.length){toast('내보낼 데이터가 없습니다.');return}
  const hdrs=['ID\\t종명\\t장소\\t지역\\t작성자\\t상태\\t위도\\t경도\\t특이사항\\t등록일시']
  const rows=data.map(r=>[r.id,r.species_name,r.location_name,r.region||'',r.reporter_name,r.condition_status,r.latitude||'',r.longitude||'',r.special_notes||'',r.created_at].join('\\t'))
  const tsv=[hdrs[0],...rows].join('\\n')
  dl('\\uFEFF'+tsv,'text/tab-separated-values;charset=utf-8','생태ON_기록_'+now()+'.tsv')
  toast('✅ Excel 파일 다운로드 완료')
}

async function exportUsers(){
  try{
    const r=await fetch('/api/admin/users'); const d=await r.json()
    if(!d.success){toast('❌ 실패');return}
    const hdrs=['ID','아이디','이름','소속','지역','상태','권한','이메일','연락처','가입일','마지막로그인','기록수']
    const rows=d.data.map(u=>[u.id,u.username,u.full_name,u.organization||'',u.region||'',u.role,u.is_admin?'관리자':'일반',u.email||'',u.phone||'',u.created_at,u.last_login||'',u.record_count||0])
    const csv='\\uFEFF'+[hdrs,...rows].map(r=>r.join(',')).join('\\n')
    dl(csv,'text/csv;charset=utf-8','생태ON_회원_'+now()+'.csv')
    toast('✅ 회원 CSV 다운로드 완료')
  }catch(e){toast('❌ 오류 발생')}
}

function dl(content,type,name){
  const blob=new Blob([content],{type});const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)
}
function now(){return new Date().toISOString().slice(0,10)}

// ══ 토스트 ══
function toast(msg){const t=document.getElementById('atoast');t.textContent=msg;t.className='toast show';setTimeout(()=>{t.className='toast'},2500)}

// ══ 초기화 ══
const saved=sessionStorage.getItem('aUser')
if(saved){try{aUser=JSON.parse(saved);showAdmin();loadAll()}catch(e){}}
</script>
</body>
</html>`
}

export default app
