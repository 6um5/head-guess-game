# Head Guess Game

Real-time multiplayer guessing game inspired by "What's in my head".

## Structure

- `client/` — Next.js frontend (Tailwind CSS, Framer Motion, Lucide React)
- `server/` — Node.js backend (Express, Socket.io)

## Setup

```bash
# Server
cd server && npm install && npm run dev

# Client (separate terminal)
cd client && npm install && npm run dev
```

## Tech Stack

| Layer    | Technologies                          |
| -------- | ------------------------------------- |
| Frontend | Next.js, Tailwind CSS, Framer Motion, Lucide React, Socket.io Client |
| Backend  | Node.js, Express, Socket.io           |

## Deploy on Render

The repo includes `render.yaml` so both the server and the Next.js client can run as Web Services.

1. Push this repository to GitHub.
2. In [Render](https://dashboard.render.com), click **New + → Blueprint** and select the repo.
3. Add `GEMINI_API_KEY` when Render asks for it (needed for AI words and hints).
4. After the first deploy, open the **client** URL (not the server URL) to play.

Manual setup (without Blueprint):

- **Server:** Web Service, root `server`, build `npm install`, start `npm start`.
  - `CLIENT_ORIGIN` = the client URL, for example `https://head-guess-game-client.onrender.com`
  - `GEMINI_API_KEY` = your Gemini key
- **Client:** Web Service, root `client`, build `npm install && npm run build`, start `npm start`.
  - `NEXT_PUBLIC_SOCKET_URL` = the server URL, for example `https://head-guess-game-server.onrender.com`

Free Render services sleep after inactivity. The first request after sleep can take about a minute.
