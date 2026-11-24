# NoteFlow

A notes app with a React + Vite frontend and an Express API.

## Existing backend routes used
- `POST /user/register`
- `POST /user/login`
- `GET /dashboard` (sends JWT in `authorization` header)

## Run locally

Install each app's dependencies, then build the frontend:

```bash
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix frontend run build
npm --prefix backend start
```

Open `http://localhost:8080`.

Put your local MongoDB connection string in `backend/.env`:
```env
mongourl=your_mongodb_connection_string
```

For frontend-only development with hot reload, run the backend and the Vite
development server in separate terminals:
```bash
npm --prefix backend run server
npm --prefix frontend run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

The Vite proxy forwards API requests to `http://localhost:8080`.

## Connect Vercel frontend to Render API

The backend allows the deployed Vercel origin `https://dex-lime-eight.vercel.app`.
In the Render web service settings, set `FRONTEND_ORIGIN` to
`https://dex-lime-eight.vercel.app`. In the Vercel project settings, add
`VITE_API_URL` with `https://note-app-qxpj.onrender.com` and redeploy the frontend
if you want to override the production default. Update the
`FRONTEND_ORIGIN` allowlist if you add another frontend domain. Example files are
provided in `backend/.env.example` and `frontend/.env.example`.

## Deploy on Render

Create a Node web service for this repository and branch. Set the build command
to `npm --prefix backend run render-build` and the start command to
`npm --prefix backend start`. Add
`MONGODB_URI` in the service's environment variables to connect a MongoDB
database. The Express server serves the built frontend and API from one service;
Render provides the service port through `PORT`.
# note_app-
