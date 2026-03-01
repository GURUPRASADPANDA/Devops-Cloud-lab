.PHONY: all init plan apply configure deploy destroy status logs stop down install-cli help

# ── Variables ─────────────────────────────────────────────────────────────────
COMPOSE := docker compose -f docker-compose.yml
CLI := python3 cli/sandbox.py

# ── Default target ─────────────────────────────────────────────────────────────
all: help

## init: Start all containers and wait for LocalStack
init:
	@$(CLI) init

## plan: Run Terraform plan
plan:
	@$(CLI) plan

## apply: Apply Terraform to provision infrastructure
apply:
	@$(CLI) apply --auto-approve

## configure: Run Ansible playbooks
configure:
	@$(CLI) configure

## deploy: Full pipeline (init → apply → configure)
deploy:
	@$(CLI) deploy --auto-approve

## destroy: Destroy all Terraform-managed resources
destroy:
	@$(CLI) destroy

## status: Show running resources and containers
status:
	@$(CLI) status

## logs: Show logs (usage: make logs SERVICE=sandbox-terraform)
logs:
	@$(CLI) logs $(SERVICE) $(if $(FOLLOW),--follow,)

## stop: Stop all containers
stop:
	@$(COMPOSE) stop

## down: Remove all containers
down:
	@$(COMPOSE) down --remove-orphans

## install-cli: Install the sandbox CLI globally
install-cli:
	cd cli && pip install -e . --break-system-packages

## build: Rebuild all Docker images
build:
	@$(COMPOSE) build --no-cache

## ps: Show container status
ps:
	@$(COMPOSE) ps

## clean: Remove volumes and state
clean:
	@$(COMPOSE) down -v --remove-orphans
	@rm -rf terraform/.terraform terraform/terraform.tfstate* .terraform.lock.hcl

## localstack-health: Check LocalStack service health
localstack-health:
	@curl -s http://localhost:4566/_localstack/health | jq .

## tf-outputs: Show Terraform outputs
tf-outputs:
	@docker exec -w /workspace/terraform sandbox-terraform terraform output -json | jq .

## help: Show this help message
help:
	@echo ""
	@echo "  ██████╗ ███████╗██╗   ██╗ ██████╗ ██████╗ ███████╗    ███████╗ █████╗ ███╗  ██╗██████╗ ██████╗  ██████╗ ██╗  ██╗"
	@echo "  DevOps Sandbox - Local AWS Training Platform"
	@echo ""
	@echo "  Usage: make <target>"
	@echo ""
	@grep -E '^## ' Makefile | sed 's/## /  /'
	@echo ""
