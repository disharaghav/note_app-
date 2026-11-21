# NoteFlow

A notes app with a React + Vite frontend and an Express API.

## Existing backend routes used
- `POST /user/register`
- `POST /user/login`
- `GET /dashboard` (sends JWT in `authorization` header)

## Run locally

Install the backend and frontend dependencies, then build the frontend:

```bash
npm install
npm --prefix frontend install
npm run build
npm start
```

Open `http://localhost:8080`.

Make sure your existing `.env` contains:
```env
mongourl=your_mongodb_connection_string
```

For frontend-only development with hot reload, run the backend and the Vite
development server in separate terminals:
```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

The Vite proxy forwards API requests to `http://localhost:8080`.

## Deploy on Render

Create a Node web service for this repository and branch. Set the build command
to `npm run render-build` and the start command to `npm start`. Add
`MONGODB_URI` in the service's environment variables to connect a MongoDB
database. The Express server serves the built frontend and API from one service;
Render provides the service port through `PORT`.
# note_app-
