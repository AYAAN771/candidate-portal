import 'dotenv/config'
import { z } from 'zod'

export const env = z
  .object({
    PORT: z.coerce.number().default(3000),
    DB_HOST: z.string().default('127.0.0.1'),
    DB_PORT: z.coerce.number().default(3306),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASS: z.string().default(''),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.coerce.number().default(3600),
    CLIENT_URL: z.string().default('http://localhost:4200'),
  })
  .parse(process.env)
