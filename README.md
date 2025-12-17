
# 🚏 IP Blocklist Service Assignment

A NestJS REST API that checks if IP addresses are blocked. It maintains a blocklist and provides fast lookups.

## Stack

- Node
- TS
- Nest
- PostgreSQL
- Redis
- TypeORM

## Instructions

### Clone the repository

```
https://github.com/polbac/muun-challenge.git
```

### Start databases (you need docker)

```
docker compose up -d
```

### Install dependences (you need node >= 22)

```
npm install
```

### Configure JWT_SECRET

Edit .env and edit JWT_SECRET with a random string (recommended using a tool like https://jwtsecrets.com/)

### Configure ADMIN_TOKEN

Edit .env and edit ADMIN_TOKEN with a random string (recommended using a tool like https://jwtsecrets.com/)

### Run migrations

```
npm run migration:run
```

### Start the application

```
npm run start
```

## API Doc

```
http://localhost:3000/api
```

## Commands

### Start the app (dev mode)

```bash
npm run start:dev
```

### Create a JWT token

```bash
npm run auth:generate-token
```

### Run migrations

```bash
npm run migration:run
``` 

### Ingest blocked IPs

```bash
npm run ingest:ips
```

### Stress test (you need run the app first)

```bash
npm run stress:test
```
