const express = require("express");
const Docker = require("dockerode");
const logger = require("../logger");

const router = express.Router();
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// GET /api/docker/containers
router.get("/containers", async (_req, res) => {
  const containers = await docker.listContainers({ all: true });
  const sandboxContainers = containers
    .filter(c => c.Names.some(n => n.includes("sandbox")))
    .map(c => ({
      id: c.Id.slice(0, 12),
      name: c.Names[0].replace("/", ""),
      image: c.Image,
      status: c.Status,
      state: c.State,
      ports: c.Ports,
    }));
  res.json(sandboxContainers);
});

// GET /api/docker/health
router.get("/health", async (_req, res) => {
  const containers = await docker.listContainers({ all: true });
  const health = {};
  for (const c of containers) {
    if (c.Names.some(n => n.includes("sandbox"))) {
      const name = c.Names[0].replace("/", "");
      health[name] = { state: c.State, status: c.Status };
    }
  }
  res.json(health);
});

module.exports = router;
