# ColabTool

Cross-platform projektplanlægning til teams der bruger MS og Google produkter.

## Funktioner

- **Projekter** – opret og administrer projekter med teammedlemmer
- **Opgavestyring** – kanban-board med status (Ikke startet / I gang / Færdig)
- **Afhængigheder** – opgaver kan blokeres af andre opgaver; en opgave kan ikke markeres som færdig før afhængigheder er løst
- **Tværplatform** – brugere markeres som Microsoft- eller Google-brugere; alle kan samarbejde i samme webapp
- **Real-time chat** – Slack-lignende beskedkanal per projekt med mulighed for at linke beskeder til specifikke opgaver

## Kom i gang

### Krav
- Node.js 18+

### Installation

```bash
# Installer afhængigheder
npm run install:all

# Start begge servere (frontend + backend)
npm run dev
```

Åbn **http://localhost:3000** i browseren.

### Demodata

Applikationen starter med 5 demobrugere (3 Microsoft, 2 Google) og et eksempelprojekt med opgaver og afhængigheder, klar til at udforske.

## Arkitektur

```
ColabTool/
├── server/          # Express + Socket.io + SQLite
│   └── src/
│       ├── index.ts         # HTTP + WebSocket server
│       ├── db.ts            # Database schema & seed
│       └── routes/          # REST API endpoints
├── client/          # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── App.tsx          # Routing
│       ├── pages/           # Login, Projektliste, Projekt
│       ├── components/      # TaskCard, Chat, Avatar m.m.
│       └── lib/             # API klient, typer, utils
└── package.json     # Root scripts
```

## API

| Method | Endpoint | Beskrivelse |
|--------|----------|-------------|
| GET | `/api/users` | Alle brugere |
| POST | `/api/users` | Opret bruger |
| GET | `/api/projects` | Alle projekter |
| POST | `/api/projects` | Opret projekt |
| GET | `/api/projects/:id` | Projekt med medlemmer |
| GET | `/api/projects/:id/tasks` | Opgaver med afhængigheder |
| POST | `/api/projects/:id/tasks` | Opret opgave |
| PATCH | `/api/projects/:id/tasks/:tid` | Opdater opgave |
| PUT | `/api/projects/:id/tasks/:tid/dependencies` | Sæt afhængigheder |
| GET | `/api/projects/:id/messages` | Beskeder |
| POST | `/api/projects/:id/messages` | Send besked (HTTP fallback) |

WebSocket events via Socket.io: `join_project`, `send_message`, `new_message`, `task_updated`
