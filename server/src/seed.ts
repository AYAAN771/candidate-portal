import bcrypt from 'bcrypt'
import { Candidate, db, Skill, STATUSES, User } from './db'

const skills = ['Angular', 'React', 'Node.js', 'TypeScript', 'MySQL', 'AWS', 'Docker', 'Python', 'Java', 'Figma']
const firstNames = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Kabir', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Isha']
const lastNames = ['Sharma', 'Patel', 'Khan', 'Iyer', 'Reddy', 'Gupta', 'Nair']

async function seed() {
  await db.sync({ force: true })

  // one transaction: either all the demo data goes in or none of it does
  await db.transaction(async (transaction) => {
    await User.bulkCreate(
      [
        { email: 'admin@portal.dev', password: await bcrypt.hash('Admin@123', 10), role: 'admin' },
        { email: 'recruiter@portal.dev', password: await bcrypt.hash('Recruiter@123', 10), role: 'recruiter' },
      ],
      { transaction },
    )
    const skillRows = await Skill.bulkCreate(
      skills.map((name) => ({ name })),
      { transaction },
    )

    for (let i = 0; i < 45; i++) {
      const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`
      const status = STATUSES[i % STATUSES.length]
      const expectedSalary = 4 + (i % 12) * 1.5

      const candidate = await Candidate.create(
        {
          name,
          email: `${name.toLowerCase().replace(' ', '.')}@mail.com`,
          phone: String(9876500000 + i * 1379),
          status,
          experience: i % 12,
          expectedSalary,
          assignedSalary: status === 'offered' || status === 'hired' ? expectedSalary + 1.5 : null,
          createdAt: new Date(Date.now() - i * 31 * 3600 * 1000),
        },
        { transaction },
      )
      await candidate.setSkills(
        skillRows.filter((_, j) => (i + j) % 4 === 0),
        { transaction },
      )
    }
  })

  console.log('Seeded 2 users, 10 skills and 45 candidates')
  await db.close()
}

seed()
