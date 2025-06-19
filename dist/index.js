var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";
import cors from "cors";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertOrderSchema: () => insertOrderSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertUserSchema: () => insertUserSchema,
  loginUserSchema: () => loginUserSchema,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  updateOrderSchema: () => updateOrderSchema,
  userStatusSchema: () => userStatusSchema,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  productUrl: varchar("product_url", { length: 1e3 }),
  quantity: integer("quantity").notNull().default(1),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("unpaid"),
  deliveryStatus: varchar("delivery_status", { length: 50 }).notNull().default("pending"),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usersRelations = relations(users, ({ many }) => ({}));
var projectsRelations = relations(projects, ({ one, many }) => ({
  orders: many(orders)
}));
var ordersRelations = relations(orders, ({ one }) => ({
  project: one(projects, {
    fields: [orders.projectId],
    references: [projects.id]
  })
}));
var userStatusSchema = z.enum(["pending", "approved", "rejected"]);
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
}).extend({
  status: userStatusSchema.default("pending")
});
var loginUserSchema = insertUserSchema.pick({
  email: true,
  password: true
});
var insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true
}).extend({
  paymentStatus: z.enum(["unpaid", "partial", "paid"]),
  deliveryStatus: z.enum(["pending", "shipping", "delivered"]),
  quantity: z.number().int().min(1)
});
var updateOrderSchema = insertOrderSchema.partial().extend({
  id: z.number(),
  quantity: z.number().int().min(1).optional()
});

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, ilike, desc, asc, count } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async updateUserStatus(userId, status) {
    const [user] = await db.update(users).set({ status }).where(eq(users.id, userId)).returning();
    return user || void 0;
  }
  async getProjectById(id) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || void 0;
  }
  async createProject(project) {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }
  async getAllProjects() {
    return await db.select().from(projects).orderBy(asc(projects.createdAt));
  }
  async getOrdersByProject(filters, page, limit) {
    const offset = (page - 1) * limit;
    const whereConditions = [eq(orders.projectId, filters.projectId)];
    if (filters.paymentStatus) {
      whereConditions.push(eq(orders.paymentStatus, filters.paymentStatus));
    }
    if (filters.deliveryStatus) {
      whereConditions.push(eq(orders.deliveryStatus, filters.deliveryStatus));
    }
    if (filters.search) {
      whereConditions.push(ilike(orders.title, `%${filters.search}%`));
    }
    const [{ total }] = await db.select({ total: count() }).from(orders).where(and(...whereConditions));
    const ordersList = await db.select().from(orders).where(and(...whereConditions)).orderBy(desc(orders.createdAt)).limit(limit).offset(offset);
    return {
      orders: ordersList,
      total: Number(total)
    };
  }
  async getOrderById(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || void 0;
  }
  async createOrder(order) {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }
  async updateOrder(orderUpdate) {
    const { id, ...updateData } = orderUpdate;
    const [updatedOrder] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }
  async deleteOrder(id) {
    await db.delete(orders).where(eq(orders.id, id));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z as z2 } from "zod";
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
var SALT_ROUNDS = 10;
async function authenticateToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}
async function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        status: "pending"
      });
      res.status(201).json({
        user: { id: user.id, email: user.email },
        message: "Registration request submitted. Please wait for approval."
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginUserSchema.parse(req.body);
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.status !== "approved") {
        if (user.status === "pending") {
          return res.status(403).json({ message: "Your account is pending approval. Please wait for administrator review." });
        } else if (user.status === "rejected") {
          return res.status(403).json({ message: "Your registration has been rejected. Please contact administrator." });
        }
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1e3
        // 24 hours
      });
      res.json({
        user: { id: user.id, email: user.email },
        message: "Login successful"
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logout successful" });
  });
  app2.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json({ user: { id: req.user.id, email: req.user.email } });
  });
  app2.get("/api/admin/users", authenticateToken, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/admin/users/:id/status", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updatedUser = await storage.updateUserStatus(userId, status);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/projects", authenticateToken, async (_req, res) => {
    try {
      const projects2 = await storage.getAllProjects();
      res.json(projects2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/projects", authenticateToken, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...projectData
      });
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const { projectId, page = 1, limit = 20, paymentStatus, deliveryStatus, search } = req.query;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      const filters = {
        projectId: parseInt(projectId),
        paymentStatus: paymentStatus || void 0,
        deliveryStatus: deliveryStatus || void 0,
        search: search || void 0
      };
      const { orders: orders2, total } = await storage.getOrdersByProject(
        filters,
        parseInt(page),
        parseInt(limit)
      );
      res.json({
        orders: orders2,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const orderData = updateOrderSchema.parse({ ...req.body, id: orderId });
      const updatedOrder = await storage.updateOrder(orderData);
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      await storage.deleteOrder(orderId);
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "reactTransportlog";
var vite_config_default = defineConfig({
  base: process.env.NODE_ENV === "production" ? `/${repoName}/` : "/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import cookieParser from "cookie-parser";
var app = express2();
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000", "http://127.0.0.1:5000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
