import { users, projects, orders, type User, type InsertUser, type Project, type InsertProject, type Order, type InsertOrder, type UpdateOrder } from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, desc, asc, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProjectsByUserId(userId: number): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject & { userId: number }): Promise<Project>;
  
  // Order methods
  getOrdersByProject(
    filters: {
      projectId: number;
      paymentStatus?: string;
      deliveryStatus?: string;
      search?: string;
    },
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number }>;
  getOrderById(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(order: UpdateOrder): Promise<Order>;
  deleteOrder(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(asc(projects.createdAt));
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject & { userId: number }): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async getOrdersByProject(
    filters: {
      projectId: number;
      paymentStatus?: string;
      deliveryStatus?: string;
      search?: string;
    },
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number }> {
    const offset = (page - 1) * limit;
    
    // Build where conditions
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

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(and(...whereConditions));

    // Get orders
    const ordersList = await db
      .select()
      .from(orders)
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      orders: ordersList,
      total: Number(total),
    };
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrder(orderUpdate: UpdateOrder): Promise<Order> {
    const { id, ...updateData } = orderUpdate;
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }
}

export const storage = new DatabaseStorage();
