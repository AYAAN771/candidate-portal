# Candidate Portal

Small recruiting app. Anyone can browse candidates, recruiters can add and edit them, admins can also delete.

Angular 22 + Tailwind on the front, Express 5 + Sequelize + MySQL on the back.

## Running it

You need Node 22+ and MySQL 8. No MySQL? `docker compose up -d` starts one.

```bash
# api
cd server
cp .env.example .env   # put a long random string in JWT_SECRET
npm install
npm run seed           # wipes the db and adds demo data
npm run dev            # localhost:3000

# client, in another terminal
cd client
npm install
npm start              # localhost:4200
```

Using your own MySQL? Make an empty `candidate_portal` db and fix the DB\_\* values in `.env`.

## Logins

The seed adds 45 candidates, 10 skills and two users:

| Role      | Email                | Password      |
| --------- | -------------------- | ------------- |
| Recruiter | recruiter@portal.dev | Recruiter@123 |
| Admin     | admin@portal.dev     | Admin@123     |

There are buttons for both on the login page so you don't have to type them.

## API

| Method | Route                       | Who       |
| ------ | --------------------------- | --------- |
| POST   | /api/auth/login             | anyone    |
| GET    | /api/skills                 | anyone    |
| GET    | /api/candidates             | anyone    |
| GET    | /api/candidates/stats       | anyone    |
| GET    | /api/candidates/:id         | anyone    |
| POST   | /api/candidates             | logged in |
| PUT    | /api/candidates/:id         | logged in |
| DELETE | /api/candidates/:id         | admin     |
| GET    | /api/candidates/deleted     | admin     |
| POST   | /api/candidates/:id/restore | admin     |

The list takes `page`, `limit`, `search`, `status`, `skillId`, `sortBy` (name, experience, createdAt) and `order` (ASC, DESC) and returns `{ data, meta: { totalItems, totalPages, currentPage } }`.

Stats is just a count per status: `{ "applied": 9, "interviewing": 9, ... }`

Delete is a soft delete. The candidate gets a `deletedAt` and disappears from the list, and admins can bring them back from "Recently deleted".

Body for create and update:

```json
{
  "name": "Jane Doe",
  "email": "jane@mail.com",
  "phone": "+91 98765 43210",
  "status": "offered",
  "experience": 3,
  "expectedSalary": 12.5,
  "assignedSalary": 14,
  "skillIds": [1, 4]
}
```

Phone is saved as 10 digits (`9876543210`). A leading `+91`, `91` or `0` is stripped, then it has to match `^[6-9]\d{9}$`. Salaries are in LPA, up to 2 decimals, and both are optional.

## Where stuff is

```
server/src
  index.ts        express setup + error handler
  db.ts           connection and models
  auth.ts         login route, requireLogin and adminOnly
  candidates.ts   candidate routes
  env.ts          env vars, checked with zod
  seed.ts

client/src/app
  api.ts          types and http calls
  auth.ts         auth service, interceptor, guards
  animations.ts   the appear directive + fadeOut
  icon.ts         the six icons we use
  numeric.ts      filters what you can type in number fields
  toast.ts        toast messages (with Undo)
  pages/          login, list, add/edit form, recently deleted
```

## Notes

Every route parses its input with zod. If it's bad, zod throws and the error handler at the bottom of `index.ts` sends a 400. Duplicate emails become a 409 and unknown skill ids a 400, same place.

Candidates and skills are many-to-many through `candidate_skills` (composite key, cascade on delete, index on skillId).

### ACID

- **Atomic**: saving a candidate (the row plus their skills) and restoring one each run in a single transaction. One bad skill id and the whole save is rolled back. The seed is one transaction too.
- **Consistent**: zod checks the input, then the database has the final say with NOT NULL, ENUM, UNIQUE email and foreign keys.
- **Isolated**: transactions run at REPEATABLE READ (InnoDB's default, set explicitly in `db.ts`). An edit locks the candidate's row (`SELECT ... FOR UPDATE`) until it commits, so two people saving the same candidate at once queue up instead of mixing their changes.
- **Durable**: InnoDB writes every commit to its log before answering, so a saved candidate survives a crash or restart.

The list pulls candidates and their skills in one query with `include`, so there's no N+1. The skill filter grabs matching ids from the join table first. If you put the `where` on the include you'd only get back the skill you filtered by, not all of them.

On the front end it's mostly signals. The list page is an `httpResource` that reads search, status, sort and page, so changing any of them refetches and cancels the old request. `linkedSignal` puts you back on page 1 when a filter changes.

The design is meant to look like a normal internal tool: light theme, system font, one blue for actions, a plain table. All styling is Tailwind classes, there's no component css. The few animations (dialog, toast, page fade) use Motion, which is what framer-motion is called now. Its React components don't work in Angular, so it's the plain `animate()` function in one small directive.

The token sits in localStorage. You get logged out when it expires or when the API answers with a 401, and a toast tells you why.

Loading states are skeletons shaped like the real thing (rows, tab counts, the edit form), not spinners. Delete and restore update the screen first and let the server catch up, and the delete toast has an Undo.

Speed: the other pages preload in the background after the first one, skills are fetched once per visit, only the search box is debounced, and the API talks to MySQL on 127.0.0.1 (on Windows "localhost" tries IPv6 first, which costs about 50ms per new connection). The icon library used to add 23 MB to every page load in dev mode, so it's gone; the six icons we need live in `icon.ts`.

Number fields (phone, experience, salaries) are plain text inputs with a small `numeric` directive on them. It strips anything that isn't allowed as you type or paste, so letters, `e`, `-` and so on never get in. The only special character allowed is a leading `+` in the phone field, and `+91` is removed as soon as it's typed. Salaries also allow one dot. The same rules are checked again with zod on the server.

## Not done yet

Migrations instead of `sync()`, an httpOnly cookie instead of localStorage, refresh tokens, rate limiting on login, and tests.
