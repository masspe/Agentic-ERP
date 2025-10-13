#!/usr/bin/env bash
set -euo pipefail

# Run the npm server script in the background and track its PID.
LOG_FILE="server.log"
PID_FILE="server.pid"

# Start the server in the background, redirecting output to the log file.
nohup npm run server > "$LOG_FILE" 2>&1 &
SERVER_PID=$!

echo "$SERVER_PID" > "$PID_FILE"
echo "npm server started in background (PID: $SERVER_PID)."
echo "Logs: $LOG_FILE"
