# NotesApp Frontend

A React + Vite frontend added without changing any existing backend files.

## Existing backend routes used
- `POST /user/register`
- `POST /user/login`
- `GET /dashboard` (sends JWT in `authorization` header)

## Run backend
```bash
npm install
npm run server
```

Make sure your existing `.env` contains:
```env
mongourl=your_mongodb_connection_string
```

## Run frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

The Vite proxy forwards `/user` and `/dashboard` requests to `http://localhost:8080`, so the backend code does not need any CORS changes.
# note_app-
