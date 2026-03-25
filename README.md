# DanskAbe Prototype

Teacher-controlled Danish learning popup app prototype.

## What This Prototype Includes

- Teacher admin login (password only)
- Installable PWA (phone and desktop)
- Offline mode with cached pages and cached student question bank
- Auto-sync when internet returns (teacher updates pulled automatically)
- Teacher settings:
	- class code
	- enabled categories (`time`, `day_of_week`, `vocab`, `phrases`)
	- popups per day
	- popup interval (minutes)
- Teacher question bank CRUD (add/delete)
- Student access with no account:
	- enter class code once
	- device gets random popup questions at interval
	- answer check and simple learning history

## Tech

- Backend: Express
- Database: local JSON file (`data.json`)
- Frontend: plain HTML/CSS/JS

## Project Structure

- `src/server.js` - API server and routes
- `src/db.js` - SQLite schema, default settings, seed data
- `public/index.html` - entry page
- `public/teacher.html` - teacher admin UI
- `public/student.html` - student UI
- `public/style.css` - shared styles

## Run Locally

1. Install Node.js LTS (v20+ recommended).
2. Install dependencies:

```bash
npm install
```

3. Start app:

```bash
npm start
```

4. Open:
	 - `http://localhost:3000/`

## Install App (PWA)

1. Open the app in Chrome/Edge.
2. Use browser menu and choose install app.
3. Install on teacher and student devices using the same app URL.

## Shared Link and Auto Updates

- For real teacher/student use, host this app on one server (cloud VPS, Render, Railway, etc.).
- Share that single URL with all users.
- When teacher updates content, students receive updated dataset automatically when online.
- When offline, students continue using cached content and cached UI.

## Default Prototype Credentials

- Teacher password: `teacher123`
- Default class code: `DANSK101`

You can change both after first launch:
- password in database seed/environment (`TEACHER_PASSWORD`)
- class code from teacher settings page

## Notes

- Students do not create accounts.
- Student identity is local device ID in browser localStorage.
- This is a prototype, not hardened production security.

## Next Suggested Improvements

- Convert to PWA installable app for mobile/desktop
- Add teacher-created custom categories
- Add per-student progress dashboard
- Add question import from CSV