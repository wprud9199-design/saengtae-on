import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const api = new Hono<{ Bindings: Bindings }>()

api.use('/*', cors())

// DB 초기화 (테이블 생성) - batch 방식으로 각 SQL을 개별 실행
let dbInitialized = false
async function initDB(db: D1Database) {
  if (dbInitialized) return
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS monitoring_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_name TEXT NOT NULL,
      location_name TEXT NOT NULL,
      species_name TEXT NOT NULL,
      condition_status TEXT NOT NULL DEFAULT '양호',
      latitude REAL,
      longitude REAL,
      special_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      updated_by TEXT
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
    db.prepare(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES ('admin', 'admin1234')`)
  ])
  dbInitialized = true
}

// ========================
// 모니터링 기록 API
// ========================

// 기록 목록 조회
api.get('/records', async (c) => {
  try {
    await initDB(c.env.DB)
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, 
        COUNT(p.id) as photo_count
      FROM monitoring_records r
      LEFT JOIN monitoring_photos p ON r.id = p.record_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `).all()
    return c.json({ success: true, data: results })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// 기록 단건 조회 (사진 포함)
api.get('/records/:id', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = c.req.param('id')
    const record = await c.env.DB.prepare(
      'SELECT * FROM monitoring_records WHERE id = ?'
    ).bind(id).first()

    if (!record) return c.json({ success: false, error: '기록을 찾을 수 없습니다.' }, 404)

    const { results: photos } = await c.env.DB.prepare(
      'SELECT * FROM monitoring_photos WHERE record_id = ? ORDER BY photo_order'
    ).bind(id).all()

    const reinspection = await c.env.DB.prepare(
      'SELECT * FROM reinspection_records WHERE record_id = ?'
    ).bind(id).first()

    const checklist = await c.env.DB.prepare(
      'SELECT * FROM ecology_checklist WHERE record_id = ?'
    ).bind(id).first()

    return c.json({ success: true, data: { ...record, photos, reinspection, checklist } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// 기록 생성
api.post('/records', async (c) => {
  try {
    await initDB(c.env.DB)
    const body = await c.req.json()
    const {
      reporter_name, location_name, species_name,
      condition_status = '양호', latitude, longitude, special_notes,
      photos = [],
      reinspection = null,
      checklist = null
    } = body

    if (!reporter_name || !location_name || !species_name) {
      return c.json({ success: false, error: '필수 항목을 입력해주세요.' }, 400)
    }

    // 기록 삽입
    const result = await c.env.DB.prepare(`
      INSERT INTO monitoring_records 
        (reporter_name, location_name, species_name, condition_status, latitude, longitude, special_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(reporter_name, location_name, species_name, condition_status,
      latitude || null, longitude || null, special_notes || null
    ).run()

    const recordId = result.meta.last_row_id

    // 사진 저장 (최대 10장)
    const maxPhotos = photos.slice(0, 10)
    for (let i = 0; i < maxPhotos.length; i++) {
      const photo = maxPhotos[i]
      await c.env.DB.prepare(`
        INSERT INTO monitoring_photos (record_id, photo_data, photo_name, photo_order)
        VALUES (?, ?, ?, ?)
      `).bind(recordId, photo.data, photo.name || `photo_${i + 1}`, i).run()
    }

    // 재점검 사항 저장
    if (reinspection) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO reinspection_records 
          (record_id, removal_done, no_recurrence, spread_check, reinspection_memo, reinspection_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        recordId,
        reinspection.removal_done ? 1 : 0,
        reinspection.no_recurrence ? 1 : 0,
        reinspection.spread_check ? 1 : 0,
        reinspection.reinspection_memo || null,
        reinspection.reinspection_date || null
      ).run()
    }

    // 체크리스트 저장
    if (checklist) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO ecology_checklist 
          (record_id, vegetation_damage, invasive_species, environment_mgmt, 
           trail_condition, photo_record, guide_facility)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        recordId,
        checklist.vegetation_damage || '양호',
        checklist.invasive_species || '없음',
        checklist.environment_mgmt || '없음',
        checklist.trail_condition || '양호',
        checklist.photo_record || '완료',
        checklist.guide_facility || '양호'
      ).run()
    }

    return c.json({ success: true, data: { id: recordId } }, 201)
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// 기록 수정 (관리자)
api.put('/records/:id', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = c.req.param('id')
    const body = await c.req.json()
    const {
      reporter_name, location_name, species_name,
      condition_status, latitude, longitude, special_notes,
      updated_by,
      reinspection = null,
      checklist = null
    } = body

    // 존재 확인
    const existing = await c.env.DB.prepare(
      'SELECT id FROM monitoring_records WHERE id = ?'
    ).bind(id).first()
    if (!existing) return c.json({ success: false, error: '기록을 찾을 수 없습니다.' }, 404)

    // 기록 업데이트
    await c.env.DB.prepare(`
      UPDATE monitoring_records SET
        reporter_name = ?,
        location_name = ?,
        species_name = ?,
        condition_status = ?,
        latitude = ?,
        longitude = ?,
        special_notes = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
    `).bind(
      reporter_name, location_name, species_name,
      condition_status, latitude || null, longitude || null,
      special_notes || null, updated_by || null, id
    ).run()

    // 재점검 사항 업데이트
    if (reinspection) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO reinspection_records 
          (record_id, removal_done, no_recurrence, spread_check, reinspection_memo, reinspection_date, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        id,
        reinspection.removal_done ? 1 : 0,
        reinspection.no_recurrence ? 1 : 0,
        reinspection.spread_check ? 1 : 0,
        reinspection.reinspection_memo || null,
        reinspection.reinspection_date || null
      ).run()
    }

    // 체크리스트 업데이트
    if (checklist) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO ecology_checklist 
          (record_id, vegetation_damage, invasive_species, environment_mgmt,
           trail_condition, photo_record, guide_facility, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        id,
        checklist.vegetation_damage || '양호',
        checklist.invasive_species || '없음',
        checklist.environment_mgmt || '없음',
        checklist.trail_condition || '양호',
        checklist.photo_record || '완료',
        checklist.guide_facility || '양호'
      ).run()
    }

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// 기록 삭제 (관리자)
api.delete('/records/:id', async (c) => {
  try {
    await initDB(c.env.DB)
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM monitoring_records WHERE id = ?').bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ========================
// 관리자 로그인
// ========================
api.post('/admin/login', async (c) => {
  try {
    await initDB(c.env.DB)
    const { username, password } = await c.req.json()
    const admin = await c.env.DB.prepare(
      'SELECT * FROM admins WHERE username = ? AND password_hash = ?'
    ).bind(username, password).first()

    if (!admin) return c.json({ success: false, error: '아이디 또는 비밀번호가 틀렸습니다.' }, 401)

    return c.json({ success: true, data: { username: admin.username } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

export default api
