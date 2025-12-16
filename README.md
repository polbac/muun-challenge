
# IP Blocklist Service Assignment

## Instructions

1. Clone the repository

```
https://github.com/polbac/muun-challenge.git
```

2. Start databases (you need docker)

```
docker compose up -d
```

3. Install dependences (you need node >= 22)

```
npm install
```

4. Configure JWT_SECRET

Edit .env and edit JWT_SECRET with a random string (recommended using a tool like https://jwtsecrets.com/)


5. Run migrations

```
migration:run
```

6. Start the application

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
npm run auth:token
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