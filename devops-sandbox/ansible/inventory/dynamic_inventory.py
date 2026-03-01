#!/usr/bin/env python3
"""Dynamic inventory script that reads Terraform outputs."""
import json
import subprocess
import sys
import os


def get_terraform_outputs():
    """Get outputs from Terraform state."""
    state_file = "/workspace/state/terraform.tfstate"
    if not os.path.exists(state_file):
        return {}
    
    try:
        result = subprocess.run(
            ["terraform", "output", "-json"],
            cwd="/workspace/terraform",
            capture_output=True,
            text=True,
            env={**os.environ, "TF_DATA_DIR": "/workspace/state"}
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception as e:
        print(f"Warning: Could not get terraform outputs: {e}", file=sys.stderr)
    
    # Fallback: read state file directly
    try:
        with open(state_file) as f:
            state = json.load(f)
        outputs = {}
        for key, val in state.get("outputs", {}).items():
            outputs[key] = val
        return outputs
    except Exception:
        return {}


def build_inventory(outputs):
    """Build Ansible inventory from Terraform outputs."""
    inventory = {
        "ec2_instances": {
            "hosts": [],
            "vars": {
                "ansible_user": "ec2-user",
                "ansible_ssh_common_args": "-o StrictHostKeyChecking=no",
            }
        },
        "_meta": {
            "hostvars": {}
        }
    }

    ec2_ip = None
    if "ec2_public_ip" in outputs:
        ec2_ip = outputs["ec2_public_ip"].get("value")
    elif "ec2_private_ip" in outputs:
        ec2_ip = outputs["ec2_private_ip"].get("value")

    if ec2_ip:
        inventory["ec2_instances"]["hosts"].append(ec2_ip)
        inventory["_meta"]["hostvars"][ec2_ip] = {
            "ansible_host": ec2_ip,
            "ec2_instance_id": outputs.get("ec2_instance_id", {}).get("value", ""),
            "s3_bucket": outputs.get("s3_bucket_name", {}).get("value", ""),
            "dynamodb_table": outputs.get("dynamodb_table_name", {}).get("value", ""),
        }

    return inventory


if __name__ == "__main__":
    outputs = get_terraform_outputs()
    inventory = build_inventory(outputs)
    print(json.dumps(inventory, indent=2))
