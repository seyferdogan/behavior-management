# School Server Deployment Guide
## Running on School's Existing Computer/Server

### Overview
This guide shows how to deploy the behavior management system on the school's existing computer or server. This is the **simplest, most cost-effective** solution for a single school.

### Prerequisites
- **Windows, Mac, or Linux** computer/server at the school
- **Internet connection** (for initial setup and updates)
- **Basic computer knowledge** (or IT support)
- **Local network** (WiFi/LAN) for access

---

## Option 1: Windows Server/Computer

### Step 1: Install Required Software

#### Install Node.js
1. Download Node.js from https://nodejs.org/
2. Choose **LTS version** (18.x or 20.x)
3. Run installer and follow prompts
4. Verify installation:
```cmd
node --version
npm --version
```

#### Install Git (if not already installed)
1. Download from https://git-scm.com/
2. Install with default settings
3. Verify: `git --version`

### Step 2: Download and Setup Application

```cmd
# Create folder for the application
mkdir C:\BehaviorSystem
cd C:\BehaviorSystem

# Download your project (replace with your actual repo)
git clone https://github.com/yourusername/behavior-management-system.git
cd behavior-management-system

# Install backend dependencies
cd behavior-management-backend
npm install

# Install frontend dependencies
cd ..\behavior_system
npm install

# Build frontend for production
npm run build
```

### Step 3: Configure Environment

```cmd
# Go back to backend folder
cd ..\behavior-management-backend

# Create environment file
copy .env.example .env
```

Edit the `.env` file:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=file:./prisma/production.db
JWT_SECRET=your-super-secret-key-here
FRONTEND_URL=http://school-server-ip:3000
```

### Step 4: Setup Database

```cmd
# Initialize database
npx prisma migrate dev
npx prisma db seed
```

### Step 5: Install PM2 (Process Manager)

```cmd
# Install PM2 globally
npm install -g pm2

# Start the backend service
pm2 start src/app.js --name "behavior-backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 6: Setup Frontend Server

```cmd
# Install serve globally
npm install -g serve

# Start frontend server
pm2 start "serve -s build -l 3000" --name "behavior-frontend"

# Save configuration
pm2 save
```

### Step 7: Configure Windows Firewall

1. Open **Windows Defender Firewall**
2. Click **"Allow an app through firewall"**
3. Add these applications:
   - **Node.js** (allow on private network)
   - **Port 3000** (frontend)
   - **Port 5000** (backend)

### Step 8: Access the Application

- **Frontend**: `http://school-server-ip:3000`
- **Backend API**: `http://school-server-ip:5000`

**To find the server IP:**
```cmd
ipconfig
```
Look for the IP address (usually starts with 192.168.x.x or 10.x.x.x)

---

## Option 2: Mac Server/Computer

### Step 1: Install Required Software

#### Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install Node.js
```bash
brew install node
```

#### Install Git
```bash
brew install git
```

### Step 2: Download and Setup Application

```bash
# Create folder for the application
mkdir ~/BehaviorSystem
cd ~/BehaviorSystem

# Download your project
git clone https://github.com/yourusername/behavior-management-system.git
cd behavior-management-system

# Install dependencies
cd behavior-management-backend && npm install
cd ../behavior_system && npm install

# Build frontend
npm run build
```

### Step 3: Configure Environment

```bash
cd ../behavior-management-backend
cp .env.example .env
nano .env  # Edit with your settings
```

### Step 4: Setup Database

```bash
npx prisma migrate dev
npx prisma db seed
```

### Step 5: Install PM2

```bash
npm install -g pm2

# Start backend
pm2 start src/app.js --name "behavior-backend"

# Start frontend
pm2 start "serve -s build -l 3000" --name "behavior-frontend"

# Save and setup startup
pm2 save
pm2 startup
```

### Step 6: Configure Mac Firewall

1. Go to **System Preferences > Security & Privacy > Firewall**
2. Click **"Firewall Options"**
3. Add Node.js and allow incoming connections

---

## Option 3: Linux Server

### Step 1: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y
```

### Step 2: Download and Setup Application

```bash
# Create folder
mkdir ~/BehaviorSystem
cd ~/BehaviorSystem

# Download project
git clone https://github.com/yourusername/behavior-management-system.git
cd behavior-management-system

# Install dependencies
cd behavior-management-backend && npm install
cd ../behavior_system && npm install

# Build frontend
npm run build
```

### Step 3: Configure Environment

```bash
cd ../behavior-management-backend
cp .env.example .env
nano .env  # Edit with your settings
```

### Step 4: Setup Database

```bash
npx prisma migrate dev
npx prisma db seed
```

### Step 5: Install PM2

```bash
sudo npm install -g pm2

# Start services
pm2 start src/app.js --name "behavior-backend"
pm2 start "serve -s build -l 3000" --name "behavior-frontend"

# Save and setup startup
pm2 save
pm2 startup
```

### Step 6: Configure UFW Firewall

```bash
sudo ufw allow 3000
sudo ufw allow 5000
sudo ufw enable
```

---

## Network Access Setup

### Find Server IP Address

**Windows:**
```cmd
ipconfig
```

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### Access from School Computers

1. **Open web browser** on any school computer
2. **Navigate to**: `http://server-ip:3000`
3. **Example**: `http://192.168.1.100:3000`

### Access from Mobile Devices

- **Same URL**: `http://server-ip:3000`
- **Must be on school WiFi/LAN**

---

## Maintenance and Management

### Check Service Status
```bash
pm2 status
pm2 logs
```

### Restart Services
```bash
pm2 restart all
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
cd behavior-management-backend && npm install
cd ../behavior_system && npm install

# Rebuild frontend
npm run build

# Restart services
pm2 restart all
```

### Backup Database
```bash
# Create backup folder
mkdir ~/backups

# Backup script
#!/bin/bash
cp behavior-management-backend/prisma/production.db ~/backups/backup_$(date +%Y%m%d_%H%M%S).db
```

---

## Security Considerations

### Basic Security
1. **Strong JWT Secret**: Use a long, random string
2. **Regular Updates**: Keep Node.js and dependencies updated
3. **Firewall**: Only allow necessary ports
4. **Backups**: Regular database backups

### Network Security
- **Local network only**: Don't expose to internet
- **School WiFi**: Use school's secure network
- **Access control**: Limit who can access the server

---

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Kill the process or change port
```

**2. Service Won't Start**
```bash
# Check logs
pm2 logs

# Check if Node.js is installed
node --version
```

**3. Can't Access from Other Computers**
- Check firewall settings
- Verify IP address
- Ensure computers are on same network

**4. Database Issues**
```bash
# Reset database
npx prisma migrate reset
npx prisma db seed
```

---

## Cost Breakdown

### One-Time Costs
- **Server/Computer**: Use existing school equipment
- **Setup time**: 2-4 hours
- **Training**: 1-2 hours

### Ongoing Costs
- **Electricity**: Minimal (existing computer)
- **Maintenance**: 1-2 hours/month
- **Updates**: As needed

**Total Cost: $0** (using existing equipment)

---

## Benefits of This Approach

✅ **Zero ongoing costs**
✅ **Full control** over the system
✅ **No internet dependency** (after setup)
✅ **Fast access** (local network)
✅ **Easy maintenance**
✅ **Secure** (local network only)
✅ **Scalable** (can add more features)

---

## Next Steps

1. **Choose your server platform** (Windows/Mac/Linux)
2. **Follow the setup guide** for your platform
3. **Test the application** locally first
4. **Configure network access**
5. **Train school staff**
6. **Go live!**

This approach gives you a professional, reliable system with zero ongoing costs! 