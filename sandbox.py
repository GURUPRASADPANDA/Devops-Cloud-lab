#!/usr/bin/env python3
"""
sandbox - DevOps Sandbox CLI Tool
Production-grade local AWS DevOps Training Platform
"""
import subprocess
import sys
import os
import json
import time
import click
from pathlib import Path
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
COMPOSE_FILE = PROJECT_ROOT / "docker-compose.yml"
TERRAFORM_CONTAINER = "sandbox-terraform"
ANSIBLE_CONTAINER = "sandbox-ansible"
BACKEND_CONTAINER = "sandbox-backend"
LOCALSTACK_CONTAINER = "sandbox-localstack"


# ── Helpers ──────────────────────────────────────────────────────────────────
def log(msg: str, level: str = "INFO"):
    colors = {"INFO": "\033[94m", "OK": "\033[92m", "WARN": "\033[93m", "ERR": "\033[91m"}
    reset = "\033[0m"
    ts = datetime.now().strftime("%H:%M:%S")
    prefix = colors.get(level, "") + f"[{level}]" + reset
    click.echo(f"{prefix} {ts} {msg}")


def run(cmd: list, capture=False, check=True) -> subprocess.CompletedProcess:
    """Run a shell command safely."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=capture,
            text=True,
            check=check
        )
        return result
    except subprocess.CalledProcessError as e:
        log(f"Command failed: {' '.join(cmd)}", "ERR")
        if e.stdout:
            click.echo(e.stdout)
        if e.stderr:
            click.echo(e.stderr, err=True)
        sys.exit(1)


def docker_exec(container: str, cmd: list, workdir: str = None) -> subprocess.CompletedProcess:
    """Run a command in a Docker container."""
    base = ["docker", "exec"]
    if workdir:
        base += ["-w", workdir]
    base.append(container)
    base.extend(cmd)
    return run(base)


def docker_compose(args: list) -> subprocess.CompletedProcess:
    """Run docker compose command."""
    return run(["docker", "compose", "-f", str(COMPOSE_FILE)] + args)


def container_running(name: str) -> bool:
    result = run(
        ["docker", "inspect", "--format", "{{.State.Running}}", name],
        capture=True, check=False
    )
    return result.returncode == 0 and result.stdout.strip() == "true"


def wait_for_localstack(timeout=60):
    """Poll LocalStack health endpoint."""
    log("Waiting for LocalStack to be ready...")
    deadline = time.time() + timeout
    while time.time() < deadline:
        result = run(
            ["docker", "exec", LOCALSTACK_CONTAINER,
             "curl", "-sf", "http://localhost:4566/_localstack/health"],
            capture=True, check=False
        )
        if result.returncode == 0:
            log("LocalStack is healthy ✓", "OK")
            return True
        time.sleep(3)
    log("LocalStack did not become healthy in time", "ERR")
    return False


def get_terraform_outputs() -> dict:
    """Fetch Terraform outputs from the container."""
    if not container_running(TERRAFORM_CONTAINER):
        return {}
    result = run(
        ["docker", "exec", "-w", "/workspace/terraform", TERRAFORM_CONTAINER,
         "terraform", "output", "-json"],
        capture=True, check=False
    )
    if result.returncode == 0 and result.stdout.strip():
        try:
            raw = json.loads(result.stdout)
            return {k: v["value"] for k, v in raw.items()}
        except json.JSONDecodeError:
            pass
    return {}


# ── CLI Definition ────────────────────────────────────────────────────────────
@click.group()
@click.version_option(version="1.0.0")
def cli():
    """
    \b
    ███████╗ █████╗ ███╗   ██╗██████╗ ██████╗  ██████╗ ██╗  ██╗
    ██╔════╝██╔══██╗████╗  ██║██╔══██╗██╔══██╗██╔═══██╗╚██╗██╔╝
    ███████╗███████║██╔██╗ ██║██║  ██║██████╔╝██║   ██║ ╚███╔╝
    ╚════██║██╔══██║██║╚██╗██║██║  ██║██╔══██╗██║   ██║ ██╔██╗
    ███████║██║  ██║██║ ╚████║██████╔╝██████╔╝╚██████╔╝██╔╝ ██╗
    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝

    Local AWS DevOps Training Platform
    """
    pass


@cli.command()
def init():
    """Start the Docker environment (LocalStack + all services)."""
    log("🚀 Initializing DevOps Sandbox...")
    docker_compose(["up", "-d", "--build"])
    if wait_for_localstack():
        log("Sandbox environment is up and running ✓", "OK")
        log("→ UI:      http://localhost:3000", "INFO")
        log("→ API:     http://localhost:3001", "INFO")
        log("→ LocalStack: http://localhost:4566", "INFO")
    else:
        log("Initialization may be incomplete - check logs with: sandbox logs", "WARN")


@cli.command()
def plan():
    """Run Terraform plan against LocalStack."""
    if not container_running(TERRAFORM_CONTAINER):
        log("Terraform container not running. Run: sandbox init", "ERR")
        sys.exit(1)
    log("📋 Running Terraform plan...")
    docker_exec(TERRAFORM_CONTAINER,
                ["terraform", "init", "-input=false"],
                workdir="/workspace/terraform")
    docker_exec(TERRAFORM_CONTAINER,
                ["terraform", "plan", "-var-file=terraform.tfvars"],
                workdir="/workspace/terraform")


@cli.command()
@click.option("--auto-approve", is_flag=True, help="Skip interactive approval")
def apply(auto_approve):
    """Apply Terraform configuration to LocalStack."""
    if not container_running(TERRAFORM_CONTAINER):
        log("Terraform container not running. Run: sandbox init", "ERR")
        sys.exit(1)
    log("🔨 Applying Terraform configuration...")
    docker_exec(TERRAFORM_CONTAINER,
                ["terraform", "init", "-input=false"],
                workdir="/workspace/terraform")

    apply_cmd = ["terraform", "apply", "-var-file=terraform.tfvars", "-input=false"]
    if auto_approve:
        apply_cmd.append("-auto-approve")

    docker_exec(TERRAFORM_CONTAINER, apply_cmd, workdir="/workspace/terraform")
    log("✅ Infrastructure provisioned on LocalStack", "OK")

    outputs = get_terraform_outputs()
    if outputs:
        log("📤 Terraform Outputs:", "INFO")
        for k, v in outputs.items():
            click.echo(f"   {k} = {v}")


@cli.command()
def configure():
    """Run Ansible playbooks to configure EC2 instance."""
    if not container_running(ANSIBLE_CONTAINER):
        log("Ansible container not running. Run: sandbox init", "ERR")
        sys.exit(1)
    log("⚙️  Running Ansible configuration...")
    docker_exec(
        ANSIBLE_CONTAINER,
        ["ansible-playbook",
         "-i", "inventory/dynamic_inventory.py",
         "playbooks/site.yml",
         "-v"],
        workdir="/workspace/ansible"
    )
    log("✅ Configuration complete", "OK")


@cli.command()
@click.option("--auto-approve", is_flag=True, help="Skip confirmation prompts")
def deploy(auto_approve):
    """Full deployment pipeline: init → apply → configure."""
    log("🚀 Starting full deployment pipeline...")
    
    # init
    log("[1/3] Initializing environment...")
    docker_compose(["up", "-d", "--build"])
    wait_for_localstack()

    # apply
    log("[2/3] Applying Terraform...")
    docker_exec(TERRAFORM_CONTAINER,
                ["terraform", "init", "-input=false"],
                workdir="/workspace/terraform")
    apply_cmd = ["terraform", "apply", "-var-file=terraform.tfvars", "-input=false", "-auto-approve"]
    docker_exec(TERRAFORM_CONTAINER, apply_cmd, workdir="/workspace/terraform")

    # configure
    log("[3/3] Running Ansible...")
    docker_exec(
        ANSIBLE_CONTAINER,
        ["ansible-playbook", "-i", "inventory/dynamic_inventory.py", "playbooks/site.yml"],
        workdir="/workspace/ansible"
    )

    log("🎉 Full deployment pipeline complete!", "OK")
    click.echo("\nAccess points:")
    click.echo("  → Dashboard UI: http://localhost:3000")
    click.echo("  → Backend API:  http://localhost:3001")


@cli.command()
def destroy():
    """Destroy all Terraform-managed infrastructure."""
    if not container_running(TERRAFORM_CONTAINER):
        log("Terraform container not running. Run: sandbox init", "ERR")
        sys.exit(1)
    log("💥 Destroying infrastructure...", "WARN")
    if not click.confirm("This will destroy all provisioned resources. Continue?"):
        log("Aborted.", "WARN")
        return
    docker_exec(
        TERRAFORM_CONTAINER,
        ["terraform", "destroy", "-var-file=terraform.tfvars", "-auto-approve"],
        workdir="/workspace/terraform"
    )
    log("✅ Infrastructure destroyed", "OK")


@cli.command()
def status():
    """Show status of running containers and provisioned resources."""
    log("📊 DevOps Sandbox Status")
    click.echo("─" * 50)

    # Containers
    click.echo("\n🐳 Containers:")
    containers = [
        LOCALSTACK_CONTAINER,
        TERRAFORM_CONTAINER,
        ANSIBLE_CONTAINER,
        BACKEND_CONTAINER,
        "sandbox-ui",
        "sandbox-nginx",
    ]
    for c in containers:
        running = container_running(c)
        icon = "✅" if running else "❌"
        click.echo(f"  {icon} {c}")

    # Resources
    click.echo("\n☁️  Provisioned Resources (LocalStack):")
    outputs = get_terraform_outputs()
    if outputs:
        for k, v in outputs.items():
            click.echo(f"  {k}: {v}")
    else:
        click.echo("  No resources provisioned yet. Run: sandbox apply")

    # LocalStack health
    click.echo("\n🔍 LocalStack Health:")
    result = run(
        ["docker", "exec", LOCALSTACK_CONTAINER,
         "curl", "-sf", "http://localhost:4566/_localstack/health"],
        capture=True, check=False
    )
    if result.returncode == 0:
        try:
            health = json.loads(result.stdout)
            for svc, state in health.get("services", {}).items():
                icon = "✅" if state == "running" else "⚠️ "
                click.echo(f"  {icon} {svc}: {state}")
        except json.JSONDecodeError:
            click.echo(f"  {result.stdout}")
    else:
        click.echo("  ❌ LocalStack not reachable")


@cli.command()
@click.argument("service", required=False, default=None)
@click.option("--follow", "-f", is_flag=True, help="Follow log output")
@click.option("--tail", "-n", default=100, help="Number of lines to show")
def logs(service, follow, tail):
    """Show container logs. Optionally filter by service name."""
    cmd = ["docker", "compose", "-f", str(COMPOSE_FILE), "logs", f"--tail={tail}"]
    if follow:
        cmd.append("--follow")
    if service:
        cmd.append(service)
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        pass


@cli.command()
def stop():
    """Stop all containers without removing them."""
    log("⏹  Stopping sandbox...")
    docker_compose(["stop"])
    log("Sandbox stopped", "OK")


@cli.command()
def down():
    """Stop and remove all containers and networks."""
    log("🗑️  Tearing down sandbox...", "WARN")
    docker_compose(["down", "--remove-orphans"])
    log("Sandbox torn down", "OK")


if __name__ == "__main__":
    cli()
