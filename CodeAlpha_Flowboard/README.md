# FlowBoard — Project Management Tool

A full-stack collaborative project management app (Trello/Asana-style) with authentication, Kanban boards, task assignment, comments, notifications, and real-time WebSocket updates.

## Features

- **Authentication** — Register, login, JWT-based sessions
- **Group projects** — Create projects and invite team members
- **Kanban boards** — Columns (To Do, In Progress, Done) with customizable columns
- **Task cards** — Title, description, priority, due date, assignee
- **Comments** — Threaded discussion on each task
- **Notifications** — In-app alerts for assignments, invites, and comments
- **Real-time updates** — Socket.io syncs board changes across all connected clients

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Backend  | Node.js, Express 5, TypeScript      |
| Database | SQLite via Prisma ORM               |
| Real-time| Socket.io                           |
| Auth     | JWT + bcrypt                        |

## Getting Started

### Prerequisites

- Node.js 18+

### 1. Backend

```bash
cd backend
npm install
npm run db:push
npm run dev
```

The API runs at `http://localhost:3001`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

1. **Register** two or more accounts to test collaboration.
2. **Create a project** from the dashboard.
3. **Invite members** via the Invite button on the project board (search by name/email).
4. **Add tasks** to any column; assign them to team members.
5. **Click a task** to edit details, change status, or add comments.
6. **Open a second browser/incognito window** with another account on the same project to see real-time updates and notifications.

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/auth/register` | Create account |
| POST   | `/api/auth/login` | Sign in |
| GET    | `/api/projects` | List user's projects |
| POST   | `/api/projects` | Create project |
| GET    | `/api/projects/:id` | Get board with columns & tasks |
| POST   | `/api/projects/:id/members` | Add member |
| POST   | `/api/projects/:id/columns` | Add column |
| POST   | `/api/columns/:id/tasks` | Create task |
| PATCH  | `/api/tasks/:id` | Update/move task |
| POST   | `/api/tasks/:id/comments` | Add comment |
| GET    | `/api/notifications` | List notifications |

## WebSocket Events

Clients join project rooms via `join:project`. Server emits:

- `task:created`, `task:updated`, `task:deleted`
- `column:created`
- `comment:created`
- `project:member_added`, `project:member_removed`
- `notification:new` (per-user room)

## Project Structure

```
projectmangment/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── routes/       # REST API
│       ├── socket/       # WebSocket handlers
│       └── middleware/   # JWT auth
└── frontend/
    └── src/
        ├── pages/        # Login, Dashboard, Project board
        ├── components/   # TaskCard, BoardColumn, TaskModal
        └── hooks/        # Socket.io client
```
