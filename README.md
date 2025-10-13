# Agentic ERP

This project provides a Vite + React front-end paired with a lightweight Express
API that uses Prisma and SQLite for persistence. The previous dependency on the
Base44 platform has been replaced with a self-hosted backend so you can run the
entire ERP demo locally.

## Running the app

```bash
npm install
npm run db:generate
npm run db:push
npm run server # starts the Express + Prisma API on http://localhost:4000
npm run dev
```

## Building the app

```bash
npm run build
```