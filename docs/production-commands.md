# Powerback Production Server Commands

## 🚀 **Service Management**

```bash
# Start the Powerback service
sudo systemctl start powerback.service

# Stop the Powerback service
sudo systemctl stop powerback.service

# Restart the Powerback service
sudo systemctl restart powerback.service

# Check service status
sudo systemctl status powerback.service

# Enable service to start on boot
sudo systemctl enable powerback.service

# Disable service from starting on boot
sudo systemctl disable powerback.service
```

## 🔄 **Deployment & Secrets**

```bash
# Deploy with fresh secrets (copies secrets, restarts, deletes temp file)
launch

# Or use the full path
/usr/local/bin/launch-powerback
```

## 📊 **Logs & Monitoring**

```bash
# View colored live logs
powerback-logs

# View recent logs (last 50 lines)
sudo journalctl -u powerback.service -n 50

# View logs from today
sudo journalctl -u powerback.service --since today

# View logs with timestamps
sudo journalctl -u powerback.service -f --no-pager -o short-iso
```

## 🌐 **NGINX & Web Server**

```bash
# Test NGINX configuration
sudo nginx -t

# Reload NGINX configuration
sudo systemctl reload nginx

# Restart NGINX
sudo systemctl restart nginx

# Check NGINX status
sudo systemctl status nginx
```

## 🔧 **System & Maintenance**

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node
```

## 🧪 **Testing**

```bash
# Test API endpoint
curl -I -k https://powerback.us/api/sys/constants

# Test main site
curl -I -k https://powerback.us

# Check if port 2512 is listening
sudo netstat -tlnp | grep :2512
```

## 🔐 **Security & Files**

```bash
# Check environment file permissions
ls -la /etc/powerback/powerback.env

# Check secrets directory
ls -la /etc/powerback/secrets/

# Update secrets (edit the secure file; do not put REACT_APP_* here)
sudo nano /etc/powerback/secrets/powerback.env

# Update shared/public config (REACT_APP_* and other non-secret vars)
sudo nano /etc/powerback/public.env
```

## 🚨 **Emergency Commands**

```bash
# Kill all Node.js processes (emergency)
sudo pkill -f node

# Check system resources
htop

# View system logs
sudo journalctl -xe
```

## 🎨 **Colored Logs Setup**

```bash
# Create colored log viewer
sudo tee /usr/local/bin/powerback-logs > /dev/null << 'EOF'
#!/bin/bash
journalctl -u powerback.service -f | grep --color=always -E "(ERROR|WARN|INFO|DEBUG|\[.*\])"
EOF

sudo chmod +x /usr/local/bin/powerback-logs

# Add alias to bashrc
echo 'alias powerback-logs="sudo journalctl -u powerback.service -f | grep --color=always -E \"(ERROR|WARN|INFO|DEBUG|\\[.*\\])\""' >> ~/.bashrc
source ~/.bashrc
```

## 🔄 **Deployment Script Setup**

```bash
# Create secure deployment script
sudo tee /usr/local/bin/launch-powerback > /dev/null << 'EOF'
#!/bin/bash
echo "Deploying Powerback with fresh secrets..."

# Copy secrets from secure location
sudo cp /etc/powerback/secrets/powerback.env /etc/powerback/powerback.env
sudo chmod 600 /etc/powerback/powerback.env
sudo chown fc:fc /etc/powerback/powerback.env

# Restart service
sudo systemctl restart powerback.service

# Remove the file after restart
sleep 5
sudo rm /etc/powerback/powerback.env

echo "Deployment complete - secrets loaded and file removed"
EOF

sudo chmod +x /usr/local/bin/launch-powerback

# Create alias
echo 'alias launch="sudo /usr/local/bin/launch-powerback"' >> ~/.bashrc
source ~/.bashrc
```

## 📋 **Quick Reference**

| Command | Purpose |
|---------|---------|
| `launch` | Deploy with fresh secrets |
| `powerback-logs` | View colored live logs |
| `sudo systemctl status powerback.service` | Check service status |
| `sudo systemctl restart powerback.service` | Restart service |
| `sudo nginx -t` | Test NGINX configuration |
| `curl -I -k https://powerback.us/api/sys/constants` | Test API |

## Related Documentation

- [Production Setup](./production-setup.md) - Production setup guide
- [Deployment Automation](./deployment-automation.md) - Deployment process
- [Environment Management](./environment-management.md) - Environment configuration
- [Development Guide](./development.md) - Development setup
