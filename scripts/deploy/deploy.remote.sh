#!/usr/bin/env bash
set -e

########################################
# CONFIG
########################################

REMOTE_HOST="67.208.42.154"
REMOTE_USER="deploy"
#SSH_KEY="$HOME/.ssh/id_ed25519_deploy"
SSH_KEY="$HOME/.ssh/id_ed25519"

# Future-proof paths: can switch from /home/deploy/app to /opt/powerback/app
APP_ROOT="/opt/powerback/app"
REMOTE_BACKEND_DIR="$APP_ROOT"
REMOTE_FRONTEND_DIR="/home/deploy/public_html"

# Persistent storage paths
PERSISTENT_DATA_DIR="/var/lib/powerback"
PFP_PERSIST="$PERSISTENT_DATA_DIR/pfp"

SYSTEMD_SERVICE="powerback.service"

########################################
# STEP 1 - Verify correct branch
########################################

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "beta" ]; then
  echo "Error: Must deploy from beta branch. Current: $BRANCH"
  exit 1
fi

########################################
# STEP 2 - Run linter
########################################

echo "==> Running linter..."
if ! npm run lint; then
  echo "Error: Linter failed. Fix linting errors before deploying."
  exit 1
fi

########################################
# STEP 3 - Backend deploy
########################################

echo "==> Syncing backend to remote server..."

rsync -av \
  --delete \
  --exclude "client/" \
  --exclude "docs/" \
  --exclude "specs/" \
  --exclude "scripts/" \
  --exclude "tests*" \
  --exclude "__tests__/" \
  --exclude "test/" \
  --exclude "tests-examples/" \
  --exclude "snapshots/" \
  --exclude "node_modules/" \
  --exclude "*.md" \
  --exclude ".env" \
  -e "ssh -i $SSH_KEY" \
  ./ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_BACKEND_DIR/

########################################
# STEP 4 - Create version file
########################################

echo "==> Creating version file..."
COMMIT=$(git rev-parse HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

cat > .version.json <<EOF
{
  "commit": "$COMMIT",
  "branch": "$BRANCH",
  "deployedAt": "$DATE",
  "packageVersion": "$PACKAGE_VERSION"
}
EOF

echo "==> Version file created: commit=$COMMIT, branch=$BRANCH"

########################################
# STEP 5 - Upload package-lock.json
########################################

echo "==> Uploading package-lock.json (backend)..."
scp -i "$SSH_KEY" package-lock.json \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_BACKEND_DIR/

########################################
# STEP 6 - Install backend dependencies
########################################

echo "==> Running npm ci on backend..."
ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "bash -c '
  # Create npm cache directory for powerback user (no home directory needed)
  sudo mkdir -p /var/cache/npm-powerback &&
  sudo chown powerback:powerback /var/cache/npm-powerback &&
  sudo chmod 700 /var/cache/npm-powerback &&
  
  # Run npm ci as powerback user with custom cache location
  cd $REMOTE_BACKEND_DIR &&
  sudo -u powerback npm ci --omit=dev --cache /var/cache/npm-powerback
'"

########################################
# STEP 7 - Build frontend
########################################

echo "==> Building frontend locally..."
cd client
npm install
npm run build
cd ..

########################################
# STEP 8 - Upload frontend build
########################################

echo "==> Syncing frontend build to remote..."

rsync -av \
  --delete \
  -e "ssh -i $SSH_KEY" \
  ./client/build/ \
  $REMOTE_USER@$REMOTE_HOST:$REMOTE_FRONTEND_DIR/

########################################
# STEP 9 - Setup persistent data directories and migrate data
########################################

echo "==> Setting up persistent data directories and migrating data..."

ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "
  sudo mkdir -p $PERSISTENT_DATA_DIR/deltas $PERSISTENT_DATA_DIR/snapshots &&
  sudo chown -R powerback:powerback $PERSISTENT_DATA_DIR &&
  sudo chmod -R 750 $PERSISTENT_DATA_DIR &&
  sudo chmod -R 770 $PERSISTENT_DATA_DIR/deltas $PERSISTENT_DATA_DIR/snapshots &&
  
  if [ -d $REMOTE_BACKEND_DIR/jobs/deltas ] && [ \"\$(ls -A $REMOTE_BACKEND_DIR/jobs/deltas 2>/dev/null)\" ]; then
    echo 'Migrating delta files...' &&
    sudo cp -r $REMOTE_BACKEND_DIR/jobs/deltas/* $PERSISTENT_DATA_DIR/deltas/ 2>/dev/null || true
  fi &&
  
  if [ -d $REMOTE_BACKEND_DIR/snapshots ] && [ \"\$(ls -A $REMOTE_BACKEND_DIR/snapshots 2>/dev/null)\" ]; then
    echo 'Migrating snapshot files...' &&
    sudo cp -r $REMOTE_BACKEND_DIR/snapshots/* $PERSISTENT_DATA_DIR/snapshots/ 2>/dev/null || true
  fi &&
  
  sudo chown -R powerback:powerback $PERSISTENT_DATA_DIR &&
  
  sudo chown -R deploy:deploy $REMOTE_FRONTEND_DIR &&
  sudo chmod -R 755 $REMOTE_FRONTEND_DIR &&
  
  # App directory: owned by deploy:powerback with group write (775)
  # This allows deploy user to write via rsync, and powerback group to write for npm installs
  sudo chown -R deploy:powerback $REMOTE_BACKEND_DIR &&
  sudo find $REMOTE_BACKEND_DIR -type d -exec chmod 775 {} \; &&
  sudo find $REMOTE_BACKEND_DIR -type f -exec chmod 664 {} \; &&
  
  sudo chmod 751 /home/deploy
"

########################################
# STEP 10 - Persist pfp (user uploads)
########################################

echo "==> Setting up persistent pfp storage and symlink..."

ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "
  # Migrate existing files from old deploy tree location (idempotent - safe to run repeatedly)
  if [ -d $APP_ROOT/client/public/pfp ] && [ ! -L $APP_ROOT/client/public/pfp ] && [ \"\$(ls -A $APP_ROOT/client/public/pfp 2>/dev/null)\" ]; then
    echo 'Migrating existing pfp files to persistent storage...' &&
    sudo rsync -a $APP_ROOT/client/public/pfp/ $PFP_PERSIST/ || true
  fi &&
  
  # Ensure persistent pfp directory exists
  sudo mkdir -p $PFP_PERSIST &&
  sudo chown -R powerback:powerback $PFP_PERSIST &&
  sudo chmod 2775 $PFP_PERSIST &&
  
  # Ensure public dir exists in app tree
  sudo mkdir -p $APP_ROOT/client/public &&
  
  # Replace pfp in app tree with symlink
  sudo rm -rf $APP_ROOT/client/public/pfp &&
  sudo ln -s $PFP_PERSIST $APP_ROOT/client/public/pfp &&
  
  # Sanity check (should print the symlink)
  ls -l $APP_ROOT/client/public/pfp
"

########################################
# STEP 11 - Deploy GitHub Actions wrapper script
########################################

echo "==> Deploying GitHub Actions wrapper script..."
scp -i "$SSH_KEY" scripts/deploy/gh-actions-wrapper.sh \
  $REMOTE_USER@$REMOTE_HOST:/tmp/gh-actions-wrapper.sh

ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "
  sudo mkdir -p /home/deploy/bin &&
  sudo mv /tmp/gh-actions-wrapper.sh /home/deploy/bin/gh-actions-wrapper.sh &&
  sudo chmod +x /home/deploy/bin/gh-actions-wrapper.sh &&
  sudo chown deploy:deploy /home/deploy/bin/gh-actions-wrapper.sh &&
  echo 'GitHub Actions wrapper script deployed successfully'
"

########################################
# STEP 12 - Update systemd service file
########################################

echo "==> Updating systemd service file..."
ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "
  # Update WorkingDirectory and fix ExecStart path if service file exists
  if [ -f /etc/systemd/system/$SYSTEMD_SERVICE ]; then
    # Update WorkingDirectory
    sudo sed -i \"s|WorkingDirectory=.*|WorkingDirectory=$APP_ROOT|\" /etc/systemd/system/$SYSTEMD_SERVICE &&
    echo 'Updated WorkingDirectory in service file' &&
    
    # Fix common typo: /user/bin/node -> /usr/bin/node
    sudo sed -i 's|/user/bin/node|/usr/bin/node|g' /etc/systemd/system/$SYSTEMD_SERVICE &&
    
    # Find correct node path if ExecStart uses /usr/bin/node (may not be correct)
    NODE_PATH=\$(which node 2>/dev/null || command -v node 2>/dev/null || echo '')
    if [ -n \"\$NODE_PATH\" ] && grep -q '/usr/bin/node' /etc/systemd/system/$SYSTEMD_SERVICE; then
      # Update to use found node path if different
      sudo sed -i \"s|ExecStart=/usr/bin/node|ExecStart=\$NODE_PATH|g\" /etc/systemd/system/$SYSTEMD_SERVICE &&
      echo \"Updated ExecStart to use node at: \$NODE_PATH\"
    fi &&
    
    # Update ExecStartPost to output security score directly (visible in journal)
    # Remove logger wrapper so output appears in systemctl status/journalctl
    if grep -q 'ExecStartPost.*powerback-security-score' /etc/systemd/system/$SYSTEMD_SERVICE; then
      sudo sed -i 's|ExecStartPost=.*powerback-security-score.*|ExecStartPost=/usr/local/bin/powerback-security-score powerback.service|g' /etc/systemd/system/$SYSTEMD_SERVICE &&
      echo 'Updated ExecStartPost to output security score directly'
    fi &&
    
    echo 'Service file updated successfully'
  else
    echo 'Warning: Service file not found at /etc/systemd/system/$SYSTEMD_SERVICE'
  fi
"

########################################
# STEP 13 - Restart backend
########################################

echo "==> Restarting backend service..."
ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "
  sudo systemctl daemon-reload &&
  sudo systemctl restart $SYSTEMD_SERVICE
"

########################################
# STEP 14 - Security score logging
########################################

echo "==> Logging security score..."
ssh -i "$SSH_KEY" $REMOTE_USER@$REMOTE_HOST "
  sudo mkdir -p /var/log/powerback &&
  /usr/local/bin/powerback-security-score $SYSTEMD_SERVICE | sudo tee -a /var/log/powerback/deploy.log >/dev/null
"

########################################
# STEP 15 - Health check
########################################

echo "==> Checking health endpoint..."
sleep 2
curl https://powerback.us/api/health || echo "Warning: Health endpoint unavailable."

echo "==> Deployment complete!"

