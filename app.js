const express = require('express')
const db = require('./db-config')

const app = express()
app.use(express.json())

function parseId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function serializeTask(task) {
  if (!task) return task
  return { ...task, completed: Boolean(task.completed) }
}

function validTaskFields(body, { requireTitle = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Body must be a JSON object.'
  const allowed = ['title', 'description', 'completed']
  if (Object.keys(body).some((key) => !allowed.includes(key))) return 'Only title, description and completed are allowed.'
  if (requireTitle && (typeof body.title !== 'string' || !body.title.trim())) return 'A non-empty title is required.'
  if ('title' in body && (typeof body.title !== 'string' || !body.title.trim())) return 'Title must be a non-empty string.'
  if ('description' in body && body.description !== null && typeof body.description !== 'string') return 'Description must be a string or null.'
  if ('completed' in body && typeof body.completed !== 'boolean') return 'Completed must be a boolean.'
  return null
}

app.get('/api/tasks', async (_req, res, next) => {
  try {
    const tasks = await db('tasks').select('*').orderBy('id', 'asc')
    res.status(200).json(tasks.map(serializeTask))
  } catch (error) {
    next(error)
  }
})

app.post('/api/tasks', async (req, res, next) => {
  const validationError = validTaskFields(req.body, { requireTitle: true })
  if (validationError) return res.status(400).json({ error: validationError })

  try {
    const task = {
      title: req.body.title.trim(),
      description: req.body.description ?? null,
      completed: req.body.completed ?? false,
    }
    const [id] = await db('tasks').insert(task)
    const created = await db('tasks').where({ id }).first()
    return res.status(201).json(serializeTask(created))
  } catch (error) {
    return next(error)
  }
})

app.get('/api/tasks/:id', async (req, res, next) => {
  const id = parseId(req.params.id)
  if (id === null) return res.status(400).json({ error: 'Task id must be a positive integer.' })

  try {
    const task = await db('tasks').where({ id }).first()
    if (!task) return res.status(404).json({ error: 'Task not found.' })
    return res.status(200).json(serializeTask(task))
  } catch (error) {
    return next(error)
  }
})

app.patch('/api/tasks/:id', async (req, res, next) => {
  const id = parseId(req.params.id)
  if (id === null) return res.status(400).json({ error: 'Task id must be a positive integer.' })
  const validationError = validTaskFields(req.body)
  if (validationError) return res.status(400).json({ error: validationError })
  if (Object.keys(req.body).length === 0) return res.status(400).json({ error: 'At least one task field is required.' })

  try {
    const update = { ...req.body }
    if (typeof update.title === 'string') update.title = update.title.trim()
    const changed = await db('tasks').where({ id }).update(update)
    if (!changed) return res.status(404).json({ error: 'Task not found.' })
    const updated = await db('tasks').where({ id }).first()
    return res.status(200).json(serializeTask(updated))
  } catch (error) {
    return next(error)
  }
})

app.delete('/api/tasks/:id', async (req, res, next) => {
  const id = parseId(req.params.id)
  if (id === null) return res.status(400).json({ error: 'Task id must be a positive integer.' })

  try {
    const deleted = await db('tasks').where({ id }).del()
    if (!deleted) return res.status(404).json({ error: 'Task not found.' })
    return res.status(204).end()
  } catch (error) {
    return next(error)
  }
})

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }))
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Invalid JSON body.' })
  return res.status(500).json({ error: 'Internal server error.' })
})

module.exports = app
