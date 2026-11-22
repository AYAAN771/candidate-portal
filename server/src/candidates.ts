import { Router } from 'express'
import { Op } from 'sequelize'
import { z } from 'zod'
import { adminOnly, requireLogin } from './auth'
import { Candidate, CandidateSkill, db, Skill, STATUSES } from './db'

const router = Router()

// people type numbers like "+91 98765-43210", "098765 43210" or "0091 9876543210"
function toTenDigits(phone: string) {
  let digits = phone.replace(/[\s\-+()]/g, '')

  for (const prefix of ['0091', '091', '91', '0']) {
    if (digits.length === prefix.length + 10 && digits.startsWith(prefix)) {
      digits = digits.slice(prefix.length)
    }
  }
  return digits
}

const phone = z
  .string()
  .transform(toTenDigits)
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'))

const salary = z.number().min(0).max(9999.99).multipleOf(0.01).nullable().default(null)

const candidateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  phone,
  status: z.enum(STATUSES),
  experience: z.number().int().min(0).max(60),
  expectedSalary: salary,
  assignedSalary: salary,
  skillIds: z.array(z.number().int().positive()).default([]),
})

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.enum(STATUSES).optional(),
  skillId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['name', 'experience', 'createdAt']).default('createdAt'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

const withSkills = { model: Skill, as: 'skills', attributes: ['id', 'name'], through: { attributes: [] } }

const findOne = (id: number | string) => Candidate.findByPk(id, { include: withSkills })

// create (id = null) or update, all or nothing
async function save(id: number | null, body: unknown) {
  const { skillIds, ...data } = candidateSchema.parse(body)

  const savedId = await db.transaction(async (transaction) => {
    const candidate = id
      ? await Candidate.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
      : Candidate.build()
    if (!candidate) return null

    await candidate.set(data).save({ transaction })
    await candidate.setSkills(skillIds, { transaction })
    return candidate.id
  })

  return savedId && findOne(savedId)
}

router.get('/', async (req, res) => {
  const q = listSchema.parse(req.query)
  const where: any = {}

  if (q.status) where.status = q.status
  if (q.search) where[Op.or] = [{ name: { [Op.like]: `%${q.search}%` } }, { email: { [Op.like]: `%${q.search}%` } }]
  if (q.skillId) {
    const links = await CandidateSkill.findAll({ where: { skillId: q.skillId } })
    where.id = links.map((l) => l.candidateId)
  }

  const { rows, count } = await Candidate.findAndCountAll({
    where,
    include: withSkills,
    order: [[q.sortBy, q.order], ['id', 'ASC']],
    limit: q.limit,
    offset: (q.page - 1) * q.limit,
    distinct: true,
  })

  res.json({ data: rows, meta: { totalItems: count, totalPages: Math.ceil(count / q.limit), currentPage: q.page } })
})

router.get('/stats', async (_req, res) => {
  const rows = await Candidate.count({ group: ['status'] })
  res.json(Object.fromEntries(rows.map((r) => [String(r.status), r.count])))
})

router.get('/deleted', requireLogin, adminOnly, async (_req, res) => {
  res.json(
    await Candidate.findAll({
      paranoid: false,
      where: { deletedAt: { [Op.ne]: null } },
      order: [['deletedAt', 'DESC']],
    }),
  )
})

router.post('/:id/restore', requireLogin, adminOnly, async (req, res) => {
  const restored = await db.transaction(async (transaction) => {
    const candidate = await Candidate.findByPk(Number(req.params.id), {
      paranoid: false,
      transaction,
      lock: transaction.LOCK.UPDATE,
    })
    if (!candidate?.deletedAt) return null

    await candidate.restore({ transaction })
    return candidate
  })

  if (!restored) return res.status(404).json({ message: 'Nothing to restore' })
  res.json(await findOne(restored.id))
})

router.get('/:id', async (req, res) => {
  const candidate = await findOne(req.params.id)
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' })
  res.json(candidate)
})

router.post('/', requireLogin, async (req, res) => {
  res.status(201).json(await save(null, req.body))
})

router.put('/:id', requireLogin, async (req, res) => {
  const candidate = await save(Number(req.params.id), req.body)
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' })
  res.json(candidate)
})

router.delete('/:id', requireLogin, adminOnly, async (req, res) => {
  const deleted = await Candidate.destroy({ where: { id: Number(req.params.id) } })
  if (!deleted) return res.status(404).json({ message: 'Candidate not found' })
  res.status(204).end()
})

export default router
