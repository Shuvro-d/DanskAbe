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
- Desktop packaging: Electron + electron-builder

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

## Windows App Build (Installer)

1. Install dependencies:

```bash
npm install
```

2. Run desktop app directly:

```bash
npm run desktop
```

3. Optional role-specific launches:

```bash
npm run desktop:teacher
npm run desktop:student
```

In student mode:
- Closing the window keeps the app running in background.
- The app auto-starts on Windows login.
- Questions continue as desktop notifications when the window is hidden.

4. Build Windows installer (`.exe`):

```bash
npm run build:win
```

Role-specific distributable usage:
- Teacher installer target: launch app with `--teacher` (or use `npm run desktop:teacher` while testing)
- Student installer target: launch app with `--student` (or use `npm run desktop:student` while testing)

5. Installer output location:

- `dist/` folder

Notes:
- This creates an installable Windows app so users do not need to use browser links.
- Student auto-update behavior still depends on internet reachability to the configured update JSON URL.