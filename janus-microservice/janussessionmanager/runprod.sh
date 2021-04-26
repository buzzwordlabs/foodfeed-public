#!/bin/sh
cd /app && ./setupprodvars.sh && npx dotenv graphile-migrate migrate && node src/server.js
