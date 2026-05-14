## Integration Tests with Docker Mongo

These integration tests use a real MongoDB instance from Docker Compose instead of `mongodb-memory-server`.

### Run in one command

```bash
npm run test:integration:docker
```

You can also run the dedicated containerized test service:

```bash
docker compose run --rm test
```

### Manual run

```bash
docker compose up -d mongo
npm run test:integration
docker compose stop mongo
```

### Notes

- The default test connection string is `mongodb://127.0.0.1:27017/ecommerce_test`.
- You can override `MONGO_URI` if needed.
- The old `mongodb-memory-server` path is no longer used.
