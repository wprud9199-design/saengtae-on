// ══ 전역 상태 ══
let G = { user:null, photos:[], lat:null, lng:null, pLat:null, pLng:null,
          checks:{rm:false,nr:false,sc:false},
          regType:'신규등록',
          riChecks: Array(9).fill(false) }

// ══ 아이디/비밀번호 저장 체크박스 ══
function tglSave(){
  const box=document.getElementById('save-cbox')
  const isSaved=box.classList.contains('ck')
  if(isSaved){
    box.classList.remove('ck')
    localStorage.removeItem('savedId')
    localStorage.removeItem('savedPw')
    localStorage.removeItem('saveLogin')
  } else {
    box.classList.add('ck')
    localStorage.setItem('saveLogin','1')
  }
}

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
      // 아이디/비밀번호 저장 체크 시 localStorage에 보관
      if(localStorage.getItem('saveLogin')==='1'){
        localStorage.setItem('savedId', id)
        localStorage.setItem('savedPw', pw)
      }
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
  if(confirm(`${u.full_name}님으로 로그인 중입니다.\\n로그아웃 하시겠습니까?`)) doLogout()
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

// ══ 등록유형 토글 ══
const RI_KEYS = ['ri-1','ri-2','ri-3','ri-4','ri-5','ri-6','ri-7','ri-8','ri-9']
const RI_LABELS = ['제거(교란종 등) 완료','재발생 없음','재발생 확인','확산 확인','개체 수 감소','개체 수 증가','추가 조치 필요','지속 관찰 필요','이전 조사와 동일']

function setRegType(type){
  G.regType = type
  document.getElementById('rRegType').value = type
  const isRe = type === '재점검'
  document.getElementById('riSection').style.display = isRe ? 'block' : 'none'
  document.getElementById('regBtn-new').className = 'reg-btn' + (isRe ? '' : ' reg-active')
  document.getElementById('regBtn-re').className  = 'reg-btn' + (isRe ? ' reg-active' : '')
}

// ══ 체크 ══
function tgl(id){
  const el=document.getElementById(id)
  if(!el)return
  const isOn = el.classList.toggle('ck')
  // ri-* 키는 G.riChecks 배열, 기존 cbox는 G.checks
  if(id.startsWith('ri-')){
    const idx = parseInt(id.split('-')[1]) - 1
    G.riChecks[idx] = isOn
  } else {
    // 혹시 남아있는 다른 cbox 처리
  }
}

// ══ 사진 ══
function renderPhotoGrid(){
  const g=document.getElementById('pgrid'); g.innerHTML=''
  G.photos.forEach((p,i)=>{
    const s=document.createElement('div'); s.className='pslot hp'
    s.innerHTML=`<img src="${p.data}"/><div class="pdel" onclick="delPhoto(${i})"><i class="fas fa-times"></i></div>`
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
  if(add.length===0) return
  toast('📷 사진 처리 중...')
  let done=0
  add.forEach(f=>{
    // HEIC/HEIF(아이폰 기본 포맷) 포함 모든 이미지 처리
    const reader=new FileReader()
    reader.onerror=()=>{ done++; if(done===add.length) renderPhotoGrid() }
    reader.onload=ev=>{
      const img=new Image()
      img.onerror=()=>{
        // 이미지 로드 실패 시 (HEIC 등) 원본 base64로 저장 시도
        G.photos.push({data:ev.target.result, name:f.name})
        done++
        if(done===add.length){ renderPhotoGrid(); toast('✅ 사진 '+add.length+'장 등록 완료') }
      }
      img.onload=()=>{
        // Canvas로 리사이즈 + 압축
        // 최대 1600px / 품질 0.85 → 고화질 유지하면서 D1 저장 가능한 크기
        const MAX=1600, QUALITY=0.85
        const canvas=document.createElement('canvas')
        let w=img.width, h=img.height
        // EXIF 회전 보정을 위해 가로/세로 판단
        if(w>h){ if(w>MAX){h=Math.round(h*MAX/w);w=MAX} }
        else{ if(h>MAX){w=Math.round(w*MAX/h);h=MAX} }
        canvas.width=w; canvas.height=h
        const ctx=canvas.getContext('2d')
        ctx.drawImage(img,0,0,w,h)
        const compressed=canvas.toDataURL('image/jpeg', QUALITY)
        // 압축 후에도 너무 크면 품질 낮춰서 재압축 (D1 행 제한 대비)
        const final = compressed.length > 800000
          ? canvas.toDataURL('image/jpeg', 0.65)
          : compressed
        G.photos.push({data:final, name:f.name})
        done++
        if(done===add.length){ renderPhotoGrid(); toast('✅ 사진 '+add.length+'장 등록 완료') }
      }
      img.src=ev.target.result
    }
    reader.readAsDataURL(f)
  })
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
    `📍 위도: ${la.toFixed(6)}, 경도: ${lg.toFixed(6)}`
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
    html:`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z"
        fill="#1a7a3c" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>`,
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
  document.getElementById('coordTxt').textContent=`위도: ${G.lat.toFixed(6)}, 경도: ${G.lng.toFixed(6)}`
  closeMap(); toast('✅ 위치가 선택되었습니다.')
}

function closeMap(){
  document.getElementById('mapModal').classList.remove('vis')
}

// ══ 폼 제출 ══
async function submitForm(e){
  e.preventDefault()

  // ── 사진 필수 검사 ──
  if(G.photos.length===0){
    toast('📷 사진을 1장 이상 등록해주세요.')
    document.getElementById('pgrid').scrollIntoView({behavior:'smooth',block:'center'})
    return
  }

  // ── 지역 필수 검사 ──
  const region = document.getElementById('rRegion').value
  if(!region){
    toast('📍 지역을 선택해주세요.')
    document.getElementById('rRegion').focus()
    document.getElementById('rRegion').scrollIntoView({behavior:'smooth',block:'center'})
    return
  }

  // ── 특이사항 필수 검사 ──
  const notes = document.getElementById('rNotes').value.trim()
  if(!notes){
    toast('📝 특이사항을 입력해주세요.')
    document.getElementById('rNotes').focus()
    document.getElementById('rNotes').scrollIntoView({behavior:'smooth',block:'center'})
    return
  }

  // ── 조사일자 필수 검사 ──
  const surveyDate = document.getElementById('rSurveyDate').value
  if(!surveyDate){
    toast('📅 조사일자를 선택해주세요.')
    document.getElementById('rSurveyDate').focus()
    document.getElementById('rSurveyDate').scrollIntoView({behavior:'smooth',block:'center'})
    return
  }

  // ── 조사시각 필수 검사 ──
  const surveyTime = document.getElementById('rSurveyTime').value
  if(!surveyTime){
    toast('🕐 조사시각을 선택해주세요.')
    document.getElementById('rSurveyTime').focus()
    document.getElementById('rSurveyTime').scrollIntoView({behavior:'smooth',block:'center'})
    return
  }

  // ── 날씨 필수 검사 ──
  const weather = document.getElementById('rWeather').value
  if(!weather){
    toast('🌤️ 날씨를 선택해주세요.')
    document.getElementById('rWeather').focus()
    document.getElementById('rWeather').scrollIntoView({behavior:'smooth',block:'center'})
    return
  }

  // ── 생태계 유형 필수 검사 ──
  const ecoType = document.getElementById('rEcoType').value
  if(!ecoType){
    toast('🌿 생태계 유형을 선택해주세요.')
    document.getElementById('rEcoType').focus()
    document.getElementById('rEcoType').scrollIntoView({behavior:'smooth',block:'center'})
    return
  }

  // ── 체크리스트 전체 선택 검사 ──
  const clIds = ['cl-v','cl-i','cl-e','cl-t','cl-p','cl-g']
  const clNames = ['① 식생 훼손 여부','② 외래종 발생','③ 환경 관리','④ 탐방로 상태','⑤ 사진 기록','⑥ 안내시설']
  for(let i=0; i<clIds.length; i++){
    if(!document.getElementById(clIds[i]).value){
      toast(`✅ 체크리스트 "${clNames[i]}"을 선택해주세요.`)
      document.getElementById(clIds[i]).focus()
      document.getElementById(clIds[i]).scrollIntoView({behavior:'smooth',block:'center'})
      return
    }
  }

  const btn=document.getElementById('subBtn'); btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> 저장 중...'

  // ── 등록유형 및 재점검 필수 검사 ──
  const regType = document.getElementById('rRegType').value || '신규등록'
  if(regType === '재점검'){
    const anyChecked = G.riChecks.some(v=>v)
    if(!anyChecked){
      toast('📋 재점검 결과를 1개 이상 선택해주세요.')
      document.getElementById('riSection').scrollIntoView({behavior:'smooth',block:'center'})
      btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> 기록 제출'
      return
    }
    const riMemo = document.getElementById('riMemo').value.trim()
    if(!riMemo){
      toast('📝 재점검 메모를 입력해주세요.')
      document.getElementById('riMemo').focus()
      document.getElementById('riMemo').scrollIntoView({behavior:'smooth',block:'center'})
      btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> 기록 제출'
      return
    }
  }

  try{
    const riResults = RI_LABELS.filter((_,i)=>G.riChecks[i])
    const payload={
      user_id: G.user?.id||null,
      reporter_name:document.getElementById('rName').value,
      location_name:document.getElementById('rLoc').value,
      region:document.getElementById('rRegion').value||null,
      species_name:document.getElementById('rSpecies').value,
      condition_status:document.getElementById('rStatus').value,
      latitude:G.lat, longitude:G.lng,
      special_notes:document.getElementById('rNotes').value,
      survey_date: surveyDate,
      survey_time: surveyTime,
      weather: weather,
      eco_type: ecoType,
      photos:G.photos,
      reinspection:{
        registration_type: regType,
        results: riResults,
        reinspection_memo: regType==='재점검' ? document.getElementById('riMemo').value : ''
      },
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
  G.regType='신규등록'; G.riChecks=Array(9).fill(false)
  renderPhotoGrid(); selSt('양호')
  document.getElementById('locDisp').classList.remove('vis')
  document.querySelectorAll('.cbox').forEach(b=>b.classList.remove('ck'))
  document.getElementById('rName').value=G.user?.full_name||''
  document.getElementById('rSurveyDate').value=''
  document.getElementById('rSurveyTime').value=''
  document.getElementById('rWeather').value=''
  document.getElementById('rEcoType').value=''
  // 등록유형 초기화
  setRegType('신규등록')
}

// ══ 목록 ══
async function loadRec(){
  const el=document.getElementById('recList'); el.innerHTML='<div class="spin"><i class="fas fa-spinner fa-spin"></i></div>'
  try{
    const url=G.user?.is_admin?'/api/records':`/api/records?user_id=${G.user?.id}`
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
  const coord=r.latitude?`${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`:'미등록'
  return `<div class="rc">
    <div class="rc-head"><div class="rc-sp"><i class="fas fa-leaf" style="color:#2d9e52;margin-right:4px"></i>${r.species_name}</div><div class="rc-dt">${dt}</div></div>
    <div class="rc-info">
      <div class="rc-ii"><i class="fas fa-user"></i>${r.reporter_name}</div>
      <div class="rc-ii"><i class="fas fa-map-marker-alt"></i>${r.location_name}</div>
      <div class="rc-ii" style="grid-column:1/-1"><i class="fas fa-map-pin"></i>${coord}</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="badge s-${r.condition_status}">${r.condition_status}</span>
      <span style="font-size:10px;color:#bbb">사진 ${r.photo_count||0}장</span>
      <button class="btn-o" onclick="viewDetail(${r.id})"><i class="fas fa-eye"></i> 상세</button>
    </div>
  </div>`
}

// ══ 상세 ══
async function viewDetail(id){
  try{
    const r=await fetch(`/api/records/${id}`); const d=await r.json()
    if(!d.success){toast('로드 실패');return}
    const rec=d.data
    const dt=new Date(rec.created_at).toLocaleString('ko-KR')
    let photos=''
    if(rec.photos?.length){photos=`<div style="display:flex;gap:5px;overflow-x:auto;padding:6px 0">${rec.photos.map(p=>`<img src="${p.photo_data}" style="width:65px;height:65px;border-radius:7px;object-fit:cover;flex-shrink:0"/>`).join('')}</div>`}
    let ri=''
    if(rec.reinspection){
      const ri2=rec.reinspection
      const rType = ri2.registration_type||'신규등록'
      const badge = rType==='재점검'
        ? '<span style="background:#e3f2fd;color:#1565c0;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">재점검</span>'
        : '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">신규등록</span>'
      const resArr = Array.isArray(ri2.results) ? ri2.results : (ri2.results ? String(ri2.results).split(',').filter(Boolean) : [])
      const resHtml = resArr.length ? '<br>결과: '+resArr.map(r=>`<span style="background:#f1f8e9;border-radius:4px;padding:1px 5px;font-size:10px">${r}</span>`).join(' ') : ''
      const memoHtml = ri2.reinspection_memo ? `<br>메모: ${ri2.reinspection_memo}` : ''
      ri=`<div style="border-top:1px solid #f0f0f0;padding-top:10px;margin-top:8px"><div style="font-size:12px;font-weight:700;color:#1a7a3c;margin-bottom:6px">📋 재점검 사항 ${badge}</div><div style="font-size:11px;color:#555;line-height:1.9">${resHtml}${memoHtml}</div></div>`
    }
    let cl=''
    if(rec.checklist){const c=rec.checklist;cl=`<div style="border-top:1px solid #f0f0f0;padding-top:10px;margin-top:8px"><div style="font-size:12px;font-weight:700;color:#1a7a3c;margin-bottom:6px">✅ 생태 체크리스트</div>${[['식생 훼손',c.vegetation_damage],['외래종 발생',c.invasive_species],['환경 관리',c.environment_mgmt],['탐방로 상태',c.trail_condition],['사진 기록',c.photo_record],['안내시설',c.guide_facility]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #f5f5f5"><span style="color:#888">${k}</span><span style="font-weight:600">${v}</span></div>`).join('')}</div>`}
    document.getElementById('detailCnt').innerHTML=`
      <div class="drow"><span class="dk">종명</span><span class="dv" style="color:#1a7a3c;font-size:15px;font-weight:700">${rec.species_name}</span></div>
      <div class="drow"><span class="dk">작성자</span><span class="dv">${rec.reporter_name}</span></div>
      <div class="drow"><span class="dk">장소</span><span class="dv">${rec.location_name}${rec.region?' ('+rec.region+')':''}</span></div>
      <div class="drow"><span class="dk">상태</span><span class="dv"><span class="badge s-${rec.condition_status}">${rec.condition_status}</span></span></div>
      <div class="drow"><span class="dk">좌표</span><span class="dv">${rec.latitude?'위도 '+parseFloat(rec.latitude).toFixed(6)+', 경도 '+parseFloat(rec.longitude).toFixed(6):'미등록'}</span></div>
      <div class="drow"><span class="dk">특이사항</span><span class="dv">${rec.special_notes||'없음'}</span></div>
      <div class="drow"><span class="dk">등록일시</span><span class="dv">${dt}</span></div>
      ${photos}${ri}${cl}
    `
    document.getElementById('detailModal').classList.add('vis')
  }catch(ex){toast('오류가 발생했습니다.')}
}
function closeDetail(){document.getElementById('detailModal').classList.remove('vis')}

// ══ 내정보 ══
async function loadMyPage(){
  if(!G.user)return
  const u=G.user
  document.getElementById('myInfo').innerHTML=`
    <div class="drow"><span class="dk">이름</span><span class="dv" style="font-weight:700">${u.full_name||'-'}</span></div>
    <div class="drow"><span class="dk">아이디</span><span class="dv">${u.username}</span></div>
    <div class="drow"><span class="dk">담당지역</span><span class="dv">${u.region||'미지정'}</span></div>
    <div class="drow"><span class="dk">권한</span><span class="dv">${u.is_admin?'<span class="badge" style="background:#e3f2fd;color:#1565c0">관리자</span>':'<span class="badge s-양호">일반회원</span>'}</span></div>
    ${u.is_admin?'<div style="margin-top:12px"><a href="/admin" style="display:block;padding:10px;background:#1a7a3c;color:#fff;border-radius:10px;text-align:center;font-size:13px;font-weight:700;text-decoration:none"><i class="fas fa-cog"></i> 관리자 페이지 이동</a></div>':''}
  `
  try{
    const r=await fetch(`/api/records?user_id=${u.id}`); const d=await r.json()
    const recs=d.data||[]
    const stats={total:recs.length,good:recs.filter(x=>x.condition_status==='양호').length,bad:recs.filter(x=>x.condition_status==='불량').length}
    document.getElementById('myStats').innerHTML=`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        <div style="background:#f1f8e9;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:800;color:#1a7a3c">${stats.total}</div><div style="font-size:11px;color:#888;margin-top:2px">전체 기록</div></div>
        <div style="background:#e8f5e9;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:800;color:#2e7d32">${stats.good}</div><div style="font-size:11px;color:#888;margin-top:2px">양호</div></div>
        <div style="background:#fce4ec;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:800;color:#c62828">${stats.bad}</div><div style="font-size:11px;color:#888;margin-top:2px">불량</div></div>
      </div>
    `
  }catch(ex){}
}

// ══ 유틸 ══
function showMsg(id,msg,color){const el=document.getElementById(id);el.textContent=msg;el.style.color=color;el.style.display='block'}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show';setTimeout(()=>{t.className='toast'},2500)}

// ══ 초기화 ══
const saved=sessionStorage.getItem('user')
if(saved){ try{G.user=JSON.parse(saved);showApp()}catch(e){} }
else{
  document.getElementById('authWrap').style.display='flex'
  // 저장된 아이디/비밀번호 자동 채우기
  const savedId=localStorage.getItem('savedId')
  const savedPw=localStorage.getItem('savedPw')
  const saveOn=localStorage.getItem('saveLogin')==='1'
  if(saveOn && savedId && savedPw){
    document.getElementById('login-id').value=savedId
    document.getElementById('login-pw').value=savedPw
    document.getElementById('save-cbox').classList.add('ck')
  }
}
