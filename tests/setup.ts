// Runs before every test file. Gives the app a valid, harmless configuration.
// Integration tests that need a real database set TEST_DATABASE_URL (CI does; see .github/workflows/ci.yml).
process.env.APP_ENV = "local";
process.env.LOG_LEVEL = "silent";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://test:test@localhost:5433/iceberg_test";
