# Microservices Test Task

Two NestJS services:
- `products` – CRUD for products (Postgres SQL, SQS events, Prometheus metrics, Swagger docs).
- `notifications` – consumes SQS messages from `products` and logs them (plus Prometheus metrics).

## Quick start
```sh
# from repo root
docker-compose up --build
```

Services:
- Products API: http://localhost:3000 (Swagger at `/openapi`, metrics at `/metrics`)
- Notifications metrics: http://localhost:3001/metrics
- Prometheus: http://localhost:9090
- LocalStack (SQS): http://localhost:4566
- Postgres: localhost:5433 (`postgres` / `root`, db `db`)

## Local dev (without Docker)
```sh
cd products
npm install
npm run migrate          # run DB migration
npm run start:dev        # starts on :3000

cd ../notifications
npm install
npm run start:dev        # starts on :3001
```

Environment variables of interest:
- `DATABASE_URL` – Postgres connection (default `postgres://postgres:root@localhost:5433/db`)
- `SQS_QUEUE_URL` – queue URL (default `http://localhost:4566/000000000000/products-events`)
- `SQS_ENDPOINT` – override LocalStack endpoint
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

## Tests

### Unit Tests
```sh
cd products
npm test
```

### E2E/Integration Tests

**Products Service:**
```sh
cd products
# Make sure database is running and migrations are applied
npm run db:migrate
npm run test:e2e
```

**Notifications Service:**
```sh
cd notifications
# Make sure LocalStack is running with SQS queue created
npm run test:e2e
```

**Run all tests:**
```sh
cd products
npm run test:all

cd ../notifications
npm run test:all
```

E2E tests verify:
- Full API flow (create -> list -> delete products)
- SQS event publishing and consumption
- Prometheus metrics exposure
- Error handling and validation

## Migrations
```sh
npm run migrate        # up
npm run migrate:down   # down
```
