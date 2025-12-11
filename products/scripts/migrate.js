require('dotenv').config();
const { execSync } = require('child_process');

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER || 'postgres'}:${
    process.env.POSTGRES_PASSWORD || 'root'
  }@${process.env.POSTGRES_HOST || '127.0.0.1'}:${
    process.env.POSTGRES_PORT || '5433'
  }/${process.env.POSTGRES_DB || 'db'}`;

const action = process.argv[2] || 'up';

process.env.DATABASE_URL = databaseUrl;

const command = `npx node-pg-migrate ${action} -m migrations -d DATABASE_URL --ts-node --tsconfig tsconfig.json`;

console.log(`Running migration: ${action}`);
console.log(`Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

try {
  execSync(command, { stdio: 'inherit', env: process.env });
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}

