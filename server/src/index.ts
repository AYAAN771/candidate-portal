import cors from 'cors'
import express, { ErrorRequestHandler } from 'express'
import helmet from 'helmet'
import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize'
import { ZodError } from 'zod'
import auth from './auth'
import candidates from './candidates'
import { db, Skill } from './db'
import { env } from './env'

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CLIENT_URL }))
app.use(express.json())

app.use('/api/auth', auth)
app.use('/api/candidates', candidates)
app.get('/api/skills', async (_req, res) => {
  res.json(await Skill.findAll({ order: [['name', 'ASC']] }))
})

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ message: 'Validation failed', errors: err.issues })
  if (err instanceof UniqueConstraintError) return res.status(409).json({ message: 'Email already exists' })
  if (err instanceof ForeignKeyConstraintError) return res.status(400).json({ message: 'Some of those skills do not exist' })
  console.error(err)
  res.status(500).json({ message: 'Something went wrong' })
}
app.use(onError)

db.sync().then(() => {
  app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`))
})
