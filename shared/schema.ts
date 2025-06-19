import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  productUrl: varchar("product_url", { length: 1000 }),
  quantity: integer("quantity").notNull().default(1),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("unpaid"),
  deliveryStatus: varchar("delivery_status", { length: 50 }).notNull().default("pending"),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  project: one(projects, {
    fields: [orders.projectId],
    references: [projects.id],
  }),
}));

// Schemas
export const userStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  status: userStatusSchema.default("pending"),
});

export const loginUserSchema = insertUserSchema.pick({
  email: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
}).extend({
  paymentStatus: z.enum(["unpaid", "partial", "paid"]),
  deliveryStatus: z.enum(["pending", "shipping", "delivered"]),
  quantity: z.number().int().min(1),
});

export const updateOrderSchema = insertOrderSchema.partial().extend({
  id: z.number(),
  quantity: z.number().int().min(1).optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;
