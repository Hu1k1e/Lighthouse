# Lighthouse (Docker Update Checker)

Lighthouse is a comprehensive monitoring application designed to keep track of Docker containers running both locally and on remote hosts. It features a modern, premium dark-mode aesthetic (inspired by Tracearr), monitors Docker socket connections, discovers new image tags via remote registries (Docker Hub/GHCR), and pushes webhooks for container updates.

## Features
- **Local & Remote Monitoring**: Connects to the local `/var/run/docker.sock` and also queries lightweight helper agents on remote nodes.
- **Update Discovery**: Automatically scans registries for the latest semantic versions of your running containers.
- **Tracearr-Inspired UI**: A sleek, dark-mode dashboard built with Vite + React.
- **WUD (What's Up Docker) Triggers**: Supports sending notifications (like Discord webhooks) when updates are found, complete with parsed changelogs.

## Installation (Main App)

Lighthouse is designed to be deployed via Docker Compose.

1. Clone the repository:
   ```bash
   git clone https://github.com/Hu1k1e/Lighthouse.git
   cd Lighthouse
   ```

2. Start the application:
   ```bash
   docker compose up -d --build
   ```

3. Open your browser and navigate to `http://localhost:5173`.

---

## Remote Helper App Installation

If you want to monitor Docker containers on a different machine (e.g., a secondary VPS or a remote NAS), you can deploy the **Helper App** on that machine. The Helper App is a lightweight Python service that securely exposes read-only container status to the main Lighthouse dashboard.

### Deploying the Helper App

On your **remote machine**, create a `docker-compose.yml` file with the following contents:

```yaml
version: '3.8'

services:
  lighthouse-helper:
    image: python:3.11-slim
    container_name: lighthouse-helper
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      # Set a strong, random API key. You will need to enter this in the main Lighthouse UI.
      - HELPER_API_KEY=your_secure_api_key_here
    ports:
      - "8305:8000"
    command: >
      bash -c "pip install fastapi uvicorn docker && 
      wget -qO main.py https://raw.githubusercontent.com/Hu1k1e/Lighthouse/main/helper-app/main.py && 
      uvicorn main:app --host 0.0.0.0 --port 8000"
```
*(Alternatively, you can build the helper app directly from the `helper-app/` directory in this repo).*

### Linking the Helper App
Once the helper app is running on the remote machine (e.g., `http://192.168.1.50:8305`), open your main Lighthouse dashboard, navigate to **Settings**, and add a new Remote Host using that IP and the `HELPER_API_KEY` you defined.
