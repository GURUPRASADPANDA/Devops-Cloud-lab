const express = require("express");
const { exec } = require("child_process");
const { promisify } = require("util");

const router = express.Router();
const execAsync = promisify(exec);

const VALID_SERVICES = ["sandbox-terraform", "sandbox-ansible", "sandbox-localstack", "sandbox-backend", "sandbox-ui"];

// GET /api/logs/:service
router.get("/:service", async (req, res) => {
  const { service } = req.params;
  const lines = parseInt(req.query.lines) || 200;

  if (!VALID_SERVICES.includes(service)) {
    return res.status(400).json({ error: "Invalid service name" });
  }

  try {
    const { stdout } = await execAsync(`docker logs --tail=${lines} ${service} 2>&1`);
    res.setHeader("Content-Type", "text/plain");
    res.send(stdout);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
