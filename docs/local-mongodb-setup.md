# Local MongoDB Development Setup Guide

This guide will help you set up MongoDB locally on your development machine for POWERBACK development.

> **📖 Related Documentation:**
> - [Development Setup](./development.md) - Complete development environment setup
> - [Remote MongoDB Setup](./remote-mongodb-setup.md) - Remote database configuration
> - [Environment Management](./environment-management.md) - Environment configuration

## Why Local MongoDB?

Using a local MongoDB instance for development offers several advantages:

- **Faster**: No network latency - instant database operations
- **Isolated**: Your local changes won't affect shared dev databases
- **Offline**: Works without internet connection
- **Easy Reset**: Simple to drop and recreate databases for testing
- **No Security Config**: No need to configure firewalls or remote access
- **Better Testing**: Isolated environment perfect for testing

## Step 1: Install MongoDB Locally

### Ubuntu/Debian

**For Ubuntu 24.04 (Noble) and newer:**

Ubuntu 24.04 uses `libssl3`, but MongoDB 7.0 requires `libssl1.1`. Use MongoDB 8.0 instead:

```bash
# Import MongoDB public GPG key
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# Add MongoDB 8.0 repository (supports libssl3)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

**For Ubuntu 22.04 (Jammy) and older:**

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Alternative: Using Docker (Recommended for Ubuntu 24.04+)**

If you prefer Docker, this avoids SSL library conflicts:

```bash
# Install Docker (if not already installed)
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
# Log out and back in for this to take effect

# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb-data:/data/db \
  --restart unless-stopped \
  mongo:7.0

# Verify it's running
docker ps | grep mongodb

# View logs if needed
docker logs mongodb
```

The MongoDB connection string remains the same: `mongodb://127.0.0.1:27017/powerback`

**Note**: The MongoDB Node.js driver (`^4.1.3` in your package.json) is compatible with MongoDB server versions 4.4, 5.0, 6.0, 7.0, and 8.0, so any of these will work fine.

### macOS (Homebrew)

```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

### Windows

1. Download MongoDB Community Server from [mongodb.com/download](https://www.mongodb.com/try/download/community)
2. Run the installer
3. MongoDB will start automatically as a Windows service

## Step 2: Verify MongoDB Installation

Check that MongoDB is running:

```bash
# Linux/macOS
sudo systemctl status mongod
# or on macOS with Homebrew:
brew services list | grep mongodb
# or for Docker:
docker ps | grep mongodb

# Test connection
mongosh
```

If connected successfully, you should see:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
Using MongoDB: ...
Using Mongosh: ...
```

Test basic commands:
```javascript
show dbs
exit
```

Exit MongoDB shell:
```javascript
exit
```

## Step 3: Configure Your .env File

Create or update your `.env` file in the project root:

```env
# Database - Local MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/powerback
```

**Note**: For local development, you typically don't need authentication. MongoDB runs without auth by default on localhost.

## Step 4: Test the Connection

Start your development server:

```bash
cd /home/jonathan/dev/powerback
npm run dev
```

Check the logs for:
```
MongoDB connected for db services!
Database connected successfully
```

## Step 5: Useful MongoDB Commands

### Connect to MongoDB Shell

```bash
mongosh
```

### List Databases

```javascript
show dbs
```

### Use POWERBACK Database

```javascript
use powerback
```

### List Collections

```javascript
show collections
```

### View Documents

```javascript
db.users.find().pretty()
db.celebrations.find().pretty()
```

### Drop Database (Reset Everything)

```javascript
use powerback
db.dropDatabase()
```

### Exit MongoDB Shell

```javascript
exit
```

## Step 6: Optional - Enable Authentication (Advanced)

If you want to use authentication locally (for testing auth features):

### 6.1 Create Admin User

```bash
mongosh
```

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "admin-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})
```

### 6.2 Create Database User

```javascript
use powerback
db.createUser({
  user: "powerback_dev",
  pwd: "dev-password",
  roles: [ { role: "readWrite", db: "powerback" } ]
})
```

### 6.3 Enable Authentication

Edit MongoDB config file:

**Linux**: `/etc/mongod.conf`
**macOS**: `/usr/local/etc/mongod.conf` or `/opt/homebrew/etc/mongod.conf`
**Windows**: `C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg`

Add:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:

```bash
# Linux
sudo systemctl restart mongod

# macOS
brew services restart mongodb-community

# Windows - restart MongoDB service from Services panel
```

### 6.4 Update .env with Authentication

```env
MONGODB_URI=mongodb://powerback_dev:dev-password@127.0.0.1:27017/powerback?authSource=powerback
```

## Troubleshooting

### MongoDB Won't Start

**Linux:**
```bash
# Check status
sudo systemctl status mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log

# Check if port is in use
sudo lsof -i :27017
```

**macOS:**
```bash
# Check status
brew services list

# Check logs
tail -f /usr/local/var/log/mongodb/mongo.log
# or
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

**Docker:**
```bash
# Check if container is running
docker ps | grep mongodb

# Check logs
docker logs mongodb

# If MongoDB 8.0 installation fails, try MongoDB 7.0 via Docker - it's the simplest solution and avoids all SSL library conflicts
```

### Connection Refused

1. Verify MongoDB is running: `sudo systemctl status mongod` (Linux) or `brew services list` (macOS)
2. Check MongoDB is listening on port 27017: `netstat -an | grep 27017` or `lsof -i :27017`
3. Verify connection string in `.env` file

### Permission Denied

If you get permission errors:

```bash
# Linux - check MongoDB data directory permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
```

## Quick Reference

### Start MongoDB

```bash
# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community
```

### Stop MongoDB

```bash
# Linux
sudo systemctl stop mongod

# macOS
brew services stop mongodb-community
```

### Restart MongoDB

```bash
# Linux
sudo systemctl restart mongod

# macOS
brew services restart mongodb-community
```

## Next Steps

1. ✅ MongoDB installed and running
2. ✅ `.env` file configured with `MONGODB_URI=mongodb://127.0.0.1:27017/powerback`
3. ✅ Start development server: `npm run dev`
4. ✅ Verify connection in logs

## Additional Resources

- [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)
- [MongoDB Shell (mongosh) Documentation](https://docs.mongodb.com/mongodb-shell/)
- [MongoDB Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
