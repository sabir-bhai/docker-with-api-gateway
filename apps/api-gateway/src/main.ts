// src/server.js (or src/index.js)
import express from "express";
import path from "path";

const app = express();

app.use("/assets", express.static(path.join(process.cwd(), "assets")));

app.get("/api", (_req, res) => {
  res.json({ message: "Welcome to api-gateway!" });
});

// Add health endpoint required by docker-compose
app.get("/health", (_req, res) => {
  // you can add deeper checks here (DB/Redis) later
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

const port = Number(process.env.PORT) || 3000; // match docker-compose mapping
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
