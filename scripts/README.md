# ERP System - Scripts Documentation

This directory contains automation scripts for development, deployment, maintenance, and administration of the ERP system.

## 📁 Directory Structure

```
scripts/
├── dev/                    # Development environment scripts
│   ├── setup.sh            # First-time setup for developers
│   ├── reset-db.sh         # Reset database to fresh state
│   ├── create-test-tenant.sh   # Create test tenant with sample data
│   └── generate-test-license.sh # Generate test license keys
│
├── deploy/                 # Deployment automation
│   ├── docker-deploy.sh    # Docker Compose deployment
│   ├── k8s-deploy.sh       # Kubernetes deployment
│   ├── build-images.sh     # Build Docker images
│   └── health-check.sh     # Verify deployment health
│
├── maintenance/            # System maintenance
│   ├── backup-db.sh        # Database backup
│   ├── restore-db.sh       # Database restore
│   └── rotate-logs.sh      # Log rotation
│
├── admin/                  # Administrative tasks
│   ├── list-tenants.sh     # List all tenants
│   ├── generate-license.sh # Generate production licenses
│   └── revoke-license.sh   # Revoke license keys
│
└── utils/                  # Utility scripts
    ├── check-ports.sh      # Check port availability
    ├── validate-env.sh     # Validate environment variables
    ├── db-migrate.sh       # Database migrations
    └── seed-data.sh        # Database seeding
```

## 🚀 Quick Start

### First-Time Setup

```bash
# Run the complete development setup
pnpm setup
# or
./scripts/dev/setup.sh
```

This will:
- Check prerequisites (Node.js, Docker, pnpm)
- Install dependencies
- Configure environment files
- Start PostgreSQL and Redis
- Run database migrations
- Seed demo data

### Common Commands

```bash
# Start development servers
pnpm dev

# Reset database
pnpm db:reset

# Create a test tenant
pnpm tenant:create -- --name "Test Corp" --tier L2

# Check deployment health
pnpm deploy:check
```

## 📜 Script Reference

### Development Scripts

#### `setup.sh`
Complete first-time setup for developers.

```bash
./scripts/dev/setup.sh [OPTIONS]

Options:
  -y, --yes           Skip confirmation prompts
  -s, --skip-docker   Skip Docker service startup
  --no-seed           Skip database seeding
  -v, --verbose       Show detailed output
```

#### `reset-db.sh`
Reset database to fresh state.

```bash
./scripts/dev/reset-db.sh [OPTIONS]

Options:
  -y, --yes       Skip confirmation
  --no-seed       Skip seeding after reset
  --force         Skip pre-reset backup
```

⚠️ **Warning**: This deletes all data!

#### `create-test-tenant.sh`
Create a test tenant with sample data.

```bash
./scripts/dev/create-test-tenant.sh --name "Company Name" [OPTIONS]

Options:
  -n, --name          Company name (required)
  -t, --tier          L1, L2, or L3 (default: L1)
  -u, --users         Number of users (default: 5)
  -p, --products      Number of products (default: 50)
  --admin-email       Admin email address
  --dry-run           Preview without creating
```

#### `generate-test-license.sh`
Generate test license keys.

```bash
./scripts/dev/generate-test-license.sh --tenant-id <uuid> [OPTIONS]

Options:
  -t, --tenant-id     Tenant UUID (required)
  --tier              L1, L2, or L3 (default: L1)
  -e, --expires       Expiration date (YYYY-MM-DD)
  -o, --output        Output file path
  --json              Output as JSON only
```

### Deployment Scripts

#### `docker-deploy.sh`
Deploy using Docker Compose.

```bash
./scripts/deploy/docker-deploy.sh [OPTIONS]

Options:
  -e, --env           Environment: dev, staging, prod
  -b, --build         Force rebuild images
  -m, --migrate       Run database migrations
  -s, --seed          Seed database
  --dry-run           Preview deployment
  --rollback          Rollback to previous
```

#### `k8s-deploy.sh`
Deploy to Kubernetes cluster.

```bash
./scripts/deploy/k8s-deploy.sh [OPTIONS]

Options:
  -n, --namespace     Kubernetes namespace
  -c, --context       kubectl context
  -t, --tag           Image tag to deploy
  --dry-run           Preview deployment
  --rollback          Rollback deployment
```

#### `build-images.sh`
Build all Docker images.

```bash
./scripts/deploy/build-images.sh [OPTIONS]

Options:
  -t, --tag           Image tag (default: git hash)
  -v, --version       Semantic version
  -r, --registry      Container registry URL
  -p, --push          Push to registry
  --no-cache          Build without cache
```

#### `health-check.sh`
Verify deployment health.

```bash
./scripts/deploy/health-check.sh [OPTIONS]

Options:
  -e, --env           Environment to check
  -u, --url           Custom API URL
  --json              Output as JSON
  --timeout           Request timeout (seconds)
```

### Maintenance Scripts

#### `backup-db.sh`
Create database backup.

```bash
./scripts/maintenance/backup-db.sh [OPTIONS]

Options:
  -o, --output        Output directory
  -k, --keep          Keep backups for N days
  --upload            Upload to cloud storage
  --no-compress       Don't compress backup
```

#### `restore-db.sh`
Restore from backup.

```bash
./scripts/maintenance/restore-db.sh [OPTIONS]

Options:
  -f, --file          Backup file to restore
  -l, --list          List available backups
  --no-backup         Skip pre-restore backup
  --force             Skip confirmation
```

#### `rotate-logs.sh`
Rotate and compress logs.

```bash
./scripts/maintenance/rotate-logs.sh [OPTIONS]

Options:
  -d, --dir           Log directory
  -k, --keep          Keep logs for N days
  --dry-run           Preview changes
```

### Admin Scripts

#### `list-tenants.sh`
List all tenants.

```bash
./scripts/admin/list-tenants.sh [OPTIONS]

Options:
  -t, --tier          Filter by tier
  -s, --status        Filter by status
  --csv               Output as CSV
  --json              Output as JSON
```

#### `generate-license.sh`
Generate production license.

```bash
./scripts/admin/generate-license.sh --tenant-id <uuid> --tier <tier> [OPTIONS]

Options:
  -t, --tenant-id     Tenant UUID (required)
  --tier              L1, L2, L3 (required)
  -e, --expires       Expiration date
  -u, --max-users     Maximum users
  --email             Email to customer
```

#### `revoke-license.sh`
Revoke a license.

```bash
./scripts/admin/revoke-license.sh [OPTIONS]

Options:
  -l, --license-id    License UUID to revoke
  -t, --tenant-id     Revoke all for tenant
  --notify            Send notification
  --reason            Revocation reason
```

### Utility Scripts

#### `check-ports.sh`
Check port availability.

```bash
./scripts/utils/check-ports.sh [OPTIONS]

Options:
  -k, --kill          Kill conflicting processes
```

#### `validate-env.sh`
Validate environment configuration.

```bash
./scripts/utils/validate-env.sh [OPTIONS]

Options:
  -e, --env           Environment to validate
  --check-db          Test database connection
  --check-redis       Test Redis connection
```

#### `db-migrate.sh`
Database migration wrapper.

```bash
./scripts/utils/db-migrate.sh [COMMAND] [OPTIONS]

Commands:
  up                  Apply migrations (default)
  down                Rollback migration
  status              Show migration status
  reset               Reset and reapply
  generate            Generate new migration

Options:
  --backup            Backup before migrating
  --dry-run           Preview changes
  --name              Migration name (for generate)
```

#### `seed-data.sh`
Seed database with data.

```bash
./scripts/utils/seed-data.sh [OPTIONS]

Options:
  -t, --type          minimal, demo, full (default: demo)
  --tenant-id         Seed specific tenant
  --clean             Clear before seeding
```

## 🔧 npm/pnpm Scripts

The following scripts are available via `pnpm`:

```bash
# Development
pnpm setup              # First-time setup
pnpm dev                # Start dev servers
pnpm build              # Build all packages

# Database
pnpm db:reset           # Reset database
pnpm db:seed            # Seed demo data
pnpm db:migrate         # Run migrations
pnpm db:backup          # Create backup

# Tenant Management
pnpm tenant:create      # Create test tenant
pnpm license:generate   # Generate test license

# Deployment
pnpm deploy:docker      # Docker deployment
pnpm deploy:k8s         # Kubernetes deployment
pnpm deploy:check       # Health check

# Utilities
pnpm check:ports        # Check port availability
pnpm check:env          # Validate environment
```

## 🎨 Output Colors

Scripts use colored output for better readability:

- 🔵 **Blue (ℹ)**: Information
- 🟢 **Green (✓)**: Success
- 🟡 **Yellow (⚠)**: Warning
- 🔴 **Red (✗)**: Error

## 📝 Logging

All scripts log to:
- **Console**: Colored, human-readable output
- **File**: `logs/<script>-<timestamp>.log`

## 🔒 Security Notes

- Never commit `.env` files to version control
- Production secrets should be in secure vaults
- License keys should be transmitted securely
- Backup files may contain sensitive data

## 🐛 Troubleshooting

### Script permissions
```bash
chmod +x scripts/**/*.sh
```

### Docker issues
```bash
# Check Docker is running
docker info

# Check containers
docker-compose ps
```

### Database connection
```bash
# Test connection
./scripts/utils/validate-env.sh --check-db
```

### Port conflicts
```bash
# Find and fix port conflicts
./scripts/utils/check-ports.sh --kill
```

## 📚 Related Documentation

- [Main README](../README.md) - Project overview
- [Deployment Guide](../docs/deployment.md) - Detailed deployment instructions
- [Logging Guide](../docs/logging-guide.md) - Logging best practices

