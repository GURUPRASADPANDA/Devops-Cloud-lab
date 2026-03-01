# 🚀 DevOps Sandbox

> **A production-grade local AWS DevOps Training Platform**  
> Simulate real AWS workflows entirely on your laptop using LocalStack, Terraform, Ansible, and Docker.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                       Host Machine                             │
│                                                                │
│  ┌─────────────┐    ┌────────────────────────────────────────┐ │
│  │   sandbox   │    │         Docker Network                 │ │
│  │    CLI      │    │                                        │ │
│  │  (Python)   │    │ ┌──────────┐    ┌──────────────────┐   │ │
│  └──────┬──────┘    │ │   UI     │    │   Backend API    │   │ │
│         │           │ │ React +  │◄──►│  Node.js/Express │   │ │
│  ┌──────▼──────┐    │ │ Tailwind │    │   :3001          │   │ │
│  │ Web Browser │    │ │  :3000   │    └────────┬─────────┘   │ │
│  │ :80 / :3000 │    │ └──────────┘             │             │ │
│  └─────────────┘    │                     ┌────▼──────────┐  │ │
│                     │  ┌──────────────┐   │  LocalStack   │  │ │
│                     │  │  Terraform   │──►│  (AWS mock)   │  │ │
│                     │  │  Container   │   │   :4566       │  │ │
│                     │  └──────────────┘   │               │  │ │
│                     │                     │  ┌──────────┐ │  │ │
│                     │  ┌──────────────┐   │  │  VPC     │ │  │ │
│                     │  │   Ansible    │──►│  │  EC2     │ │  │ │
│                     │  │  Container   │   │  │  S3      │ │  │ │
│                     │  └──────────────┘   │  │ DynamoDB │ │  │ │
│                     │                     │  │  IAM     │ │  │ │
│                     │  ┌──────────────┐   │  └──────────┘ │  │ │
│                     │  │  Nginx (RP)  │   └───────────────┘  │ │
│                     │  └──────────────┘                      │ │
│                     └────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## DevOps Pipeline Flow

```
CLI / UI
   │
   ▼
Backend API (Docker exec)
   │
   ├──► Terraform ──► LocalStack ──► VPC + EC2 + S3 + DynamoDB + IAM
   │         │
   │         └──► terraform output (state)
   │
   └──► Ansible ──► Dynamic Inventory ──► Configure EC2
              │
              └──► Install Nginx + Docker + Deploy App
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker | ≥ 24.0 | With Docker Compose v2 |
| Python | ≥ 3.10 | For the CLI |
| pip | latest | For CLI install |
| 4 GB RAM | — | For LocalStack + all containers |

---

## Quick Start (One Command)

```bash
# Clone the repo
git clone https://github.com/your-org/devops-sandbox.git
cd devops-sandbox

# Copy env file
cp .env.example .env

# Install CLI
make install-cli

# Run full deployment pipeline
make deploy
```

That's it. The full pipeline runs automatically:
1. Starts LocalStack + all containers
2. Runs `terraform apply` to provision VPC, EC2, S3, DynamoDB, IAM
3. Runs Ansible to configure the EC2 mock instance
4. Opens dashboard at http://localhost:3000

---

## Project Structure

```
devops-sandbox/
├── docker-compose.yml          # All services
├── Makefile                    # Common commands
├── .env                        # Environment variables
│
├── terraform/                  # Infrastructure as Code
│   ├── main.tf                 # Root module
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfvars
│   └── modules/
│       ├── vpc/                # VPC + subnets + security groups
│       ├── ec2/                # EC2 instance + EIP
│       ├── iam/                # Role + policy + instance profile
│       ├── s3/                 # Versioned, encrypted bucket
│       └── dynamodb/           # State lock table + app data table
│
├── ansible/                    # Configuration Management
│   ├── playbooks/site.yml      # Main playbook
│   ├── inventory/
│   │   ├── hosts.ini           # Static hosts
│   │   └── dynamic_inventory.py # Reads Terraform outputs
│   └── roles/
│       ├── common/             # Base packages, dirs, sysctl
│       ├── docker/             # Docker CE + sample app container
│       └── nginx/              # Nginx + reverse proxy + HTML page
│
├── cli/                        # Python CLI (Typer/Click)
│   ├── sandbox.py              # Main CLI tool
│   └── setup.py                # Pip installable
│
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── index.js            # App entry point
│   │   ├── aws.js              # AWS SDK clients
│   │   ├── logger.js           # Winston structured logging
│   │   └── routes/
│   │       ├── infra.js        # Terraform/Ansible endpoints
│   │       ├── docker.js       # Container status
│   │       └── logs.js         # Container log streaming
│   └── Dockerfile
│
├── ui/                         # React + Tailwind dashboard
│   ├── src/
│   │   ├── App.jsx             # Root + navigation
│   │   └── pages/
│   │       ├── Dashboard.jsx   # Status overview
│   │       ├── Infra.jsx       # Provision/destroy controls
│   │       └── Logs.jsx        # Live log viewer
│   └── Dockerfile
│
└── docker/                     # Custom Docker build contexts
    ├── terraform/Dockerfile    # Terraform runner
    ├── ansible/Dockerfile      # Ansible runner
    └── nginx/nginx.conf        # Reverse proxy config
```

---

## CLI Usage

Install once:
```bash
make install-cli
# or: cd cli && pip install -e . --break-system-packages
```

### All Commands

| Command | Description |
|---------|-------------|
| `sandbox init` | Start Docker environment, wait for LocalStack |
| `sandbox plan` | Run `terraform plan` |
| `sandbox apply` | Apply Terraform (provision all resources) |
| `sandbox configure` | Run Ansible playbooks |
| `sandbox deploy` | Full pipeline (init → apply → configure) |
| `sandbox destroy` | Tear down all Terraform resources |
| `sandbox status` | Show containers + provisioned resources |
| `sandbox logs [service]` | Show container logs |
| `sandbox stop` | Stop containers |
| `sandbox down` | Remove containers + networks |

### Examples

```bash
sandbox deploy --auto-approve   # Full unattended deployment
sandbox status                  # Check everything
sandbox logs sandbox-terraform  # Terraform output
sandbox logs sandbox-ansible --follow  # Stream Ansible logs
sandbox destroy                 # Clean up
```

---

## Web UI Usage

Open **http://localhost:3000** after running `sandbox init`.

### Dashboard
- Live counts: EC2, S3, DynamoDB, running containers
- Terraform output values
- Resource tables per service
- Container health badges

### Infrastructure Page
- **Plan** → See what Terraform will create
- **Apply** → Provision all resources on LocalStack
- **Destroy** → Tear down infrastructure
- **Configure** → Run Ansible playbooks
- **Full Pipeline** → One-click end-to-end deployment
- Terminal-style output panel for all operations

### Logs Page
- Select any container (LocalStack, Terraform, Ansible, Backend, UI)
- Adjustable line count
- Auto-refresh

---

## Makefile Commands

```bash
make init           # Start environment
make plan           # Terraform plan
make apply          # Terraform apply
make configure      # Ansible configure
make deploy         # Full pipeline
make destroy        # Terraform destroy
make status         # Show status
make logs SERVICE=sandbox-terraform  # View logs
make clean          # Remove volumes + state
make build          # Rebuild all images
make localstack-health  # Check LocalStack APIs
make tf-outputs     # Show Terraform JSON outputs
```

---

## Infrastructure Details

### Resources Provisioned (LocalStack)

| Resource | Name | Details |
|----------|------|---------|
| VPC | `devops-sandbox-vpc` | 10.0.0.0/16, DNS enabled |
| Public Subnet | `devops-sandbox-public-subnet` | 10.0.1.0/24 |
| Internet Gateway | `devops-sandbox-igw` | Attached to VPC |
| Security Group | `devops-sandbox-sg` | SSH/80/443 ingress |
| EC2 Instance | `devops-sandbox-ec2` | t3.micro |
| Elastic IP | `devops-sandbox-eip` | Attached to EC2 |
| IAM Role | `devops-sandbox-ec2-role` | Least-privilege policy |
| S3 Bucket | `devops-sandbox-local-artifacts` | Versioning + encryption |
| DynamoDB Table | `devops-sandbox-local-state` | Lock table |
| DynamoDB Table | `devops-sandbox-local-app-data` | PK+SK keyed |

### Ansible Roles

| Role | What it does |
|------|-------------|
| `common` | System packages, directories, sysctl tuning |
| `docker` | Docker CE + compose plugin + sample Nginx container on :8080 |
| `nginx` | Nginx install, config, reverse proxy, branded HTML landing page |

---

## Security Notes

- No hardcoded credentials — all via `.env`
- IAM role uses least-privilege policy (S3 read/write, DynamoDB CRUD only)
- No public S3 ACLs (blocked via bucket policy)
- LocalStack uses mock credentials (`test`/`test`) — never real AWS keys

---

## Troubleshooting

**LocalStack not ready:**
```bash
sandbox logs sandbox-localstack
make localstack-health
```

**Terraform provider download slow:**
```bash
# First run downloads ~300MB of provider plugins
# Subsequent runs use the Docker layer cache
make build
```

**Ansible can't reach EC2:**
```bash
# LocalStack EC2 is mocked — Ansible uses the dynamic inventory
# which reads Terraform outputs. Verify outputs exist:
make tf-outputs
```

**Port conflicts:**
```bash
# Check what's using port 4566 / 3000 / 3001
sudo lsof -i :4566
```

---

## Demo Workflow

```bash
# 1. Clone & configure
git clone ... && cd devops-sandbox && cp .env.example .env

# 2. Install CLI
make install-cli

# 3. Full deployment
sandbox deploy --auto-approve

# 4. Check status
sandbox status

# 5. Open UI
xdg-open http://localhost:3000

# 6. See Terraform outputs
sandbox apply  # already applied, shows outputs
# OR via UI: Infrastructure → Plan/Apply

# 7. View logs
sandbox logs sandbox-ansible

# 8. Clean up
sandbox destroy
sandbox down
```

---

## Contributing

PRs welcome. Please:
- Keep Terraform modules idempotent
- Add `tags` to all resources
- Use roles for any new Ansible config
- Add API endpoints for any new CLI commands

---

## License

MIT
