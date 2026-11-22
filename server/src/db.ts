import { DataTypes, Model, Sequelize, Transaction } from 'sequelize'
import { env } from './env'

export const db = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
  dialectOptions: { decimalNumbers: true },
  // InnoDB's default, written down so nobody has to guess
  isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
})

export const STATUSES = ['applied', 'interviewing', 'offered', 'hired', 'rejected'] as const

type Row = Model & Record<string, any>

export const User = db.define<Row>('user', {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'recruiter'), allowNull: false, defaultValue: 'recruiter' },
})

export const Candidate = db.define<Row>(
  'candidate',
  {
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'applied' },
    experience: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    phone: DataTypes.STRING(10),
    expectedSalary: DataTypes.DECIMAL(6, 2),
    assignedSalary: DataTypes.DECIMAL(6, 2),
  },
  { paranoid: true, indexes: [{ fields: ['status'] }, { fields: ['createdAt'] }] },
)

export const Skill = db.define<Row>(
  'skill',
  { name: { type: DataTypes.STRING(50), allowNull: false, unique: true } },
  { timestamps: false },
)

export const CandidateSkill = db.define<Row>(
  'candidate_skill',
  {
    candidateId: { type: DataTypes.INTEGER, primaryKey: true },
    skillId: { type: DataTypes.INTEGER, primaryKey: true },
  },
  { timestamps: false, indexes: [{ fields: ['skillId'] }] },
)

Candidate.belongsToMany(Skill, { through: { model: CandidateSkill, unique: false }, as: 'skills' })
