const request = require('supertest')
const app = require('./app')
const db = require('./db-config')

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('tasks').del()
})

afterAll(async () => {
  await db.destroy()
})

describe('Tasks API', () => {
  test('GET /api/tasks returns an empty list', async () => {
    const response = await request(app).get('/api/tasks')
    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test('POST /api/tasks creates a task and trims its title', async () => {
    const response = await request(app).post('/api/tasks').send({ title: '  Learn Knex  ', description: 'migrations' })
    expect(response.status).toBe(201)
    expect(response.body.title).toBe('Learn Knex')
    expect(response.body.completed).toBe(false)
    expect(response.body.description).toBe('migrations')
  })

  test('POST /api/tasks defaults an omitted description and completion state', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 'Write tests' })
    expect(response.status).toBe(201)
    expect(response.body.description).toBeNull()
    expect(response.body.completed).toBe(false)
  })

  test('POST /api/tasks rejects an empty title', async () => {
    const response = await request(app).post('/api/tasks').send({ title: '   ' })
    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/title/i)
  })

  test('POST /api/tasks rejects a non-boolean completed value', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 'Invalid task', completed: 'yes' })
    expect(response.status).toBe(400)
  })

  test('GET /api/tasks lists created tasks in id order', async () => {
    await request(app).post('/api/tasks').send({ title: 'First' })
    await request(app).post('/api/tasks').send({ title: 'Second' })
    const response = await request(app).get('/api/tasks')
    expect(response.status).toBe(200)
    expect(response.body.map((task) => task.title)).toEqual(['First', 'Second'])
  })

  test('GET /api/tasks/:id returns a task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Find me' })
    const response = await request(app).get(`/api/tasks/${created.body.id}`)
    expect(response.status).toBe(200)
    expect(response.body.title).toBe('Find me')
  })

  test('GET /api/tasks/:id returns 404 for a missing task', async () => {
    const response = await request(app).get('/api/tasks/999')
    expect(response.status).toBe(404)
  })

  test('GET /api/tasks/:id rejects an invalid id', async () => {
    const response = await request(app).get('/api/tasks/nope')
    expect(response.status).toBe(400)
  })

  test('PATCH /api/tasks/:id updates supplied fields', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Old title' })
    const response = await request(app).patch(`/api/tasks/${created.body.id}`).send({ title: '  New title ', completed: true })
    expect(response.status).toBe(200)
    expect(response.body.title).toBe('New title')
    expect(response.body.completed).toBe(true)
  })

  test('PATCH /api/tasks/:id rejects an empty update', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Keep me' })
    const response = await request(app).patch(`/api/tasks/${created.body.id}`).send({})
    expect(response.status).toBe(400)
  })

  test('PATCH /api/tasks/:id rejects unknown fields', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Keep me' })
    const response = await request(app).patch(`/api/tasks/${created.body.id}`).send({ admin: true })
    expect(response.status).toBe(400)
  })

  test('PATCH /api/tasks/:id returns 404 when the task does not exist', async () => {
    const response = await request(app).patch('/api/tasks/999').send({ completed: true })
    expect(response.status).toBe(404)
  })

  test('DELETE /api/tasks/:id removes a task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'Delete me' })
    const response = await request(app).delete(`/api/tasks/${created.body.id}`)
    expect(response.status).toBe(204)
    expect(await db('tasks').where({ id: created.body.id }).first()).toBeUndefined()
  })

  test('DELETE /api/tasks/:id returns 404 for an unknown task', async () => {
    const response = await request(app).delete('/api/tasks/999')
    expect(response.status).toBe(404)
  })

  test('unknown routes return JSON 404', async () => {
    const response = await request(app).get('/unknown')
    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Route not found.')
  })
})
