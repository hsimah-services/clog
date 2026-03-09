# Clog Local Development Setup (Windows)

This guide walks you through setting up the Clog development environment on a Windows laptop from scratch.

## What You'll Install

- **WSL2** (Windows Subsystem for Linux) - lets you run Linux inside Windows
- **Ubuntu** - the Linux distribution we'll use inside WSL2
- **Git** - version control
- **Docker Desktop** - runs all the project services (database, WordPress, etc.)
- **Claude Code** - AI coding assistant
- **Node.js** - JavaScript runtime (needed for Claude Code)

---

## Step 1: Install WSL2 and Ubuntu

### 1.1 Open PowerShell as Administrator

- Press the **Windows key** on your keyboard
- Type **PowerShell**
- Right-click **Windows PowerShell** and select **Run as administrator**
- Click **Yes** when prompted

### 1.2 Install WSL2 with Ubuntu

In the PowerShell window, type this command and press Enter:

```powershell
wsl --install
```

This will:
- Enable WSL2
- Download and install Ubuntu (the default Linux distribution)

**You will need to restart your computer when prompted.**

### 1.3 Set Up Ubuntu

After restarting:
- Ubuntu should open automatically. If it doesn't, search for **Ubuntu** in the Start menu and open it
- It will take a few minutes to finish installing
- You'll be asked to create a **username** - pick something simple (all lowercase, no spaces)
- You'll be asked to create a **password** - you'll need this occasionally, so remember it
  - Note: when typing your password, nothing will appear on screen - this is normal, just type it and press Enter

You now have a Linux terminal running inside Windows.

### 1.4 Update Ubuntu

In the Ubuntu terminal, run:

```bash
sudo apt update && sudo apt upgrade -y
```

Enter your password when prompted.

---

## Step 2: Install Git

Git should already be installed in Ubuntu, but let's make sure it's up to date and configured.

### 2.1 Install/Update Git

```bash
sudo apt install git -y
```

### 2.2 Configure Git

Replace the name and email with your own:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2.3 Set Up SSH Key for GitHub

You'll need an SSH key to clone private repositories.

#### Generate a new SSH key:

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

- Press **Enter** to accept the default file location
- Press **Enter** twice to skip setting a passphrase (or set one if you prefer)

#### Copy your public key:

```bash
cat ~/.ssh/id_ed25519.pub
```

This will display your public key. Select and copy the entire output (starts with `ssh-ed25519` and ends with your email).

#### Add the key to GitHub:

1. Go to [github.com](https://github.com) and sign in
2. Click your profile picture (top right) > **Settings**
3. In the left sidebar, click **SSH and GPG keys**
4. Click **New SSH key**
5. Give it a title (e.g., "Laptop WSL2")
6. Paste the key you copied into the **Key** field
7. Click **Add SSH key**

#### Test the connection:

```bash
ssh -T git@github.com
```

Type `yes` when asked about the fingerprint. You should see a message like "Hi username! You've successfully authenticated."

---

## Step 3: Install Docker Desktop

### 3.1 Download Docker Desktop

1. Open your web browser (in Windows, not in Ubuntu)
2. Go to [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
3. Click **Download for Windows**
4. Run the installer once it downloads

### 3.2 Install Docker Desktop

- Follow the installation prompts
- **Make sure "Use WSL 2 instead of Hyper-V" is checked** during installation
- Click **OK** / **Install**
- You may need to restart your computer again

### 3.3 Configure Docker Desktop for WSL2

1. Open **Docker Desktop** from the Start menu
2. Click the **gear icon** (Settings) in the top right
3. Go to **General** and confirm **"Use the WSL 2 based engine"** is checked
4. Go to **Resources** > **WSL Integration**
5. Make sure the toggle next to **Ubuntu** is turned ON
6. Click **Apply & Restart**

### 3.4 Verify Docker Works in WSL2

Open your Ubuntu terminal and run:

```bash
docker --version
docker compose version
```

Both commands should display version numbers. If `docker` is not found, close and reopen the Ubuntu terminal.

---

## Step 4: Clone the Clog Repository

### 4.1 Create a Projects Folder

In the Ubuntu terminal:

```bash
mkdir -p ~/projects
cd ~/projects
```

### 4.2 Clone the Repository

```bash
git clone git@github.com:hsimah/clog.git
cd clog
```

---

## Step 5: Create Environment Files

The project needs two `.env` files that aren't included in the repository. You'll create them now.

### 5.1 Create the Root `.env` File

```bash
cat > ~/projects/clog/.env << 'EOF'
# MySQL
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=wordpress
MYSQL_USER=wordpress
MYSQL_PASSWORD=wordpress

# WordPress
WORDPRESS_DB_HOST=db:3306
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=wordpress
WORDPRESS_DB_NAME=wordpress
WORDPRESS_TABLE_PREFIX=wp_
WORDPRESS_DEBUG=1

# GraphQL JWT Auth
GRAPHQL_JWT_AUTH_SECRET_KEY=clog-dev-jwt-secret-key-change-in-production

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
EOF
```

### 5.2 Create the Client `.env` File

```bash
cat > ~/projects/clog/client/.env << 'EOF'
VITE_GRAPHQL_URL=http://localhost:8080/graphql
EOF
```

---

## Step 6: Start Clog

### 6.1 Start All Services

Make sure Docker Desktop is running (check the system tray for the whale icon), then in the Ubuntu terminal:

```bash
cd ~/projects/clog
docker compose up -d
```

The first time you run this, it will download all the container images. This can take a few minutes depending on your internet speed.

### 6.2 Check That Everything Is Running

```bash
docker compose ps
```

You should see all services listed as "running":
- **db** - MySQL database
- **redis** - Redis cache
- **wordpress** - WordPress backend (port 8080)
- **phpmyadmin** - Database admin tool (port 8081)
- **mailpit** - Email testing (port 8025)
- **client** - React frontend (port 3000)

### 6.3 Access Clog in Your Browser

Open your web browser and go to:

- **React App**: [http://localhost:3000](http://localhost:3000)
- **WordPress Admin**: [http://localhost:8080/wp-admin](http://localhost:8080/wp-admin)
- **phpMyAdmin**: [http://localhost:8081](http://localhost:8081)
- **Mailpit**: [http://localhost:8025](http://localhost:8025)

### 6.4 Stopping Clog

When you're done working, stop the services with:

```bash
cd ~/projects/clog
docker compose down
```

---

## Step 7: Install Node.js

Claude Code requires Node.js. We'll install it using `nvm` (Node Version Manager) so it's easy to manage.

### 7.1 Install nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Close and reopen your Ubuntu terminal, then verify nvm is installed:

```bash
nvm --version
```

### 7.2 Install Node.js

```bash
nvm install --lts
```

Verify it worked:

```bash
node --version
npm --version
```

---

## Step 8: Install Claude Code

### 8.1 Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

### 8.2 Launch Claude Code

Navigate to the project and start Claude:

```bash
cd ~/projects/clog
claude
```

The first time you run Claude, it will open a browser window for you to log in with your Anthropic account. Follow the prompts to authenticate.

### 8.3 Using Claude Code

Once authenticated, you can use Claude directly in the terminal:
- Type your questions or requests and press Enter
- Claude can read, edit, and create files in the project
- Type `/help` for a list of available commands
- Press `Ctrl+C` to exit

---

## Quick Reference

### Daily Workflow

1. Open **Docker Desktop** (if not already running)
2. Open **Ubuntu** from the Start menu
3. Start the project:
   ```bash
   cd ~/projects/clog
   docker compose up -d
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser
5. To use Claude:
   ```bash
   cd ~/projects/clog
   claude
   ```
6. When done:
   ```bash
   docker compose down
   ```

### Useful Commands

| Command | What It Does |
|---|---|
| `docker compose up -d` | Start all services in the background |
| `docker compose down` | Stop all services |
| `docker compose ps` | Check which services are running |
| `docker compose logs -f client` | Watch the React app logs |
| `docker compose logs -f wordpress` | Watch the WordPress logs |
| `git pull` | Get the latest code changes |
| `git status` | See what files you've changed |
| `claude` | Start Claude Code |

### Troubleshooting

**Docker commands not working in Ubuntu?**
- Make sure Docker Desktop is running in Windows
- Check Docker Desktop Settings > Resources > WSL Integration > Ubuntu is ON
- Close and reopen the Ubuntu terminal

**Port already in use?**
- Another program might be using the same port
- Run `docker compose down` and try again

**Services won't start?**
- Check logs with `docker compose logs` to see error messages
- Try `docker compose down` then `docker compose up -d` again

**Can't connect to GitHub?**
- Make sure you've added your SSH key to GitHub (Step 2.3)
- Test with `ssh -T git@github.com`
