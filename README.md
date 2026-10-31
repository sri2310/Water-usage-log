# Water Usage Log

A beginner-friendly full-stack web app to record daily water consumption, understand category-wise usage, and track history. Intended for first-year B.Tech students.

## Problem and objectives
People often do not know how much water they use for drinking, bathing, cooking, and other activities. This app allows each registered person to record usage in liters, review totals, and update or remove incorrect entries.

## Users and features
One role: registered user. Each user sees only their own records. Features: registration, login, logout, daily entry creation, editing, deletion, date/category filtering, summary totals, category bars, responsive dashboard, and validation. No administrator role or automatic water meter integration.

## Technology and architecture
HTML5 + CSS3 + Vanilla JS frontend → Express REST API → Supabase PostgreSQL. Passwords are bcrypt-hashed; a signed JWT is stored in an HttpOnly same-site cookie. Supabase's service-role key is used only on the backend. The tables have RLS enabled and no public policies; backend authorization checks ownership for all entry operations.

## Folder tree
```text
water-usage-log/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── entries.js
│   ├── middleware/
│   │   └── auth.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## Prerequisites
Install [Visual Studio Code](https://code.visualstudio.com/), [Node.js LTS](https://nodejs.org/), and [Git](https://git-scm.com/). Create a free account at [Supabase](https://supabase.com/). Open the extracted folder in VS Code. On Windows use Terminal > New Terminal (PowerShell). Verify with `node -v`, `npm -v`, and `git --version`.

## Setup (Windows PowerShell)
1. Extract the ZIP and open `water-usage-log` in VS Code.
2. Create a Supabase project and wait until its database is ready.
3. In Supabase **SQL Editor**, open `database/schema.sql`, paste the entire SQL, and click **Run**. Verify `app_users` and `water_entries` in **Table Editor**.
4. In Supabase **Project Settings → API Keys**, obtain the project URL and the server-only service-role key (in some interfaces under legacy keys). **Never put this key in frontend files or GitHub.**
5. Edit `backend/.env` with your own `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`. Generate the secret in a terminal with:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Copy the output into `JWT_SECRET=`. `.env.example` is a safe template; `.env` is your private configuration and is ignored by Git.
6. In VS Code terminal run:
   ```powershell
   cd backend
   npm ci
   npm start
   ```
   Expected message: `Water Usage Log running at http://localhost:3000`. Keep the terminal open. If `npm ci` complains about the lock file, run `npm install` once, then `npm start`.
7. Open `http://localhost:3000` in your browser. Do not open `index.html` directly from the file system.
8. Register with a name, email, and password of at least eight characters, then log in. Add a water usage entry and confirm it appears in history.

## API endpoints
All endpoints send and receive JSON unless noted.

| Method | Path | Purpose | Authentication |
|---|---|---|---|
| GET | `/api/health` | Server health `{status:"ok"}` | No |
| POST | `/api/auth/register` | `{name,email,password}`; 201 user | No |
| POST | `/api/auth/login` | `{email,password}`; sets cookie and returns user | No |
| POST | `/api/auth/logout` | Clears cookie | No |
| GET | `/api/auth/me` | Current user | Yes |
| GET | `/api/entries` | List up to 500 own entries; optional `from`, `to`, `category` query parameters | Yes |
| POST | `/api/entries` | Create `{usage_date,category,liters,notes}`; 201 entry | Yes |
| PUT | `/api/entries/:id` | Update same fields; entry | Yes, owner |
| DELETE | `/api/entries/:id` | Delete own entry; message | Yes, owner |

Errors return `{error:"..."}` with status 400, 401, 404, 409, 429, or 500 as appropriate. Dates are `YYYY-MM-DD`; quantity is in liters (0.01–100000). Categories: Drinking, Cooking, Bathing, Laundry, Cleaning, Gardening, Other.

## Test checklist
- Register a new account → success; repeat email → 409.
- Log in with correct credentials → dashboard; wrong password → 401.
- Create an entry → appears after refresh; verify in Supabase Table Editor.
- Edit and delete an entry → changes persist after reload.
- Apply date/category filters → only matching records; clear filters → all records (max 500).
- Enter zero/negative liters, invalid category, future date → rejected.
- Log out → protected requests return 401.
- Register a second user → first user's entries must not be visible or editable.
- Resize to phone width → layout stacks without clipped forms.

## Troubleshooting
- `npm` not recognized: install Node.js LTS and reopen the terminal.
- `npm ci` error: from `backend/` run `npm install` to regenerate dependencies.
- Supabase errors: confirm URL/key, execute schema, check Supabase project status, restart server.
- `JWT_SECRET` error: generate a secret of 32+ characters and restart.
- Port busy: set `PORT=3001` in `backend/.env` and open `http://localhost:3001`.
- 401: log in again; session cookies expire after 24 hours.
- 500: inspect terminal logs; database details are deliberately hidden from browser responses.

## GitHub upload
From the root `water-usage-log` directory:
```powershell
git init
git status
git add .
git status
git commit -m "Build Water Usage Log"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```
Create an empty repository on GitHub first and replace `YOUR_GITHUB_REPOSITORY_URL` with its actual URL. Confirm `.env` and `node_modules/` are not staged; `.env.example` should be included. If a secret is ever published, rotate it immediately; `.gitignore` alone cannot remove secrets from existing commits.

## Limitations and improvements
The dashboard summarizes at most 500 filtered records and today's total reflects current filters. No password reset, email verification, or automatic meter reading. For a production deployment, add password reset/email verification, more advanced anti-abuse controls, paginated analytics, and HTTPS hosting. A real Supabase project and valid environment variables are required; sample placeholders do not connect to a database.
