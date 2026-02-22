import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import fs from "fs";
import db, { initDb } from "./src/db.js";
import authRoutes from "./src/routes/auth.js";
import candidateRoutes from "./src/routes/candidates.js";
import agentRoutes from "./src/routes/agents.js";
import paymentRoutes from "./src/routes/payments.js";
import dashboardRoutes from "./src/routes/dashboard.js";
import sslRoutes from "./src/routes/sslcommerz.js";

// Initialize Database
initDb();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.set('trust proxy', true);

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
  });
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  app.use('/uploads', express.static(uploadsDir));

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/candidates", candidateRoutes);
  app.use("/api/agents", agentRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/sslcommerz", sslRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
