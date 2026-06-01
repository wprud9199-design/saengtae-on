// ══ 전역 ══
let aUser=null, allRecs=[], allUsers=[], allPoints=[], statsData=null
let leafletMap=null, leafletMarkers=[], pointMap=null
let editId=null, charts={}, reviewRecId=null, curReviewStatus='검토중'
let photoOffset=0, photoTotal=0, photoData=[]

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
function showAdmin(){document.getElementById('loginWrap').style.display='none';document.getElementById('adminWrap').style.display='block';if(aUser)document.getElementById('adminName').innerHTML=`<i class="fas fa-user-shield" style="color:#2d9e52"></i> ${aUser.full_name||'관리자'}`}

// ══ 네비게이션 ══
const secTitles={dashboard:'📊 대시보드',records:'🗃️ 기록 관리',review:'✅ 검수 관리',map:'🗺️ 지도 시각화',points:'📍 고정 지점 관리',photos:'🖼️ 사진 관리',stats:'📈 통계 분석',users:'👥 회원 관리',export:'📥 데이터 내보내기'}
function goSec(s){
  document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'))
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'))
  const sec=document.getElementById('sec-'+s)
  const nav=document.getElementById('nav-'+s)
  if(sec) sec.classList.add('active')
  if(nav) nav.classList.add('active')
  document.getElementById('topbarTitle').textContent=secTitles[s]||s
  if(s==='map') setTimeout(renderMap,150)
  if(s==='stats') loadStats()
  if(s==='users') loadUsers()
  if(s==='review') filterReview()
  if(s==='points') { loadPoints(); setTimeout(initPointMap,200) }
  if(s==='photos') loadPhotos()
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
    // 검수 현황
    document.getElementById('rv-pending').textContent=s?.review_pending||0
    document.getElementById('rv-approved').textContent=s?.review_approved||0
    document.getElementById('rv-rejected').textContent=s?.review_rejected||0
    // 검토중 배지
    const rp=s?.review_pending||0
    if(rp>0){document.getElementById('reviewBadge').textContent=rp;document.getElementById('reviewBadge').style.display='inline-block'}

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
  const dly=document.getElementById('chartDaily')?.getContext('2d')
  if(dly){if(charts.daily)charts.daily.destroy();const labels=(data.byDate||[]).map(x=>x.date?.slice(5));const vals=(data.byDate||[]).map(x=>x.count);charts.daily=new Chart(dly,{type:'line',data:{labels,datasets:[{label:'기록수',data:vals,borderColor:'#2d9e52',backgroundColor:'rgba(45,158,82,.1)',fill:true,tension:.4,pointRadius:3}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})}
  const st=document.getElementById('chartStatus')?.getContext('2d')
  if(st){if(charts.status)charts.status.destroy();const s=data.summary||{};charts.status=new Chart(st,{type:'doughnut',data:{labels:['양호','보통','불량','고사'],datasets:[{data:[s.good||0,s.normal||0,s.bad||0,s.dead||0],backgroundColor:['#4caf50','#ff9800','#f44336','#795548']}]},options:{responsive:true,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}})}
  const rg=document.getElementById('chartRegion')?.getContext('2d')
  if(rg){if(charts.region)charts.region.destroy();const rd=(data.byRegion||[]).slice(0,8);charts.region=new Chart(rg,{type:'bar',data:{labels:rd.map(x=>x.region),datasets:[{label:'기록수',data:rd.map(x=>x.count),backgroundColor:'rgba(45,158,82,.7)',borderRadius:5}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})}
  const mn=document.getElementById('chartMonthly')?.getContext('2d')
  if(mn){if(charts.monthly)charts.monthly.destroy();const md=(data.byMonth||[]).slice(0,12).reverse();charts.monthly=new Chart(mn,{type:'bar',data:{labels:md.map(x=>x.month),datasets:[{label:'기록수',data:md.map(x=>x.count),backgroundColor:'rgba(33,150,243,.6)',borderRadius:5}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})}
  // 등록유형별
  const rt=document.getElementById('chartRegType')?.getContext('2d')
  if(rt){if(charts.regType)charts.regType.destroy();const rtd=data.byRegType||[];charts.regType=new Chart(rt,{type:'doughnut',data:{labels:rtd.map(x=>x.reg_type),datasets:[{data:rtd.map(x=>x.count),backgroundColor:['#2196f3','#9c27b0','#4caf50']}]},options:{responsive:true,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}})}
  // 검수 상태별
  const rv=document.getElementById('chartReview')?.getContext('2d')
  if(rv){if(charts.review)charts.review.destroy();const rvd=data.byReview||[];charts.review=new Chart(rv,{type:'doughnut',data:{labels:rvd.map(x=>x.review_status),datasets:[{data:rvd.map(x=>x.count),backgroundColor:['#ffc107','#4caf50','#f44336','#2196f3']}]},options:{responsive:true,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}})}
}

function buildTopUsers(users){
  const el=document.getElementById('topUserList')
  if(!users.length){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">데이터가 없습니다.</div>';return}
  el.innerHTML=`<table><thead><tr><th>순위</th><th>이름</th><th>소속</th><th>기록수</th></tr></thead><tbody>${users.map((u,i)=>`<tr><td>${i+1}</td><td>${u.full_name||u.reporter_name||'-'}</td><td>${u.organization||'-'}</td><td><span class="badge b-approved">${u.count}건</span></td></tr>`).join('')}</tbody></table>`
}

async function buildRecentRecords(){
  try{
    const r=await fetch('/api/records?limit=5'); const d=await r.json()
    const el=document.getElementById('recentRecords')
    if(!d.success||!d.data.length){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">최근 기록이 없습니다.</div>';return}
    el.innerHTML=`<table><thead><tr><th>종명</th><th>장소</th><th>작성자</th><th>상태</th><th>검수</th><th>등록일</th></tr></thead><tbody>${d.data.slice(0,5).map(x=>`<tr><td style="font-weight:600;color:#1a7a3c">${x.species_name}</td><td>${x.location_name}</td><td>${x.reporter_name}</td><td><span class="badge s-${x.condition_status}">${x.condition_status}</span></td><td><span class="badge rv-${x.review_status||'검토중'}">${x.review_status||'검토중'}</span></td><td style="font-size:11px;color:#aaa">${new Date(x.created_at).toLocaleDateString('ko-KR')}</td></tr>`).join('')}</tbody></table>`
  }catch(e){}
}

// ══ 기록 관리 ══
async function loadAdminRecs(){
  try{
    const r=await fetch('/api/records?limit=200'); const d=await r.json()
    allRecs=d.data||[]; filterRecs(); filterReview()
  }catch(e){}
}
function filterRecs(){
  const kw=(document.getElementById('rf-kw')?.value||'').toLowerCase()
  const st=document.getElementById('rf-st')?.value||''
  const rg=document.getElementById('rf-rg')?.value||''
  const rv=document.getElementById('rf-rv')?.value||''
  const fr=document.getElementById('rf-from')?.value||''
  const to=document.getElementById('rf-to')?.value||''
  const f=allRecs.filter(r=>{
    if(kw&&!r.species_name?.toLowerCase().includes(kw)&&!r.location_name?.toLowerCase().includes(kw)&&!r.reporter_name?.toLowerCase().includes(kw)) return false
    if(st&&r.condition_status!==st) return false
    if(rg&&r.region!==rg) return false
    if(rv&&(r.review_status||'검토중')!==rv) return false
    if(fr&&r.created_at<fr) return false
    if(to&&r.created_at.slice(0,10)>to) return false
    return true
  })
  renderRecTable(f)
}
function renderRecTable(recs){
  const tb=document.getElementById('recTbody')
  if(!recs.length){tb.innerHTML='<tr><td colspan="10" style="text-align:center;padding:24px;color:#aaa">기록이 없습니다.</td></tr>';return}
  tb.innerHTML=recs.map(r=>{
    const dt=new Date(r.created_at).toLocaleDateString('ko-KR')
    const rvStatus=r.review_status||'검토중'
    return '<tr>'+
      '<td style="color:#bbb;font-size:11px">#'+r.id+'</td>'+
      '<td style="font-weight:600;color:#1a7a3c">'+r.species_name+'</td>'+
      '<td>'+r.location_name+'<br><span style="font-size:10px;color:#aaa">'+(r.region||'')+'</span></td>'+
      '<td>'+r.reporter_name+'</td>'+
      '<td><span class="badge s-'+r.condition_status+'">'+r.condition_status+'</span></td>'+
      '<td><span class="badge rv-'+rvStatus+'">'+rvStatus+'</span></td>'+
      '<td style="text-align:center">'+(r.photo_count||0)+'</td>'+
      '<td style="font-size:11px;color:#888">'+(r.survey_date||'-')+'</td>'+
      '<td style="font-size:11px;color:#aaa">'+dt+'</td>'+
      '<td><div style="display:flex;gap:4px">'+
        ((r.photo_count||0)>0?'<button class="btn-e" onclick="viewPhotos('+r.id+')" title="사진 보기" style="color:#7b1fa2;border-color:#7b1fa2"><i class="fas fa-images"></i></button>':'')+
        '<button class="btn-e" onclick="openEdit('+r.id+')"><i class="fas fa-edit"></i></button>'+
        '<button class="btn-d" onclick="delRec('+r.id+')"><i class="fas fa-trash"></i></button>'+
      '</div></td>'+
    '</tr>'
  }).join('')
}

// ══ 검수 관리 ══
function filterReview(){
  const rv=document.getElementById('rv-filter')?.value||''
  const rg=document.getElementById('rv-rg')?.value||''
  const kw=(document.getElementById('rv-kw')?.value||'').toLowerCase()
  const f=allRecs.filter(r=>{
    const rvStatus=r.review_status||'검토중'
    if(rv&&rvStatus!==rv) return false
    if(rg&&r.region!==rg) return false
    if(kw&&!r.species_name?.toLowerCase().includes(kw)&&!r.location_name?.toLowerCase().includes(kw)&&!r.reporter_name?.toLowerCase().includes(kw)) return false
    return true
  })
  renderReviewTable(f)
}
function renderReviewTable(recs){
  const tb=document.getElementById('reviewTbody')
  if(!tb)return
  if(!recs.length){tb.innerHTML='<tr><td colspan="9" style="text-align:center;padding:24px;color:#aaa">기록이 없습니다.</td></tr>';return}
  tb.innerHTML=recs.map(r=>{
    const rvStatus=r.review_status||'검토중'
    return '<tr>'+
      '<td style="color:#bbb;font-size:11px">#'+r.id+'</td>'+
      '<td style="font-weight:600;color:#1a7a3c">'+r.species_name+'</td>'+
      '<td>'+r.location_name+'<br><span style="font-size:10px;color:#aaa">'+(r.region||'')+'</span></td>'+
      '<td>'+r.reporter_name+'</td>'+
      '<td><span class="badge s-'+r.condition_status+'">'+r.condition_status+'</span></td>'+
      '<td><span class="badge rv-'+rvStatus+'">'+rvStatus+'</span></td>'+
      '<td style="font-size:11px;color:#888">'+(r.survey_date||'-')+'</td>'+
      '<td style="text-align:center">'+((r.photo_count||0)>0?'<button class="btn-e" onclick="viewPhotos('+r.id+')" style="color:#7b1fa2;border-color:#7b1fa2"><i class="fas fa-images"></i></button>':'없음')+'</td>'+
      '<td><div style="display:flex;gap:4px;flex-wrap:wrap">'+
        '<button class="btn-a" onclick="openReviewModal('+r.id+',\''+r.species_name+'\',\''+r.location_name+'\',\''+rvStatus+'\')"><i class="fas fa-gavel"></i> 검수</button>'+
      '</div></td>'+
    '</tr>'
  }).join('')
}

// ══ 검수 모달 ══
function openReviewModal(id,species,location,currentStatus){
  reviewRecId=id; curReviewStatus=currentStatus||'검토중'
  document.getElementById('rv-rec-id').value=id
  document.getElementById('reviewTargetInfo').innerHTML='<strong>종명:</strong> '+species+' &nbsp;|&nbsp; <strong>장소:</strong> '+location
  document.getElementById('rv-memo').value=''
  setReviewStatus(currentStatus||'검토중')
  document.getElementById('reviewModal').classList.add('vis')
}
function closeReviewModal(){document.getElementById('reviewModal').classList.remove('vis');reviewRecId=null}
function setReviewStatus(status){
  curReviewStatus=status
  document.getElementById('rv-status').value=status
  const btns=['검토중','승인','반려','수정요청']
  const colors={'검토중':['#ffc107','#fff3cd','#856404'],'승인':['#4caf50','#e8f5e9','#2e7d32'],'반려':['#f44336','#fce4ec','#c62828'],'수정요청':['#2196f3','#e3f2fd','#1565c0']}
  btns.forEach(b=>{
    const el=document.getElementById('rvb-'+b)
    if(!el)return
    const c=colors[b]||['#ddd','#fafafa','#888']
    if(b===status){el.style.borderColor=c[0];el.style.background=c[1];el.style.color=c[2]}
    else{el.style.borderColor='#ddd';el.style.background='#fafafa';el.style.color='#888'}
  })
}
async function submitReview(){
  if(!reviewRecId)return
  const status=document.getElementById('rv-status').value
  const memo=document.getElementById('rv-memo').value
  if((status==='반려'||status==='수정요청')&&!memo.trim()){toast('❌ 반려/수정요청 시 메모를 입력해주세요.');return}
  try{
    const r=await fetch('/api/admin/records/'+reviewRecId+'/review',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({review_status:status,review_memo:memo,reviewed_by:aUser?.full_name||'관리자'})})
    const d=await r.json()
    if(d.success){
      toast('✅ 검수 처리 완료 ('+status+')')
      closeReviewModal()
      loadAdminRecs()
      loadDashboard()
    } else toast('❌ '+d.error)
  }catch(e){toast('❌ 오류 발생')}
}

// ══ Leaflet 지도 ══
let leafletInited=false
function renderMap(){
  const stF=document.getElementById('map-st-filter')?.value||''
  const rgF=document.getElementById('map-rg-filter')?.value||''
  const rtF=document.getElementById('map-rt-filter')?.value||''
  const fromF=document.getElementById('map-from')?.value||''
  const toF=document.getElementById('map-to')?.value||''
  const mapDiv=document.getElementById('adminMap')
  if(!mapDiv)return

  if(!leafletMap){
    leafletMap=L.map('adminMap').setView([33.4800,126.5312],10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:18}).addTo(leafletMap)
    leafletInited=true
  }
  leafletMarkers.forEach(m=>m.remove())
  leafletMarkers=[]

  const colors={양호:'#4caf50',보통:'#ff9800',불량:'#f44336',고사:'#795548'}
  const regColors={신규등록:'#2196f3',재점검:'#9c27b0'}
  const allMapData=(statsData?.mapData||allRecs.filter(r=>r.latitude))
  const mapData=allMapData.filter(r=>{
    if(stF&&r.condition_status!==stF) return false
    if(rgF&&r.region!==rgF) return false
    if(rtF&&(r.registration_type||'신규등록')!==rtF) return false
    if(fromF&&(r.created_at||'').slice(0,10)<fromF) return false
    if(toF&&(r.created_at||'').slice(0,10)>toF) return false
    return true
  }).filter(r=>r.latitude&&r.longitude)

  mapData.forEach(r=>{
    const c=colors[r.condition_status]||'#888'
    const rc=regColors[r.registration_type||'신규등록']||'#2196f3'
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28"><circle cx="12" cy="11" r="9" fill="'+c+'" stroke="'+rc+'" stroke-width="3"/><line x1="12" y1="20" x2="12" y2="28" stroke="'+c+'" stroke-width="2"/></svg>'
    const icon=L.divIcon({html:svg,className:'',iconSize:[24,28],iconAnchor:[12,28],popupAnchor:[0,-28]})
    const m=L.marker([r.latitude,r.longitude],{icon}).addTo(leafletMap)
    const popup='<div style="font-size:12px;min-width:160px">'+
      '<div style="font-weight:700;color:#1a7a3c;margin-bottom:4px">'+r.species_name+'</div>'+
      '<div>📍 '+(r.location_name||'')+' ('+(r.region||'')+')</div>'+
      '<div>👤 '+(r.reporter_name||'')+'</div>'+
      '<div>📅 '+(r.survey_date||r.created_at?.slice(0,10)||'')+'</div>'+
      '<div style="margin-top:4px">'+
        '<span style="background:'+c+';color:#fff;padding:2px 7px;border-radius:10px;font-size:10px;margin-right:4px">'+r.condition_status+'</span>'+
        '<span style="background:'+rc+';color:#fff;padding:2px 7px;border-radius:10px;font-size:10px">'+(r.registration_type||'신규등록')+'</span>'+
      '</div></div>'
    m.bindPopup(popup)
    leafletMarkers.push(m)
  })
  document.getElementById('mapInfo').textContent='총 '+mapData.length+'건의 좌표 데이터가 지도에 표시됩니다.'

  const listEl=document.getElementById('mapRecordList')
  if(listEl){
    if(!mapData.length){listEl.innerHTML='<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">좌표가 등록된 기록이 없습니다.</div>';return}
    listEl.innerHTML=`<table><thead><tr><th>종명</th><th>장소/지역</th><th>등록유형</th><th>상태</th><th>위도</th><th>경도</th><th>작성자</th><th>조사일</th></tr></thead><tbody>${mapData.map(r=>`<tr>
      <td style="font-weight:600;color:#1a7a3c">${r.species_name}</td>
      <td>${r.location_name}<br><span style="font-size:10px;color:#aaa">${r.region||''}</span></td>
      <td><span class="badge" style="background:#e3f2fd;color:#1565c0">${r.registration_type||'신규등록'}</span></td>
      <td><span class="badge s-${r.condition_status}">${r.condition_status}</span></td>
      <td style="font-size:11px">${parseFloat(r.latitude).toFixed(6)}</td>
      <td style="font-size:11px">${parseFloat(r.longitude).toFixed(6)}</td>
      <td>${r.reporter_name}</td>
      <td style="font-size:11px;color:#aaa">${r.survey_date||new Date(r.created_at).toLocaleDateString('ko-KR')}</td>
    </tr>`).join('')}</tbody></table>`
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

    const rgEl=document.getElementById('regionStatList')
    if(rgEl){
      const total=(data.byRegion||[]).reduce((a,x)=>a+x.count,0)||1
      rgEl.innerHTML=(data.byRegion||[]).length?
        (data.byRegion||[]).map(x=>`
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span style="font-weight:600">${x.region}</span><span style="color:#888">${x.count}건</span>
            </div>
            <div style="background:#f0f0f0;border-radius:10px;height:8px;overflow:hidden">
              <div style="width:${Math.round(x.count/total*100)}%;background:linear-gradient(90deg,#1a7a3c,#2d9e52);height:100%;border-radius:10px"></div>
            </div>
          </div>`).join(''):
        '<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">데이터 없음</div>'
    }

    const spEl=document.getElementById('speciesStatList')
    if(spEl){
      spEl.innerHTML=(data.bySpecies||[]).length?
        `<table><thead><tr><th>종명</th><th>전체</th><th>양호</th><th>불량</th></tr></thead><tbody>${(data.bySpecies||[]).map(x=>`<tr><td style="font-weight:600;color:#1a7a3c">${x.species_name}</td><td>${x.count}</td><td style="color:#2e7d32">${x.good}</td><td style="color:#c62828">${x.bad}</td></tr>`).join('')}</tbody></table>`:
        '<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">데이터 없음</div>'
    }

    const usEl=document.getElementById('userStatList')
    if(usEl){
      usEl.innerHTML=(data.byUser||[]).length?
        `<table><thead><tr><th>이름</th><th>소속</th><th>기록수</th></tr></thead><tbody>${(data.byUser||[]).map(x=>`<tr><td>${x.full_name||x.reporter_name||'-'}</td><td>${x.organization||'-'}</td><td><span class="badge b-approved">${x.count}건</span></td></tr>`).join('')}</tbody></table>`:
        '<div style="text-align:center;color:#aaa;font-size:12px;padding:16px">데이터 없음</div>'
    }

    // 월별 차트
    const mnCtx=document.getElementById('chartStMonth')?.getContext('2d')
    if(mnCtx){if(charts.stMonth)charts.stMonth.destroy();const md=(data.byMonth||[]).slice(0,12).reverse();charts.stMonth=new Chart(mnCtx,{type:'bar',data:{labels:md.map(x=>x.month),datasets:[{label:'기록수',data:md.map(x=>x.count),backgroundColor:'rgba(33,150,243,.65)',borderRadius:5}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})}
    // 연도별 차트
    const yrCtx=document.getElementById('chartStYear')?.getContext('2d')
    if(yrCtx){if(charts.stYear)charts.stYear.destroy();const yd=(data.byYear||[]).reverse();charts.stYear=new Chart(yrCtx,{type:'bar',data:{labels:yd.map(x=>x.year),datasets:[{label:'기록수',data:yd.map(x=>x.count),backgroundColor:'rgba(156,39,176,.65)',borderRadius:5}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})}
    // 상태별
    const statCtx=document.getElementById('chartStatStatus')?.getContext('2d')
    if(statCtx){if(charts.statStatus)charts.statStatus.destroy();const s=data.summary||{};charts.statStatus=new Chart(statCtx,{type:'bar',data:{labels:['양호','보통','불량','고사'],datasets:[{label:'기록수',data:[s.good||0,s.normal||0,s.bad||0,s.dead||0],backgroundColor:['#4caf50','#ff9800','#f44336','#795548'],borderRadius:6}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}})}
    // 등록유형별
    const rtCtx=document.getElementById('chartStatRegType')?.getContext('2d')
    if(rtCtx){if(charts.statRegType)charts.statRegType.destroy();const rtd=data.byRegType||[];charts.statRegType=new Chart(rtCtx,{type:'doughnut',data:{labels:rtd.map(x=>x.reg_type),datasets:[{data:rtd.map(x=>x.count),backgroundColor:['#2196f3','#9c27b0']}]},options:{responsive:true,plugins:{legend:{position:'right',labels:{font:{size:11}}}}}})}
  }catch(e){}
}
function clearStatFilter(){
  document.getElementById('st-from').value=''
  document.getElementById('st-to').value=''
  loadStats()
}

// ══ 고정 지점 관리 ══
async function loadPoints(){
  try{
    const rg=document.getElementById('pt-filter-rg')?.value||''
    const url='/api/admin/points'+(rg?'?region='+rg:'')
    const r=await fetch(url); const d=await r.json()
    allPoints=d.data||[]; filterPoints()
  }catch(e){}
}
function filterPoints(){
  const kw=(document.getElementById('pt-filter-kw')?.value||'').toLowerCase()
  const f=allPoints.filter(p=>!kw||p.name?.toLowerCase().includes(kw)||(p.region||'').toLowerCase().includes(kw))
  renderPointTable(f)
  updatePointMap(f)
}
function renderPointTable(pts){
  const tb=document.getElementById('pointTbody')
  if(!tb)return
  if(!pts.length){tb.innerHTML='<tr><td colspan="8" style="text-align:center;padding:24px;color:#aaa">등록된 지점이 없습니다.</td></tr>';return}
  tb.innerHTML=pts.map(p=>'<tr>'+
    '<td style="color:#bbb;font-size:11px">#'+p.id+'</td>'+
    '<td style="font-weight:600;color:#1a7a3c">'+p.name+'</td>'+
    '<td>'+(p.region||'-')+'</td>'+
    '<td>'+(p.eco_type||'-')+'</td>'+
    '<td style="font-size:11px;color:#888">'+(p.latitude?parseFloat(p.latitude).toFixed(4)+','+parseFloat(p.longitude).toFixed(4):'없음')+'</td>'+
    '<td style="font-size:11px">'+(p.description||'-')+'</td>'+
    '<td style="font-size:11px;color:#aaa">'+new Date(p.created_at).toLocaleDateString('ko-KR')+'</td>'+
    '<td><div style="display:flex;gap:4px">'+
      '<button class="btn-e" onclick="editPoint('+p.id+')"><i class="fas fa-edit"></i></button>'+
      '<button class="btn-d" onclick="delPoint('+p.id+')"><i class="fas fa-trash"></i></button>'+
    '</div></td>'+
  '</tr>').join('')
}
function initPointMap(){
  const el=document.getElementById('pointMapWrap')
  if(!el||pointMap)return
  pointMap=L.map('pointMapWrap').setView([33.4800,126.5312],10)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:18}).addTo(pointMap)
  updatePointMap(allPoints)
}
let ptMarkers=[]
function updatePointMap(pts){
  if(!pointMap)return
  ptMarkers.forEach(m=>m.remove()); ptMarkers=[]
  pts.filter(p=>p.latitude&&p.longitude).forEach(p=>{
    const m=L.marker([p.latitude,p.longitude]).addTo(pointMap)
    m.bindPopup('<b>'+p.name+'</b><br>'+(p.region||'')+' '+(p.eco_type||''))
    ptMarkers.push(m)
  })
}
function openPointModal(id){
  document.getElementById('pt-id').value=id||''
  document.getElementById('pointModalTitle').textContent=id?'지점 수정':'지점 등록'
  if(id){
    const p=allPoints.find(x=>x.id===id)
    if(p){
      document.getElementById('pt-name').value=p.name||''
      document.getElementById('pt-region').value=p.region||''
      document.getElementById('pt-ecotype').value=p.eco_type||''
      document.getElementById('pt-lat').value=p.latitude||''
      document.getElementById('pt-lng').value=p.longitude||''
      document.getElementById('pt-desc').value=p.description||''
    }
  } else {
    document.getElementById('pt-name').value=''
    document.getElementById('pt-region').value=''
    document.getElementById('pt-ecotype').value=''
    document.getElementById('pt-lat').value=''
    document.getElementById('pt-lng').value=''
    document.getElementById('pt-desc').value=''
  }
  document.getElementById('pointModal').classList.add('vis')
}
function closePointModal(){document.getElementById('pointModal').classList.remove('vis')}
async function savePoint(){
  const id=document.getElementById('pt-id').value
  const name=document.getElementById('pt-name').value.trim()
  if(!name){toast('❌ 지점명을 입력해주세요.');return}
  const payload={
    name,
    region:document.getElementById('pt-region').value||null,
    latitude:parseFloat(document.getElementById('pt-lat').value)||null,
    longitude:parseFloat(document.getElementById('pt-lng').value)||null,
    eco_type:document.getElementById('pt-ecotype').value||null,
    description:document.getElementById('pt-desc').value||null
  }
  const url=id?'/api/admin/points/'+id:'/api/admin/points'
  const method=id?'PUT':'POST'
  try{
    const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    const d=await r.json()
    if(d.success){toast('✅ 저장 완료');closePointModal();loadPoints()} else toast('❌ '+d.error)
  }catch(e){toast('❌ 오류 발생')}
}
function editPoint(id){openPointModal(id)}
async function delPoint(id){
  if(!confirm('지점 #'+id+'를 삭제하시겠습니까?'))return
  try{
    const r=await fetch('/api/admin/points/'+id,{method:'DELETE'})
    const d=await r.json()
    if(d.success){toast('✅ 삭제 완료');loadPoints()} else toast('❌ '+d.error)
  }catch(e){toast('❌ 오류 발생')}
}

// ══ 사진 관리 ══
async function loadPhotos(reset){
  if(reset===undefined)reset=true
  if(reset){photoOffset=0;photoData=[]}
  const rg=document.getElementById('ph-rg')?.value||''
  const rt=document.getElementById('ph-rt')?.value||''
  const from=document.getElementById('ph-from')?.value||''
  const to=document.getElementById('ph-to')?.value||''
  const params=[]
  if(rg) params.push('region='+rg)
  if(rt) params.push('reg_type='+rt)
  if(from) params.push('from='+from)
  if(to) params.push('to='+to)
  params.push('limit=20&offset='+photoOffset)
  try{
    const r=await fetch('/api/admin/photos?'+params.join('&')); const d=await r.json()
    if(!d.success)return
    photoTotal=d.total||0
    photoData=reset?d.data||[]:[...photoData,...(d.data||[])]
    photoOffset+=d.data?.length||0
    renderPhotoGrid()
    document.getElementById('photoStats').textContent='총 '+photoTotal+'장 사진 (현재 '+photoData.length+'장 표시)'
    const loadMore=document.getElementById('photoLoadMore')
    if(loadMore) loadMore.style.display=photoOffset<photoTotal?'block':'none'
  }catch(e){}
}
function loadMorePhotos(){loadPhotos(false)}
function renderPhotoGrid(){
  const el=document.getElementById('photoGrid')
  if(!el)return
  if(!photoData.length){el.innerHTML='<div style="text-align:center;color:#aaa;font-size:12px;padding:32px;grid-column:1/-1">사진이 없습니다.</div>';return}
  // 날짜별 그룹핑
  const groups={}
  photoData.forEach(p=>{
    const dt=(p.survey_date||p.record_date||'').slice(0,10)||'날짜 없음'
    if(!groups[dt])groups[dt]=[]
    groups[dt].push(p)
  })
  let html=''
  Object.keys(groups).sort().reverse().forEach(dt=>{
    const phs=groups[dt]
    html+='<div style="grid-column:1/-1;font-size:12px;font-weight:700;color:#1a7a3c;margin:6px 0 4px;padding-bottom:4px;border-bottom:1px solid #e8f0e8"><i class="fas fa-calendar-day"></i> '+dt+' ('+phs.length+'장)</div>'
    phs.forEach(p=>{
      html+='<div style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.08);cursor:pointer" onclick="viewPhotos('+p.record_id+')">'+
        '<div style="height:120px;background:#f5f5f5;display:flex;align-items:center;justify-content:center">'+
          '<i class="fas fa-image" style="font-size:32px;color:#ddd"></i>'+
        '</div>'+
        '<div style="padding:7px 9px">'+
          '<div style="font-size:11px;font-weight:600;color:#1a7a3c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+p.species_name+'</div>'+
          '<div style="font-size:10px;color:#888;margin-top:1px">'+(p.region||'')+(p.registration_type==='재점검'?' · <span style="color:#9c27b0">재점검</span>':'')+'</div>'+
          '<div style="font-size:10px;color:#aaa">'+p.reporter_name+'</div>'+
        '</div>'+
      '</div>'
    })
  })
  el.innerHTML=html
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
    return`<tr>
      <td style="color:#bbb;font-size:11px">#${u.id}</td>
      <td style="font-weight:600">${u.username}</td>
      <td>${u.full_name}</td>
      <td style="font-size:12px">${u.organization||'-'}</td>
      <td style="font-size:12px">${u.region||'-'}</td>
      <td><span class="badge ${badge[u.role]||''}">${label[u.role]||u.role}</span></td>
      <td>${u.is_admin?'<span class="badge b-admin">관리자</span>':'<span style="font-size:11px;color:#aaa">일반</span>'}</td>
      <td style="font-size:11px;color:#aaa">${dt}</td>
      <td style="text-align:center">${u.record_count||0}</td>
      <td><div style="display:flex;gap:3px;flex-wrap:wrap">
        ${u.role==='pending'?`<button class="btn-a" onclick="approveUser(${u.id})">✅승인</button><button class="btn-r" onclick="rejectUser(${u.id})">❌거절</button>`:''}
        ${u.role==='approved'&&!u.is_admin?`<button class="btn-d" onclick="suspendUser(${u.id},true)" style="padding:4px 8px">⛔정지</button>`:''}
        ${u.role==='suspended'?`<button class="btn-a" onclick="suspendUser(${u.id},false)">🔓복구</button>`:''}
        <button class="btn-e" onclick="toggleAdmin(${u.id},${u.is_admin})">🔑</button>
      </div></td>
    </tr>`
  }).join('')
}

async function approveUser(id){
  if(!confirm('이 회원을 승인하시겠습니까?'))return
  const r=await fetch('/api/admin/users/'+id+'/approve',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({approved_by:aUser?.username||'admin'})})
  const d=await r.json()
  if(d.success){toast('✅ 승인되었습니다.');loadUsers();loadDashboard()} else toast('❌ '+d.error)
}
async function rejectUser(id){
  const reason=prompt('거절 사유를 입력하세요 (선택사항):')
  if(reason===null)return
  const r=await fetch('/api/admin/users/'+id+'/reject',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})})
  const d=await r.json()
  if(d.success){toast('✅ 거절처리 되었습니다.');loadUsers();loadDashboard()} else toast('❌ '+d.error)
}
async function suspendUser(id,suspend){
  if(!confirm(suspend?'이 회원을 정지시키겠습니까?':'이 회원의 정지를 해제하겠습니까?'))return
  const r=await fetch('/api/admin/users/'+id+'/suspend',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({suspend})})
  const d=await r.json()
  if(d.success){toast(suspend?'⛔ 정지되었습니다.':'🔓 정지 해제되었습니다.');loadUsers()} else toast('❌ '+d.error)
}
async function toggleAdmin(id,cur){
  const msg=cur?'관리자 권한을 제거하시겠습니까?':'관리자 권한을 부여하시겠습니까?'
  if(!confirm(msg))return
  const r=await fetch('/api/admin/users/'+id+'/role',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_admin:!cur})})
  const d=await r.json()
  if(d.success){toast('✅ 권한이 변경되었습니다.');loadUsers()} else toast('❌ '+d.error)
}
function closeUserModal(){document.getElementById('userModal').classList.remove('vis')}

// ══ 기록 수정 ══
async function openEdit(id){
  editId=id
  try{
    const r=await fetch('/api/records/'+id); const d=await r.json()
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
      const ri=rec.reinspection
      document.getElementById('e-regtype').value = ri.registration_type||'신규등록'
      const labels=['제거(교란종 등) 완료','재발생 없음','재발생 확인','확산 확인','개체 수 감소','개체 수 증가','추가 조치 필요','지속 관찰 필요','이전 조사와 동일']
      const savedResults = Array.isArray(ri.results) ? ri.results
        : (typeof ri.results==='string' ? ri.results.split(',').filter(Boolean) : [])
      for(let i=1;i<=9;i++){
        const cb=document.getElementById('e-ri-'+i)
        if(cb) cb.checked=savedResults.includes(labels[i-1])
      }
      document.getElementById('e-rimemo').value=ri.reinspection_memo||''
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
  const eLabels=['제거(교란종 등) 완료','재발생 없음','재발생 확인','확산 확인','개체 수 감소','개체 수 증가','추가 조치 필요','지속 관찰 필요','이전 조사와 동일']
  const eChecked=eLabels.filter((_,i)=>{const cb=document.getElementById('e-ri-'+(i+1));return cb&&cb.checked})
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
    reinspection:{
      registration_type:document.getElementById('e-regtype').value,
      results:eChecked,
      reinspection_memo:document.getElementById('e-rimemo').value
    },
    checklist:{vegetation_damage:document.getElementById('e-cl-v').value,invasive_species:document.getElementById('e-cl-i').value,environment_mgmt:document.getElementById('e-cl-e').value,trail_condition:document.getElementById('e-cl-t').value,photo_record:document.getElementById('e-cl-p').value,guide_facility:document.getElementById('e-cl-g').value}
  }
  const r=await fetch('/api/records/'+editId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  const d=await r.json()
  if(d.success){toast('✅ 수정 완료');closeEdit();loadAdminRecs();loadDashboard()} else toast('❌ '+d.error)
}

async function delRec(id){
  if(!confirm('기록 #'+id+'를 삭제하시겠습니까?'))return
  const r=await fetch('/api/records/'+id,{method:'DELETE'})
  const d=await r.json()
  if(d.success){toast('✅ 삭제 완료');loadAdminRecs();loadDashboard()} else toast('❌ '+d.error)
}

// ══ 사진 뷰어 ══
let pvPhotos=[], pvIdx=0, pvRecId=null, pvRecInfo=''

async function viewPhotos(id){
  try{
    const r=await fetch('/api/records/'+id); const d=await r.json()
    if(!d.success||!d.data.photos||!d.data.photos.length){toast('📷 사진이 없습니다.');return}
    pvPhotos=d.data.photos; pvIdx=0; pvRecId=id
    pvRecInfo=(d.data.species_name||'')+'('+(d.data.location_name||'')+') - '+(d.data.reporter_name||'')
    document.getElementById('pvTitle').textContent='📷 '+pvRecInfo
    pvRender()
    document.getElementById('photoViewModal').classList.add('vis')
  }catch(e){toast('❌ 사진 로드 실패')}
}

function pvRender(){
  if(!pvPhotos.length)return
  const ph=pvPhotos[pvIdx]
  document.getElementById('pvImg').src=ph.photo_data||''
  document.getElementById('pvCounter').textContent=(pvIdx+1)+' / '+pvPhotos.length
  document.getElementById('pvPrev').style.display=pvIdx>0?'flex':'none'
  document.getElementById('pvNext').style.display=pvIdx<pvPhotos.length-1?'flex':'none'
  document.getElementById('pvThumbs').innerHTML=pvPhotos.map((p,i)=>
    '<img src="'+(p.photo_data||'')+'" onclick="pvJump('+i+')" style="width:52px;height:52px;object-fit:cover;border-radius:7px;cursor:pointer;opacity:'+(i===pvIdx?1:0.45)+';border:'+(i===pvIdx?'2px solid #a8e6bc':'2px solid transparent')+';transition:all .2s"/>').join('')
}

function pvNav(dir){pvIdx=Math.max(0,Math.min(pvPhotos.length-1,pvIdx+dir));pvRender()}
function pvJump(i){pvIdx=i;pvRender()}
function closePhotoModal(){document.getElementById('photoViewModal').classList.remove('vis');pvPhotos=[];pvIdx=0}

function dlCurrentPhoto(){
  if(!pvPhotos.length)return
  const ph=pvPhotos[pvIdx]
  const name=ph.photo_name||('photo_'+(pvIdx+1)+'.jpg')
  const a=document.createElement('a')
  a.href=ph.photo_data||''; a.download=name.endsWith('.jpg')||name.endsWith('.png')||name.endsWith('.jpeg')?name:name+'.jpg'
  a.click(); toast('✅ 사진 '+(pvIdx+1)+' 저장됨')
}

async function dlAllPhotos(){
  if(!pvPhotos.length)return
  toast('📥 전체 '+pvPhotos.length+'장 저장 중...')
  for(let i=0;i<pvPhotos.length;i++){
    await new Promise(res=>setTimeout(res,300))
    const ph=pvPhotos[i]
    const name=ph.photo_name||('photo_'+(i+1)+'.jpg')
    const a=document.createElement('a')
    a.href=ph.photo_data||''; a.download=name.endsWith('.jpg')||name.endsWith('.png')||name.endsWith('.jpeg')?name:name+'.jpg'
    a.click()
  }
  toast('✅ '+pvPhotos.length+'장 저장 완료')
}

// ══ 내보내기 ══
async function getExportData(){
  const from=document.getElementById('exp-from')?.value||''
  const to=document.getElementById('exp-to')?.value||''
  const region=document.getElementById('exp-region')?.value||''
  const regtype=document.getElementById('exp-regtype')?.value||''
  const review=document.getElementById('exp-review')?.value||''
  let url='/api/admin/export'
  const p=[]
  if(from) p.push('from='+from)
  if(to) p.push('to='+to)
  if(region) p.push('region='+region)
  if(regtype) p.push('reg_type='+regtype)
  if(review) p.push('review_status='+review)
  if(p.length) url+='?'+p.join('&')
  const r=await fetch(url); const d=await r.json()
  return d.success?d.data:[]
}

async function exportCSV(){
  const data=await getExportData()
  if(!data.length){toast('내보낼 데이터가 없습니다.');return}
  const hdrs=['ID','종명','장소','지역','작성자','회원명','소속','상태','위도','경도','특이사항','조사일','조사시각','날씨','생태계유형','검수상태','검수메모','검수자','검수일시','등록유형','재점검결과','재점검메모','식생훼손','외래종','환경관리','탐방로','사진기록','안내시설','등록일시','수정일시','수정자','사진수']
  const rows=data.map(r=>[r.id,r.species_name,r.location_name,r.region||'',r.reporter_name,r.member_name||'',r.organization||'',r.condition_status,r.latitude||'',r.longitude||'',(r.special_notes||'').replace(/,/g,'；'),r.survey_date||'',r.survey_time||'',r.weather||'',r.eco_type||'',r.review_status||'검토중',(r.review_memo||'').replace(/,/g,'；'),r.reviewed_by||'',r.reviewed_at||'',r.registration_type||'신규등록',(r.results||'').replace(/,/g,'|'),r.reinspection_memo||'',r.vegetation_damage||'',r.invasive_species||'',r.environment_mgmt||'',r.trail_condition||'',r.photo_record||'',r.guide_facility||'',r.created_at,r.updated_at||'',r.updated_by||'',r.photo_count||0])
  const csv='\uFEFF'+[hdrs,...rows].map(r=>r.join(',')).join('\n')
  dl(csv,'text/csv;charset=utf-8','생태ON_기록_'+now()+'.csv')
  toast('✅ CSV 다운로드 완료 ('+data.length+'건)')
}

async function exportExcel(){
  const data=await getExportData()
  if(!data.length){toast('내보낼 데이터가 없습니다.');return}
  const hdrs='ID\t종명\t장소\t지역\t작성자\t회원명\t소속\t상태\t위도\t경도\t특이사항\t조사일\t조사시각\t날씨\t생태계유형\t검수상태\t등록유형\t재점검결과\t재점검메모\t등록일시\t사진수'
  const rows=data.map(r=>[r.id,r.species_name,r.location_name,r.region||'',r.reporter_name,r.member_name||'',r.organization||'',r.condition_status,r.latitude||'',r.longitude||'',r.special_notes||'',r.survey_date||'',r.survey_time||'',r.weather||'',r.eco_type||'',r.review_status||'검토중',r.registration_type||'신규등록',r.results||'',r.reinspection_memo||'',r.created_at,r.photo_count||0].join('\t'))
  const tsv=[hdrs,...rows].join('\n')
  dl('\uFEFF'+tsv,'text/tab-separated-values;charset=utf-8','생태ON_기록_'+now()+'.tsv')
  toast('✅ Excel 파일 다운로드 완료')
}

async function exportUsers(){
  try{
    const r=await fetch('/api/admin/users'); const d=await r.json()
    if(!d.success){toast('❌ 실패');return}
    const hdrs=['ID','아이디','이름','소속','지역','상태','권한','이메일','연락처','가입일','마지막로그인','기록수']
    const rows=d.data.map(u=>[u.id,u.username,u.full_name,u.organization||'',u.region||'',u.role,u.is_admin?'관리자':'일반',u.email||'',u.phone||'',u.created_at,u.last_login||'',u.record_count||0])
    const csv='\uFEFF'+[hdrs,...rows].map(r=>r.join(',')).join('\n')
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
