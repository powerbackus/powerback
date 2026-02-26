# Remote MongoDB Development Setup Guide

This guide will help you set up a remote MongoDB instance on your VPS for development, allowing you to access the same database from any device.

> **📖 Related Documentation:**
> - [Local MongoDB Setup](./local-mongodb-setup.md) - Local database setup (recommended)
> - [Development Setup](./development.md) - Complete development environment setup
> - [Environment Management](./environment-management.md) - Environment configuration

## Prerequisites

- A VPS with SSH access
- Root or sudo access on the VPS
- MongoDB installed on the VPS (or ability to install it)

## Step 1: Install MongoDB on Your VPS

### Ubuntu/Debian

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

### CentOS/RHEL

```bash
# Create MongoDB repository file
sudo vi /etc/yum.repos.d/mongodb-org-7.0.repo

# Add the following content:
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc

# Install MongoDB
sudo yum install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Step 2: Configure MongoDB for Remote Access

### 2.1 Edit MongoDB Configuration

Edit the MongoDB configuration file:

```bash
sudo nano /etc/mongod.conf
```

Update the `net` section to bind to all interfaces:

```yaml
net:
  port: 27017
  bindIp: 0.0.0.0  # Change from 127.0.0.1 to allow remote connections
```

### 2.2 Create MongoDB Admin User

Connect to MongoDB:

```bash
mongosh
```

Create an admin user:

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-password-here",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
})
```

Create a database-specific user for your POWERBACK application:

```javascript
use powerback
db.createUser({
  user: "powerback_dev",
  pwd: "your-dev-password-here",
  roles: [ { role: "readWrite", db: "powerback" } ]
})
```

Exit MongoDB shell:

```javascript
exit
```

### 2.3 Enable Authentication

Edit `/etc/mongod.conf`:

```bash
sudo nano /etc/mongod.conf
```

Add security section:

```yaml
security:
  authorization: enabled
```

Restart MongoDB:

```bash
sudo systemctl restart mongod
```

## Step 3: Configure Firewall

### Ubuntu/Debian (UFW)

```bash
# Allow MongoDB port
sudo ufw allow 27017/tcp

# Or restrict to specific IP (more secure)
sudo ufw allow from YOUR_DEVICE_IP to any port 27017
```

### CentOS/RHEL (firewalld)

```bash
# Allow MongoDB port
sudo firewall-cmd --permanent --add-port=27017/tcp
sudo firewall-cmd --reload

# Or restrict to specific IP (more secure)
sudo firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='YOUR_DEVICE_IP' port port='27017' protocol='tcp' accept"
sudo firewall-cmd --reload
```

## Step 4: Configure Your Local Development Environment

### 4.1 Update Your .env File

Create or update your `.env` file in the project root:

```env
# Database - Remote MongoDB on VPS
MONGODB_URI=mongodb://powerback_dev:your-dev-password-here@your-vps-ip:27017/powerback?authSource=powerback

# Or with authentication options:
MONGODB_URI=mongodb://powerback_dev:your-dev-password-here@your-vps-ip:27017/powerback?authSource=powerback&retryWrites=true&w=majority
```

**Connection String Format:**
```
mongodb://[username]:[password]@[host]:[port]/[database]?[options]
```

### 4.2 Test Connection

Test the connection from your local machine:

```bash
# Install MongoDB shell tools locally (optional)
# Then test connection:
mongosh "mongodb://powerback_dev:your-dev-password-here@your-vps-ip:27017/powerback?authSource=powerback"
```

Or test from your Node.js application:

```bash
cd /home/jonathan/dev/powerback
npm run dev
```

Check the logs to confirm successful connection.

## Step 5: Security Best Practices

### 5.1 Use SSH Tunnel (Recommended for Production-like Security)

Instead of exposing MongoDB directly, use an SSH tunnel:

```bash
# Create SSH tunnel (run this on your local machine)
ssh -L 27017:localhost:27017 user@your-vps-ip

# Then in another terminal, update .env to use localhost:
MONGODB_URI=mongodb://powerback_dev:your-dev-password-here@127.0.0.1:27017/powerback?authSource=powerback
```

### 5.2 Restrict Firewall to Your IPs Only

Only allow connections from your development IPs:

```bash
# Ubuntu/Debian
sudo ufw delete allow 27017/tcp
sudo ufw allow from YOUR_DEVICE_IP to any port 27017

# CentOS/RHEL
sudo firewall-cmd --remove-port=27017/tcp --permanent
sudo firewall-cmd --permanent --add-rich-rule="rule family='ipv4' source address='YOUR_DEVICE_IP' port port='27017' protocol='tcp' accept"
sudo firewall-cmd --reload
```

### 5.3 Use Strong Passwords

Generate strong passwords:

```bash
# Generate random password
openssl rand -base64 32
```

### 5.4 Enable MongoDB SSL/TLS (Advanced)

For production-like security, enable SSL/TLS encryption. See MongoDB documentation for SSL setup.

## Step 6: Database Connection Options

The application has been updated to support remote connections with improved timeout settings:

- `serverSelectionTimeoutMS: 30000` - 30 seconds to select server (increased from 10s)
- `socketTimeoutMS: 45000` - 45 seconds for socket operations
- `maxPoolSize: 10` - Connection pool size

## Troubleshooting

### Connection Refused

1. Check MongoDB is running: `sudo systemctl status mongod`
2. Check firewall rules: `sudo ufw status` or `sudo firewall-cmd --list-all`
3. Verify bindIp in `/etc/mongod.conf` is `0.0.0.0`
4. Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`

### Authentication Failed

1. Verify username and password in connection string
2. Check `authSource` parameter matches the database where user was created
3. Verify user exists: `mongosh -u admin -p admin-password --authenticationDatabase admin`
4. Check user roles: `db.getUser("powerback_dev")`

### Timeout Issues

1. Check network connectivity: `ping your-vps-ip`
2. Verify port is open: `telnet your-vps-ip 27017`
3. Check MongoDB logs for errors
4. Increase timeout values if needed (already configured in db.js)

### Connection String Examples

**Without authentication (not recommended):**
```
MONGODB_URI=mongodb://your-vps-ip:27017/powerback
```

**With authentication:**
```
MONGODB_URI=mongodb://username:password@your-vps-ip:27017/powerback?authSource=powerback
```

**With multiple options:**
```
MONGODB_URI=mongodb://username:password@your-vps-ip:27017/powerback?authSource=powerback&retryWrites=true&w=majority&ssl=false
```

## Next Steps

1. Update your `.env` file with the remote MongoDB connection string
2. Test the connection by starting your development server
3. Consider setting up an SSH tunnel for additional security
4. Keep your MongoDB credentials secure and never commit them to git

## Additional Resources

- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)
- [MongoDB Connection String Format](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Authentication](https://docs.mongodb.com/manual/core/authentication/)
