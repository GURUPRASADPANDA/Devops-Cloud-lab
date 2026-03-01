require("express-async-errors");
const express = require("express");
const cors = require("cors");
const logger = require("./logger");
const infraRouter = require("./routes/infra");
const dockerRouter = require("./routes/docker");
const logsRouter = require("./routes/logs");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url });
  next();
});

// Routes
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "sandbox-backend" });
});

app.use("/api/infra", infraRouter);
app.use("/api/docker", dockerRouter);
app.use("/api/logs", logsRouter);

// Error handler
app.use((err, _req, res, _next) => {
  logger.error({ error: err.message, stack: err.stack });
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  logger.info(`Sandbox backend running on port ${PORT}`);
});
