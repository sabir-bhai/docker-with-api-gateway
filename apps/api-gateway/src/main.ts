// src/server.ts
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";

const app = express();
app.use(morgan("dev"));

// health
app.get("/health", (_req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

const userServiceTarget =
  process.env.USER_SERVICE_URL || "http://user-service:3000";

// Build options and cast to any so TS won't complain about extra callbacks
const userProxyOptions: any = {
  target: userServiceTarget,
  changeOrigin: true,
  pathRewrite: { "^/users": "" }, // strips /users prefix before forwarding

  // callback to modify the outgoing proxied request
  onProxyReq(proxyReq: any, req: any, res: any) {
    try {
      if (req && req.headers) {
        proxyReq.setHeader("x-forwarded-host", req.headers.host || "");
      }
    } catch (e) {
      // swallow errors to avoid crashing the gateway
      console.warn("onProxyReq error:", e);
    }
  },

  // error handler
  onError(err: any, req: any, res: any) {
    console.error("Proxy error to user-service:", err?.message || err);
    if (!res.headersSent) {
      res.status(502).json({ error: "Bad gateway", details: err?.message });
    }
  },
};

// mount the proxy
app.use("/users", createProxyMiddleware(userProxyOptions));

// also proxy /user/api -> /api; you can reuse userProxyOptions or create a second one
const apiProxyOptions: any = {
  ...userProxyOptions,
  pathRewrite: { "^/user": "" }, // /user/api -> /api
};
app.use("/user", createProxyMiddleware(apiProxyOptions));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () =>
  console.log(`API Gateway listening on http://0.0.0.0:${port}`)
);
