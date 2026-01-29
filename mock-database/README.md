# Mock Dealership Database for Testing

This directory contains a mock MySQL database setup for testing the dealer onboarding flow.

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Start the database:**
   ```bash
   cd mock-database
   docker-compose up -d
   ```

2. **Wait for the database to initialize** (about 30 seconds)

3. **Verify it's running:**
   ```bash
   docker-compose ps
   ```

4. **Test the connection:**
   ```bash
   docker exec -it dealership_db mysql -u carrie_readonly -p'Test123!@#' dealership_inventory -e "SELECT COUNT(*) FROM vehicles;"
   ```

### Option 2: Using Local MySQL

If you have MySQL installed locally:

```bash
mysql -u root -p < setup.sql
```

## Database Credentials for Testing Onboarding

Use these credentials when filling out the dealer onboarding form:

| Field | Value |
|-------|-------|
| **Database Host** | `localhost` (or `host.docker.internal` if running in Docker) |
| **Port** | `3306` |
| **Database Name** | `dealership_inventory` |
| **Read-Only User** | `carrie_readonly` |
| **Password** | `Test123!@#` |

## What's Inside

The database includes:
- **10 sample vehicles** with realistic data
- **Read-only user** (`carrie_readonly`) with SELECT-only permissions
- **Proper indexes** for common queries
- **Vehicle attributes**: make, model, year, price, mileage, condition, etc.

## Testing the Full Onboarding Flow

1. **Start the mock database** (see Quick Start above)

2. **Start the backend server:**
   ```bash
   cd ../
   npm run dev
   ```

3. **Start the frontend:**
   ```bash
   cd ../../carrie-marketing
   npm run dev
   ```

4. **Navigate to the onboarding page:**
   - Go to `http://localhost:5174/onboarding`

5. **Fill out the forms:**
   - **Phase 1**: Click "Get Started"
   - **Phase 2**: Enter dealership details
   - **Phase 3**: Use the credentials from the table above

6. **Submit and verify:**
   - Check the backend logs for the application ID
   - View the application in Firestore: Collection `dealerApplications`

## Useful Commands

### Stop the database:
```bash
docker-compose down
```

### Stop and remove all data:
```bash
docker-compose down -v
```

### View logs:
```bash
docker-compose logs -f mysql
```

### Connect to MySQL shell:
```bash
docker exec -it dealership_db mysql -u root -p'rootpassword123' dealership_inventory
```

### Query vehicles:
```bash
docker exec -it dealership_db mysql -u carrie_readonly -p'Test123!@#' dealership_inventory -e "SELECT make, model, year, price FROM vehicles LIMIT 5;"
```

## Troubleshooting

### Port 3306 already in use
If you have MySQL already running locally:
1. Stop your local MySQL service, or
2. Change the port in `docker-compose.yml` (e.g., `"3307:3306"`)

### Can't connect from backend
If running the backend in Docker, use `host.docker.internal` instead of `localhost`

### Permission denied
Make sure the read-only user has proper permissions:
```sql
SHOW GRANTS FOR 'carrie_readonly'@'%';
```

## Network Access Notes

**For Production Deployments:**
- This setup uses `%` wildcard for the read-only user (allows connections from any host)
- In production, restrict to specific IPs: `'carrie_readonly'@'your-server-ip'`
- Use SSL/TLS for database connections
- Consider using a VPN or private network connection
- Never expose production databases directly to the internet
