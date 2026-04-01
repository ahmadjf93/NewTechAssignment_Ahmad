# NewTechAssignment

Full-stack TypeScript app for managing teams/users with parent-child relations. Backend: Express + JSON file store. Frontend: React + Vite.

## Structure
- server: Express API (TS) with JSON persistence
- client: React + Vite (TS)

## Quick start
1. Install dependencies
   - `cd server && npm install`
   - `cd ../client && npm install`
2. Run API (default http://localhost:4000)
   - `cd server && npm run dev`
3. Run UI (default http://localhost:5173)
   - `cd client && npm run dev`
   - or from repo root after `npm install`: `npm run dev` (runs both via npm-run-all)
4. Build
   - `cd server && npm run build`
   - `cd client && npm run build`

## API overview
- POST /teams `{ name }`
- GET /teams?name=abc
- GET /teams/:id
- POST /teams/:id/children `{ childTeamId | childUserId }`
- DELETE /teams/:id
- POST /users `{ name }`
- GET /users?name=abc
- GET /users/:id
- DELETE /users/:id
