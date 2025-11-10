/**
 * Shared Database Schema
 * 
 * Drizzle ORM schema for invoice analytics
 * Mirrors the Prisma schema in apps/api/prisma/schema.prisma
 * 
 * This allows the Replit demo to work with the same data structure
 */

import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  real, 
  uuid 
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Vendors table
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique()
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull(), // "pending", "paid", "overdue", "cancelled"
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull(),
  currency: text("currency").notNull().default("USD"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Line Items table
export const lineItems = pgTable("line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  amount: real("amount").notNull()
});

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  method: text("method").notNull(), // "credit_card", "bank_transfer", "check", "cash"
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const vendorsRelations = relations(vendors, ({ many }) => ({
  invoices: many(invoices)
}));

export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices)
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  lineItems: many(lineItems)
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [invoices.vendorId],
    references: [vendors.id]
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id]
  }),
  lineItems: many(lineItems),
  payments: many(payments)
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [lineItems.invoiceId],
    references: [invoices.id]
  }),
  category: one(categories, {
    fields: [lineItems.categoryId],
    references: [categories.id]
  })
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id]
  })
}));

// Insert Schemas
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLineItemSchema = createInsertSchema(lineItems).omit({
  id: true
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true
});

// Types
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type LineItem = typeof lineItems.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Keep existing user schema for authentication (if needed later)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
