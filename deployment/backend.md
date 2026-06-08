# Backend Deployment — Google Cloud (e2-micro)

Deploy the backend on a GCP e2-micro VM (Always Free tier) using Docker images pushed to Docker Hub.

## Architecture

```
Local machine
  └── docker build + push → Docker Hub

GCP e2-micro VM
  └── docker compose pull + up
        ├── postgres   (data on VM persistent disk)
        ├── flyway     (runs migrations on startup)
        ├── backend    (your pushed image)
        └── backup     (pg_dump → Google Drive)
```

---

## One-time setup

### 1. Create the GCP VM

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **Compute Engine** → **VM Instances** → **Create**
2. Set:
   - **Machine type**: `e2-micro`
   - **Region**: `us-east1`, `us-west1`, or `us-central1` (required for Always Free)
   - **Boot disk**: Debian 12, 30 GB standard persistent disk (free tier)
   - **Firewall**: check **Allow HTTP traffic** and **Allow HTTPS traffic**
3. Under **Networking** → **Network interfaces** → reserve a static external IP (optional, ~$3/month) or note the ephemeral IP

### 2. Install Docker on the VM

SSH into the VM (via GCP Console browser SSH or `gcloud compute ssh`):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

Install Docker Compose plugin:

```bash
sudo apt-get install -y docker-compose-plugin
docker compose version
```

### 3. Build and push images to Docker Hub

On your **local machine**:

```bash
# Login to Docker Hub
docker login

# Build and push backend
docker build -t <your-dockerhub-username>/my-calendar-backend:latest \
  --target production ./backend
docker push <your-dockerhub-username>/my-calendar-backend:latest

# Build and push flyway (migrations baked in)
docker build -t <your-dockerhub-username>/my-calendar-flyway:latest ./db
docker push <your-dockerhub-username>/my-calendar-flyway:latest

# Build and push backup sidecar
docker build -t <your-dockerhub-username>/my-calendar-backup:latest \
  ./deployment/backup
docker push <your-dockerhub-username>/my-calendar-backup:latest
```

> After publishing a GitHub release, the workflow builds and pushes all images automatically — manual builds above are only needed outside of a release.

### 4. Configure the VM

SSH into the VM and create the app directory:

```bash
mkdir -p ~/my-calendar/secrets
cd ~/my-calendar
```

Create the `.env` file:

```bash
nano .env
```

Paste and fill in your values:

```
POSTGRES_DB=my_calendar
POSTGRES_USER=calendar_user
POSTGRES_PASSWORD=<strong-password>

BACKUP_GOOGLE_DRIVE_FOLDER_ID=<your-drive-folder-id>
BACKUP_SCHEDULE_TIME=02:00
BACKUP_RETENTION_DAYS=7
```

Save with `Ctrl+O` → `Enter` → `Ctrl+X`.

Create the service account key file:

```bash
nano ~/my-calendar/secrets/service-account.json
```

Paste the full contents of your Google service account JSON key, then save.

### 5. Create `docker-compose.yml`

```bash
nano ~/my-calendar/docker-compose.yml
```

Paste:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: my-calendar-db
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  flyway:
    image: nhantran1245/my-calendar-flyway:latest
    platform: linux/amd64
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      FLYWAY_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      FLYWAY_USER: ${POSTGRES_USER}
      FLYWAY_PASSWORD: ${POSTGRES_PASSWORD}
      FLYWAY_LOCATIONS: filesystem:/flyway/sql
      FLYWAY_BASELINE_ON_MIGRATE: "true"
    command: migrate

  backend:
    image: nhantran1245/my-calendar-backend:latest
    container_name: my-calendar-backend
    depends_on:
      flyway:
        condition: service_completed_successfully
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: ${POSTGRES_DB}
      DATABASE_USER: ${POSTGRES_USER}
      DATABASE_PASSWORD: ${POSTGRES_PASSWORD}
      PORT: 3000
      NODE_ENV: production
      TZ: Asia/Ho_Chi_Minh
    ports:
      - "3000:3000"
    restart: unless-stopped

  # backup:
  #   image: nhantran1245/my-calendar-backup:latest
  #   container_name: my-calendar-backup
  #   depends_on:
  #     postgres:
  #       condition: service_healthy
  #   environment:
  #     POSTGRES_HOST: postgres
  #     POSTGRES_PORT: 5432
  #     POSTGRES_DB: ${POSTGRES_DB}
  #     POSTGRES_USER: ${POSTGRES_USER}
  #     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  #     BACKUP_GOOGLE_DRIVE_FOLDER_ID: ${BACKUP_GOOGLE_DRIVE_FOLDER_ID}
  #     BACKUP_SERVICE_ACCOUNT_JSON: /secrets/service-account.json
  #     BACKUP_SCHEDULE_TIME: ${BACKUP_SCHEDULE_TIME:-02:00}
  #     BACKUP_RETENTION_DAYS: ${BACKUP_RETENTION_DAYS:-7}
  #     TZ: Asia/Ho_Chi_Minh
  #   volumes:
  #     - ./secrets/service-account.json:/secrets/service-account.json:ro
  #   restart: unless-stopped

volumes:
  postgres_data:
```

### 6. Start the stack

```bash
cd ~/my-calendar
docker compose pull
docker compose up -d
docker compose logs -f
```

### 7. Get your public URL

Your backend is accessible at:

```
http://<VM_EXTERNAL_IP>:3000
```

Test it:

```bash
curl http://<VM_EXTERNAL_IP>:3000/api/events
```

To use HTTPS, put Nginx + Certbot in front of port 3000 (optional for a personal app).

### 8. Note the URL — you will need it in the next steps

```
EXPO_PUBLIC_API_URL=http://<VM_EXTERNAL_IP>:3000/api
```

---

## Redeploying after changes

The recommended way is to **publish a GitHub release** — the workflow builds and pushes all images automatically.

Then on the VM:

```bash
cd ~/my-calendar
docker compose pull
docker compose up -d
```

### After adding a new migration

A new migration changes the Flyway image. On the VM, restart Flyway to apply it:

```bash
docker compose pull flyway
docker compose up -d flyway
# flyway runs and exits once migrations are applied; backend picks up automatically
```

---

## Cost

| Resource | Cost |
|---|---|
| e2-micro VM (us-east1) | Free (Always Free tier) |
| 30 GB standard persistent disk | Free (Always Free tier) |
| Static external IP | ~$3/month (optional) |
| Docker Hub (public repo) | Free |
| Google Drive backup storage | Free up to 15 GB |

**Total: $0–3/month** depending on whether you reserve a static IP.

---

## e2-micro memory tip

614 MB RAM is tight. If the backend crashes with OOM, limit Node memory:

```yaml
# in docker-compose.yml under backend environment:
NODE_OPTIONS: --max-old-space-size=256
```
