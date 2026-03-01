const express = require("express");
const { exec } = require("child_process");
const { promisify } = require("util");
const { DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { ListBucketsCommand } = require("@aws-sdk/client-s3");
const { ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const { ec2, s3, dynamodb } = require("../aws");
const logger = require("../logger");

const router = express.Router();
const execAsync = promisify(exec);

async function dockerExec(container, cmd) {
  const fullCmd = `docker exec -w /workspace/terraform ${container} ${cmd}`;
  logger.info({ action: "docker-exec", cmd: fullCmd });
  return execAsync(fullCmd, { timeout: 300000 });
}

// GET /api/infra/status
router.get("/status", async (_req, res) => {
  const status = { ec2: [], s3: [], dynamodb: [], iam: [] };

  try {
    const ec2Res = await ec2.send(new DescribeInstancesCommand({}));
    status.ec2 = (ec2Res.Reservations || []).flatMap(r =>
      (r.Instances || []).map(i => ({
        id: i.InstanceId,
        type: i.InstanceType,
        state: i.State?.Name,
        privateIp: i.PrivateIpAddress,
        publicIp: i.PublicIpAddress,
        tags: i.Tags,
      }))
    );
  } catch (e) {
    logger.warn("EC2 list failed: " + e.message);
  }

  try {
    const s3Res = await s3.send(new ListBucketsCommand({}));
    status.s3 = (s3Res.Buckets || []).map(b => ({ name: b.Name, created: b.CreationDate }));
  } catch (e) {
    logger.warn("S3 list failed: " + e.message);
  }

  try {
    const dbRes = await dynamodb.send(new ListTablesCommand({}));
    status.dynamodb = (dbRes.TableNames || []).map(n => ({ name: n }));
  } catch (e) {
    logger.warn("DynamoDB list failed: " + e.message);
  }

  res.json(status);
});

// POST /api/infra/plan
router.post("/plan", async (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");
  try {
    await dockerExec("sandbox-terraform", "terraform init -input=false -no-color");
    const { stdout } = await dockerExec("sandbox-terraform", "terraform plan -var-file=terraform.tfvars -no-color");
    res.end(stdout);
  } catch (e) {
    res.status(500).end(e.stderr || e.message);
  }
});

// POST /api/infra/apply
router.post("/apply", async (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  try {
    await dockerExec("sandbox-terraform", "terraform init -input=false -no-color");
    const { stdout } = await dockerExec(
      "sandbox-terraform",
      "terraform apply -var-file=terraform.tfvars -auto-approve -no-color"
    );
    res.end(stdout);
  } catch (e) {
    res.status(500).end(e.stderr || e.message);
  }
});

// POST /api/infra/destroy
router.post("/destroy", async (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  try {
    const { stdout } = await dockerExec(
      "sandbox-terraform",
      "terraform destroy -var-file=terraform.tfvars -auto-approve -no-color"
    );
    res.end(stdout);
  } catch (e) {
    res.status(500).end(e.stderr || e.message);
  }
});

// POST /api/infra/configure
router.post("/configure", async (_req, res) => {
  res.setHeader("Content-Type", "text/plain");
  try {
    const { stdout } = await execAsync(
      `docker exec -w /workspace/ansible sandbox-ansible ansible-playbook -i inventory/dynamic_inventory.py playbooks/site.yml`,
      { timeout: 300000 }
    );
    res.end(stdout);
  } catch (e) {
    res.status(500).end(e.stderr || e.message);
  }
});

// GET /api/infra/outputs
router.get("/outputs", async (_req, res) => {
  try {
    const { stdout } = await dockerExec("sandbox-terraform", "terraform output -json");
    const raw = JSON.parse(stdout);
    const outputs = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.value]));
    res.json(outputs);
  } catch (e) {
    res.json({});
  }
});

module.exports = router;
