import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = { DB: D1Database }
const api = new Hono<{ Bindings: Bindings }>()
api.use('/*', cors())

// ─────────────────────────────────────────
// DB 초기화
// ─────────────────────────────────────────
let dbReady = false
async function initDB(db: D1Database) {
  if (dbReady) return
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      organization TEXT,
      role TEXT NOT NULL DEFAULT 'pending',
      is_admin INTEGER DEFAULT 0,
      region TEXT,
      approved_at DATETIME,
      approved_by TEXT,
      reject_reason TEXT,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS monitoring_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      reporter_name TEXT NOT NULL,
      location_name TEXT NOT NULL,
      region TEXT,
      species_name TEXT NOT NULL,
      condition_status TEXT NOT NULL DEFAULT '양호',
      latitude REAL,
      longitude REAL,
      special_notes TEXT,
      survey_date TEXT,
      survey_time TEXT,
      weather TEXT,
      eco_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      updated_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS monitoring_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      photo_data TEXT NOT NULL,
      photo_name TEXT,
      photo_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES monitoring_records(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS reinspection_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL UNIQUE,
      registration_type TEXT DEFAULT '신규등록',
      results TEXT DEFAULT '',
      removal_done INTEGER DEFAULT 0,
      no_recurrence INTEGER DEFAULT 0,
      spread_check INTEGER DEFAULT 0,
      reinspection_memo TEXT,
      reinspection_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (record_id) REFERENCES monitoring_records(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS ecology_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL UNIQUE,
      vegetation_damage TEXT DEFAULT '양호',
      invasive_species TEXT DEFAULT '없음',
      environment_mgmt TEXT DEFAULT '없음',
      trail_condition TEXT DEFAULT '양호',
      photo_record TEXT DEFAULT '완료',
      guide_facility TEXT DEFAULT '양호',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY (record_id) REFERENCES monitoring_records(id) ON DELETE CASCADE
    )`),
    db.prepare(`INSERT OR IGNORE INTO users
      (username,password_hash,full_name,email,role,is_admin,approved_at)
      VALUES('admin','admin1234','시스템 관리자','admin@jejugreen.or.kr','approved',1,CURRENT_TIMESTAMP)`)
  ])
  dbReady = true
}

// ─────────────────────────────────────────
// AUTH - 회원가입
// ─────────────────────────────────────────
api.post('/auth/register', async (c) => {
  try {
    await initDB(c.env.DB)
    const { username, password, full_name, email, phone, organization, region } = await c.req.json()
    if (!username || !password || !full_name)
      return c.json({ success: false, error: '아이디, 비밀번호, 이름은 필수입니다.' }, 400)

    const exists = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(username).first()
    if (exists) return c.json({ success: false, error: '이미 사용 중인 아이디입니다.' }, 409)

    await c.env.DB.prepare(`INSERT INTO users
      (username,password_hash,full_name,email,phone,organization,region,role)
      VALUES(?,?,?,?,?,?,?,'pending')`)
      .bind(username, password, full_name, email||null, phone||null, organization||null, region||null)
      .run()
    return c.json({ success: true, message: '가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.' }, 201)
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// AUTH - 로그인
api.post('/auth/login', async (c) => {
  try {
    await initDB(c.env.DB)
    const { username, password } = await c.req.json()
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username=? AND password_hash=?'
    ).bind(username, password).first() as any

    if (!user) return c.json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401)
    if (user.role === 'pending')
      return c.json({ success: false, error: '관리자 승인 대기 중입니다. 승인 후 이용 가능합니다.', code: 'PENDING' }, 403)
    if (user.role === 'rejected')
      return c.json({ success: false, error: `가입이 거절되었습니다. 사유: ${user.reject_reason || '없음'}`, code: 'REJECTED' }, 403)
    if (user.role === 'suspended')
      return c.json({ success: false, error: '계정이 정지되었습니다. 관리자에게 문의하세요.', code: 'SUSPENDED' }, 403)

    await c.env.DB.prepare('UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?').bind(user.id).run()
    return c.json({
      success: true,
      data: { id: user.id, username: user.username, full_name: user.full_name, is_admin: user.is_admin, region: user.region, role: user.role }
    })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ─────────────────────────────────────────
// RECORDS - 모니터링 기록
// ─────────────────────────────────────────
api.get('/records', async (c) => {
  try {
    await initDB(c.env.DB)
    const { region, user_id, status, from, to, limit = '50', offset = '0' } = c.req.query()
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (region) { where += ' AND r.region=?'; params.push(region) }
    if (user_id) { where += ' AND r.user_id=?'; params.push(user_id) }
    if (status) { where += ' AND r.condition_status=?'; params.push(status) }
    if (from) { where += ' AND date(r.created_at)>=?'; params.push(from) }
    if (to) { where += ' AND date(r.created_at)<=?'; params.push(to) }

    const { results } = await c.env.DB.prepare(`
      SELECT r.*, COUNT(p.id) as photo_count,
        u.full_name as user_full_name, u.organization as user_org
      FROM monitoring_records r
      LEFT JOIN monitoring_photos p ON r.id=p.record_id
      LEFT JOIN users u ON r.user_id=u.id
      ${where} GROUP BY r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?
    `).bind(...params, parseInt(limit), parseInt(offset)).all()

    const countRow = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM monitoring_records r ${where}
    `).bind(...params).first() as any

    return c.json({ success: true, data: results, total: countRow?.total || 0 })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

api.get('/records/:id', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = c.req.param('id')
    const record = await c.env.DB.prepare(`
      SELECT r.*, u.full_name as user_full_name, u.organization as user_org
      FROM monitoring_records r LEFT JOIN users u ON r.user_id=u.id WHERE r.id=?
    `).bind(id).first()
    if (!record) return c.json({ success: false, error: '기록을 찾을 수 없습니다.' }, 404)

    const { results: photos } = await c.env.DB.prepare(
      'SELECT * FROM monitoring_photos WHERE record_id=? ORDER BY photo_order'
    ).bind(id).all()
    const reinspection = await c.env.DB.prepare('SELECT * FROM reinspection_records WHERE record_id=?').bind(id).first()
    const checklist = await c.env.DB.prepare('SELECT * FROM ecology_checklist WHERE record_id=?').bind(id).first()

    return c.json({ success: true, data: { ...record, photos, reinspection, checklist } })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

api.post('/records', async (c) => {
  try {
    await initDB(c.env.DB)
    const body = await c.req.json()
    const { reporter_name, location_name, species_name, condition_status='양호',
      latitude, longitude, special_notes, user_id, region,
      survey_date=null, survey_time=null, weather=null, eco_type=null,
      photos=[], reinspection=null, checklist=null } = body

    if (!reporter_name||!location_name||!species_name)
      return c.json({ success: false, error: '필수 항목을 입력해주세요.' }, 400)

    // 승인 회원 확인
    if (user_id) {
      const u = await c.env.DB.prepare('SELECT role FROM users WHERE id=?').bind(user_id).first() as any
      if (!u || u.role !== 'approved')
        return c.json({ success: false, error: '승인된 회원만 기록을 등록할 수 있습니다.' }, 403)
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO monitoring_records
        (user_id,reporter_name,location_name,region,species_name,condition_status,latitude,longitude,special_notes,survey_date,survey_time,weather,eco_type)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(user_id||null, reporter_name, location_name, region||null, species_name,
      condition_status, latitude||null, longitude||null, special_notes||null,
      survey_date||null, survey_time||null, weather||null, eco_type||null).run()

    const recordId = result.meta.last_row_id
    // 사진 저장 - 에러가 나도 기록은 유지, 사진만 건너뜀
    for (let i=0; i<photos.slice(0,10).length; i++) {
      try {
        const photoData = photos[i].data || ''
        // 사진 데이터가 너무 크면 건너뜀 (D1 행 크기 제한 대비, 약 1MB)
        if (photoData.length > 1200000) continue
        await c.env.DB.prepare(
          'INSERT INTO monitoring_photos(record_id,photo_data,photo_name,photo_order)VALUES(?,?,?,?)'
        ).bind(recordId, photoData, photos[i].name||`photo_${i+1}`, i).run()
      } catch(photoErr) {
        // 사진 저장 실패해도 기록 자체는 성공으로 처리
        console.error(`사진 ${i+1} 저장 실패:`, photoErr)
      }
    }
    if (reinspection) {
      const regType = reinspection.registration_type || '신규등록'
      const resultsArr = Array.isArray(reinspection.results) ? reinspection.results : []
      const resultsStr = resultsArr.join(',')
      await c.env.DB.prepare(`INSERT OR REPLACE INTO reinspection_records
        (record_id,registration_type,results,reinspection_memo)
        VALUES(?,?,?,?)`)
        .bind(recordId, regType, resultsStr, reinspection.reinspection_memo||null).run()
    }
    if (checklist) {
      await c.env.DB.prepare(`INSERT OR REPLACE INTO ecology_checklist
        (record_id,vegetation_damage,invasive_species,environment_mgmt,trail_condition,photo_record,guide_facility)
        VALUES(?,?,?,?,?,?,?)`)
        .bind(recordId, checklist.vegetation_damage||'양호', checklist.invasive_species||'없음',
          checklist.environment_mgmt||'없음', checklist.trail_condition||'양호',
          checklist.photo_record||'완료', checklist.guide_facility||'양호').run()
    }
    return c.json({ success: true, data: { id: recordId } }, 201)
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

api.put('/records/:id', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = c.req.param('id')
    const body = await c.req.json()
    const { reporter_name,location_name,region,species_name,condition_status,
      latitude,longitude,special_notes,updated_by,
      survey_date=null,survey_time=null,weather=null,eco_type=null,
      reinspection=null,checklist=null } = body

    const existing = await c.env.DB.prepare('SELECT id FROM monitoring_records WHERE id=?').bind(id).first()
    if (!existing) return c.json({ success: false, error: '기록을 찾을 수 없습니다.' }, 404)

    await c.env.DB.prepare(`UPDATE monitoring_records SET
      reporter_name=?,location_name=?,region=?,species_name=?,condition_status=?,
      latitude=?,longitude=?,special_notes=?,
      survey_date=?,survey_time=?,weather=?,eco_type=?,
      updated_at=CURRENT_TIMESTAMP,updated_by=?
      WHERE id=?`)
      .bind(reporter_name,location_name,region||null,species_name,condition_status,
        latitude||null,longitude||null,special_notes||null,
        survey_date||null,survey_time||null,weather||null,eco_type||null,
        updated_by||null,id).run()

    if (reinspection) {
      const regType = reinspection.registration_type || '신규등록'
      const resultsArr = Array.isArray(reinspection.results) ? reinspection.results : []
      const resultsStr = resultsArr.join(',')
      await c.env.DB.prepare(`INSERT OR REPLACE INTO reinspection_records
        (record_id,registration_type,results,reinspection_memo,updated_at)
        VALUES(?,?,?,?,CURRENT_TIMESTAMP)`)
        .bind(id, regType, resultsStr, reinspection.reinspection_memo||null).run()
    }
    if (checklist) {
      await c.env.DB.prepare(`INSERT OR REPLACE INTO ecology_checklist
        (record_id,vegetation_damage,invasive_species,environment_mgmt,trail_condition,photo_record,guide_facility,updated_at)
        VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
        .bind(id,checklist.vegetation_damage||'양호',checklist.invasive_species||'없음',
          checklist.environment_mgmt||'없음',checklist.trail_condition||'양호',
          checklist.photo_record||'완료',checklist.guide_facility||'양호').run()
    }
    return c.json({ success: true })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

api.delete('/records/:id', async (c) => {
  try {
    await initDB(c.env.DB)
    await c.env.DB.prepare('DELETE FROM monitoring_records WHERE id=?').bind(c.req.param('id')).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ─────────────────────────────────────────
// ADMIN - 관리자 로그인
// ─────────────────────────────────────────
api.post('/admin/login', async (c) => {
  try {
    await initDB(c.env.DB)
    const { username, password } = await c.req.json()
    const u = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username=? AND password_hash=? AND is_admin=1'
    ).bind(username, password).first() as any
    if (!u) return c.json({ success: false, error: '관리자 계정이 아니거나 비밀번호가 틀렸습니다.' }, 401)
    await c.env.DB.prepare('UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?').bind(u.id).run()
    return c.json({ success: true, data: { username: u.username, full_name: u.full_name } })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ADMIN - 회원 목록
api.get('/admin/users', async (c) => {
  try {
    await initDB(c.env.DB)
    const { role, region } = c.req.query()
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (role) { where += ' AND role=?'; params.push(role) }
    if (region) { where += ' AND region=?'; params.push(region) }
    const { results } = await c.env.DB.prepare(`
      SELECT u.*, (SELECT COUNT(*) FROM monitoring_records r WHERE r.user_id=u.id) as record_count
      FROM users u ${where} ORDER BY created_at DESC
    `).bind(...params).all()
    return c.json({ success: true, data: results })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ADMIN - 회원 승인
api.put('/admin/users/:id/approve', async (c) => {
  try {
    await initDB(c.env.DB)
    const { approved_by } = await c.req.json()
    await c.env.DB.prepare(`UPDATE users SET role='approved', approved_at=CURRENT_TIMESTAMP,
      approved_by=?, reject_reason=NULL, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(approved_by||'admin', c.req.param('id')).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ADMIN - 회원 거절
api.put('/admin/users/:id/reject', async (c) => {
  try {
    await initDB(c.env.DB)
    const { reason } = await c.req.json()
    await c.env.DB.prepare(`UPDATE users SET role='rejected', reject_reason=?,
      updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .bind(reason||'', c.req.param('id')).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ADMIN - 회원 정지/복구
api.put('/admin/users/:id/suspend', async (c) => {
  try {
    await initDB(c.env.DB)
    const { suspend } = await c.req.json()
    const role = suspend ? 'suspended' : 'approved'
    await c.env.DB.prepare("UPDATE users SET role=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(role, c.req.param('id')).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ADMIN - 회원 권한(관리자) 설정
api.put('/admin/users/:id/role', async (c) => {
  try {
    await initDB(c.env.DB)
    const { is_admin } = await c.req.json()
    await c.env.DB.prepare("UPDATE users SET is_admin=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .bind(is_admin?1:0, c.req.param('id')).run()
    return c.json({ success: true })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ADMIN - 통계
api.get('/admin/stats', async (c) => {
  try {
    await initDB(c.env.DB)
    const { from, to } = c.req.query()
    let dateWhere = 'WHERE 1=1'
    const dp: any[] = []
    if (from) { dateWhere += ' AND date(created_at)>=?'; dp.push(from) }
    if (to)   { dateWhere += ' AND date(created_at)<=?'; dp.push(to) }

    // 전체 요약
    const summary = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_records,
        SUM(CASE WHEN condition_status='양호' THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN condition_status='보통' THEN 1 ELSE 0 END) as normal,
        SUM(CASE WHEN condition_status='불량' THEN 1 ELSE 0 END) as bad,
        SUM(CASE WHEN condition_status='고사' THEN 1 ELSE 0 END) as dead
      FROM monitoring_records ${dateWhere}
    `).bind(...dp).first()

    // 회원 통계
    const userStats = await c.env.DB.prepare(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN role='pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN role='approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN role='rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN role='suspended' THEN 1 ELSE 0 END) as suspended
      FROM users WHERE is_admin=0
    `).first()

    // 지역별 기록
    const { results: byRegion } = await c.env.DB.prepare(`
      SELECT COALESCE(region,'미지정') as region, COUNT(*) as count
      FROM monitoring_records ${dateWhere} GROUP BY region ORDER BY count DESC
    `).bind(...dp).all()

    // 사용자별 기록 (상위 10)
    const { results: byUser } = await c.env.DB.prepare(`
      SELECT r.reporter_name, u.full_name, u.organization,
        COUNT(*) as count
      FROM monitoring_records r LEFT JOIN users u ON r.user_id=u.id
      ${dateWhere} GROUP BY r.reporter_name ORDER BY count DESC LIMIT 10
    `).bind(...dp).all()

    // 일별 기록 (최근 30일)
    const { results: byDate } = await c.env.DB.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM monitoring_records
      WHERE created_at >= date('now','-30 days')
      GROUP BY date(created_at) ORDER BY date
    `).all()

    // 종별 통계 (상위 10)
    const { results: bySpecies } = await c.env.DB.prepare(`
      SELECT species_name, COUNT(*) as count,
        SUM(CASE WHEN condition_status='양호' THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN condition_status='불량' THEN 1 ELSE 0 END) as bad
      FROM monitoring_records ${dateWhere}
      GROUP BY species_name ORDER BY count DESC LIMIT 10
    `).bind(...dp).all()

    // 월별 기록
    const { results: byMonth } = await c.env.DB.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM monitoring_records GROUP BY month ORDER BY month DESC LIMIT 12
    `).all()

    // 사진 통계
    const photoStats = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM monitoring_photos'
    ).first()

    // 지도 데이터 (좌표 있는 기록)
    const { results: mapData } = await c.env.DB.prepare(`
      SELECT id, species_name, location_name, condition_status, latitude, longitude,
        reporter_name, created_at
      FROM monitoring_records
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL ${dateWhere.replace('WHERE 1=1','').replace('WHERE','AND')}
    `).bind(...dp).all()

    return c.json({
      success: true, data: { summary, userStats, byRegion, byUser, byDate, bySpecies, byMonth, photoStats, mapData }
    })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

// ADMIN - 전체 데이터 내보내기 (CSV용)
api.get('/admin/export', async (c) => {
  try {
    await initDB(c.env.DB)
    const { from, to } = c.req.query()
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (from) { where += ' AND date(r.created_at)>=?'; params.push(from) }
    if (to)   { where += ' AND date(r.created_at)<=?'; params.push(to) }

    const { results } = await c.env.DB.prepare(`
      SELECT r.id, r.reporter_name, u.full_name as member_name, u.organization,
        r.location_name, r.region, r.species_name, r.condition_status,
        r.latitude, r.longitude, r.special_notes,
        ri.registration_type, ri.results, ri.reinspection_memo,
        ec.vegetation_damage, ec.invasive_species, ec.environment_mgmt,
        ec.trail_condition, ec.photo_record, ec.guide_facility,
        r.created_at, r.updated_at, r.updated_by,
        COUNT(p.id) as photo_count
      FROM monitoring_records r
      LEFT JOIN users u ON r.user_id=u.id
      LEFT JOIN reinspection_records ri ON r.id=ri.record_id
      LEFT JOIN ecology_checklist ec ON r.id=ec.record_id
      LEFT JOIN monitoring_photos p ON r.id=p.record_id
      ${where} GROUP BY r.id ORDER BY r.created_at DESC
    `).bind(...params).all()

    return c.json({ success: true, data: results, total: results.length })
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500) }
})

export default api
