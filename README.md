# ✦ v0-clone

> An AI-powered UI generation platform — describe what you want to build, and get a live, interactive preview in seconds. Built with Next.js, Inngest, E2B sandboxes, and GPT-4.

---

## Overview

**v0-clone** is a full-stack AI code generation app inspired by [v0.dev](https://v0.dev). Users describe a UI or feature in plain English, and the app spins up a real sandboxed Next.js environment, writes the code, installs dependencies, starts a dev server, and returns a live iframe preview — all autonomously.

Each conversation turn is persisted as a **Project** with a thread of **Messages** and **Fragments** (snapshots of generated code + live URLs), allowing users to iterate on their builds over multiple sessions.

---

## Features

- 💬 **Conversational UI generation** — chat-based interface, multi-turn with full history
- ⚡ **Live sandbox previews** — every generation runs inside a real E2B sandbox with a hot Next.js dev server
- ♻️ **Sandbox reuse** — reconnects to an existing sandbox across turns, preserving installed packages and file state
- 🧠 **Autonomous coding agent** — uses GPT-4.1-mini with terminal, file write, and file read tools via Inngest Agent Kit
- 🗂️ **Fragment versioning** — every generation is saved as a Fragment with its files (JSON), title, and sandbox URL
- 🔐 **Clerk authentication** — user accounts, sessions, and project isolation
- 🗄️ **PostgreSQL persistence** — full message, project, and fragment history via Prisma

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js Frontend                  │
│                                                      │
│   Chat UI ──► Project View ──► Fragment / Preview    │
└───────────────────────┬─────────────────────────────┘
                        │  fires event: code-agent/run
                        ▼
┌─────────────────────────────────────────────────────┐
│                   Inngest Worker                     │
│                                                      │
│   1. get-or-create-sandbox  (E2B reconnect / new)    │
│   2. get-previous-messages  (Prisma)                 │
│   3. Agent Network Run      (GPT-4.1-mini)           │
│      ├─ tool: terminal                               │
│      ├─ tool: createOrUpdateFiles                    │
│      └─ tool: readFiles                              │
│   4. start-dev-server       (nohup npm run dev)      │
│   5. get-sandbox-url        (E2B getHost)            │
│   6. generate fragment title + response (GPT-4o)     │
│   7. save-result            (Prisma Fragment)        │
└───────────────────────┬─────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
   ┌─────────────┐           ┌────────────────┐
   │  E2B Cloud  │           │   PostgreSQL   │
   │  Sandbox    │           │   (Prisma)     │
   │             │           │                │
   │  Next.js    │           │  User          │
   │  dev server │           │  Project       │
   │  Port 3000  │           │  Message       │
   └─────────────┘           │  Fragment      │
                             └────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Auth | Clerk |
| Background Jobs | Inngest + Inngest Agent Kit |
| AI Model | OpenAI GPT-4.1-mini (agent), GPT-4o (response), GPT-4o-mini (title) |
| Sandboxes | E2B Code Interpreter — template `v0-clone-build-v1` |
| Database | PostgreSQL via Prisma |
| ORM | Prisma |

---

## Data Model

```prisma
User
 └── Projects[]
       └── Messages[]  (role: USER | ASSISTANT, type: RESULT | ERROR | ASSISTANT)
             └── Fragment?  (sandboxUrl, title, files: Json)
```

Every time the agent successfully generates code, a **Fragment** is attached to the assistant message. Fragments store:
- `sandboxUrl` — the live E2B preview URL
- `title` — AI-generated human-readable name for the generation
- `files` — a JSON snapshot of every generated file path → content

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- [Clerk](https://clerk.com) account
- [Inngest](https://inngest.com) account (or local dev server)
- [E2B](https://e2b.dev) account and API key
- OpenAI API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/v0-clone.git
cd v0-clone
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/v0clone

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# OpenAI
OPENAI_API_KEY=sk-...

# E2B
E2B_API_KEY=e2b_...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### 4. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Start Inngest dev server (in a separate terminal)

```bash
npx inngest-cli@latest dev
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

### 1. User sends a message

A chat message is saved to the database and an Inngest event `code-agent/run` is fired with the project ID and the message content.

### 2. Sandbox reuse logic

The worker checks if a previous `RESULT` fragment exists for the project. If a live sandbox URL is found, it attempts to reconnect via `Sandbox.connect(sandboxId)`. If the sandbox has expired, a fresh one is created from the `v0-clone-build-v1` template.

This means **installed `node_modules` and previously written files persist** across multiple turns in the same project — significantly reducing latency and token usage.

### 3. Agent network run

An Inngest Agent Kit network runs the coding agent with three tools:

| Tool | Description |
|---|---|
| `terminal` | Runs arbitrary shell commands in the sandbox (install deps, scaffold files, etc.) |
| `createOrUpdateFiles` | Writes one or more files to the sandbox filesystem and updates network state |
| `readFiles` | Reads file contents back for inspection or debugging |

The agent has access to the full previous message history as context, enabling multi-turn iteration.

### 4. Dev server management

After the agent finishes, the worker checks if `next dev` is already running (via `pgrep`). If not, it starts it with `nohup npm run dev > /tmp/next.log 2>&1 &` and waits for port 3000 to become available.

### 5. Fragment saved

The final sandbox URL, generated files, AI-generated title, and assistant response are persisted as a `Fragment` attached to the new assistant `Message`.

---

## Project Structure

```
v0-clone/
├── app/
│   ├── page.tsx                  # Landing / chat entry
│   ├── (auth)/                   # Clerk sign-in / sign-up routes
│   └── projects/[id]/            # Per-project chat + preview view
├── components/
│   ├── chat/                     # Message thread, input bar
│   └── preview/                  # Fragment iframe preview
├── inngest/
│   ├── client.ts                 # Inngest client init
│   ├── functions/
│   │   └── code-agent.ts         # Main agent function (this file)
│   └── utils.ts                  # lastAssistantTextMessageContent, normalizeDirectives
├── lib/
│   └── db.ts                     # Prisma client singleton
├── prompt/
│   └── index.ts                  # PROMPT, FRAGMENT_TITLE_PROMPT, RESPONSE_PROMPT
├── prisma/
│   └── schema.prisma             # Database schema
└── .env.local                    # Environment variables (not committed)
```

---

## E2B Sandbox Template

The agent uses a custom E2B template: **`v0-clone-build-v1`**.

This template should have the following pre-installed to minimize cold start time:
- Node.js 18+
- A scaffolded Next.js project with Tailwind CSS and shadcn/ui
- Pre-installed `node_modules` so the agent doesn't need to run `npm install` from scratch each time

To build and push your own template:

```bash
e2b template build --name v0-clone-build-v1
```

---

## Inngest Agent Flow Diagram

```
code-agent/run event
        │
        ▼
get-or-create-sandbox
        │
        ▼
get-previous-messages
        │
        ▼
  createState (history)
        │
        ▼
 network.run(prompt)  ◄─────────────────────────┐
        │                                        │
        ▼                                        │
  agent invokes tool?                            │
   ├── terminal          → runs shell cmd        │
   ├── createOrUpdateFiles → writes to sandbox   │
   └── readFiles          → reads from sandbox   │
        │                                        │
   agent has summary? ─── No ────────────────────┘
        │
       Yes
        ▼
 extract sandbox files (fallback if state empty)
        │
        ▼
  start-dev-server (if not running)
        │
        ▼
  get-sandbox-url (retry loop, port 3000)
        │
        ▼
  generate title (GPT-4o-mini)
  generate response (GPT-4o)
        │
        ▼
  save-result → Message + Fragment (Prisma)
        │
        ▼
     return { sandboxUrl, summary, files }
```

---

## Known Limitations & Improvements

- **Sandbox expiry** — E2B sandboxes have a maximum lifetime. If a sandbox expires mid-session, the worker creates a new one but file state (outside the DB snapshot) is lost. A future improvement would be to re-hydrate the new sandbox from the last Fragment's `files` JSON before running the agent.
- **Port detection** — the `getHost(3000)` retry loop is a time-based heuristic. Replacing with an active HTTP health check against the sandbox URL would be more robust.
- **Single-agent network** — currently only one agent runs in the network. Adding a dedicated planner agent and a reviewer agent would improve code quality on complex prompts.
- **File diffing** — the fallback file extraction uses `find` on a fixed set of directories. Tracking file changes via a diff/patch approach would be cleaner.

---

## License

MIT License — see [LICENSE](./LICENSE) for details.
