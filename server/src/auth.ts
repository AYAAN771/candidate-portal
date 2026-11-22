import bcrypt from 'bcrypt'
import { RequestHandler, Router } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User } from './db'
import { env } from './env'

const router = Router()

router.post('/login', async (req, res) => {
  const { email, password } = z.object({ email: z.email(), password: z.string().min(1) }).parse(req.body)
  const user = await User.findOne({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  const token = jwt.sign({ sub: String(user.id), email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
  res.json({ token })
})

export const requireLogin: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] ?? ''
  try {
    res.locals.user = jwt.verify(token, env.JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'Please log in again' })
  }
  next()
}

export const adminOnly: RequestHandler = (_req, res, next) => {
  if (res.locals.user?.role === 'admin') return next()
  res.status(403).json({ message: 'Only admins can do that' })
}

export default router
