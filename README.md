# MicroBlame

MicroBlame lets you pair data from `pg_stat_statements` with observability data to help you understand find slow db queries and where they are coming from.

## Installation

Add `REDIS_URL`, `PG_MAIN_DATABASE_URI` and `PG_READ_DATABASE_URI` to a `.env` file.

Then run:

```bash
docker compose up
```

Now send traces to the `:4318/v1/traces` endpoint from your application.

The frontend is available at `http://localhost:3004`.
