# Agentic ERP

This project provides a Vite + React front-end paired with a lightweight Express
API that uses MongoDB for persistence. The previous dependency on the Base44
platform has been replaced with a self-hosted backend so you can run the entire
ERP demo locally.

## Running the app

1. Ensure a MongoDB instance is available. By default the server connects to
   `mongodb://127.0.0.1:27017/agentic_erp`, but you can override this with the
   `MONGO_URI` and `MONGO_DB_NAME` environment variables.

```bash
npm install
npm run server # starts the Express + MongoDB API on http://localhost:4000
npm run dev
```

## Building the app

```bash
npm run build
```