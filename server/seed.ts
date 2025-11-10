/**
 * Database Seed Script for Replit Environment
 * 
 * Generates sample invoice analytics data
 * Run with: npx tsx server/seed.ts
 */

import { db } from "./db";
import { vendors, customers, categories, invoices, lineItems, payments } from "@shared/schema";

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // Sample vendors
    const vendorData = [
      { name: 'Acme Corporation', email: 'billing@acmecorp.com' },
      { name: 'TechSupply Inc', email: 'invoices@techsupply.com' },
      { name: 'Office Depot', email: 'accounts@officedepot.com' },
      { name: 'CloudServices LLC', email: 'billing@cloudservices.com' },
      { name: 'Global Logistics', email: 'payments@globallogistics.com' },
      { name: 'Print Solutions', email: 'invoicing@printsolutions.com' },
      { name: 'Software Co', email: 'billing@softwareco.com' },
      { name: 'Hardware Plus', email: 'accounts@hardwareplus.com' }
    ];

    console.log('Creating vendors...');
    const createdVendors = await db.insert(vendors).values(vendorData).returning();
    console.log(`✓ Created ${createdVendors.length} vendors`);

    // Sample customers
    const customerData = [
      { name: 'ABC Company', email: 'ap@abccompany.com' },
      { name: 'XYZ Corporation', email: 'billing@xyzcorp.com' }
    ];

    console.log('Creating customers...');
    const createdCustomers = await db.insert(customers).values(customerData).returning();
    console.log(`✓ Created ${createdCustomers.length} customers`);

    // Sample categories
    const categoryData = [
      { name: 'Office Supplies' },
      { name: 'Software Licenses' },
      { name: 'Hardware' },
      { name: 'Cloud Services' },
      { name: 'Consulting' },
      { name: 'Marketing' },
      { name: 'Utilities' }
    ];

    console.log('Creating categories...');
    const createdCategories = await db.insert(categories).values(categoryData).returning();
    console.log(`✓ Created ${createdCategories.length} categories`);

    // Generate sample invoices
    console.log('Creating invoices...');
    const statuses = ['paid', 'pending', 'overdue', 'paid'];
    const startDate = new Date('2023-01-01');
    const createdInvoices = [];

    for (let i = 0; i < 50; i++) {
      const vendor = createdVendors[Math.floor(Math.random() * createdVendors.length)];
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const issueDate = new Date(startDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);
      const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const subtotal = Math.round((Math.random() * 5000 + 500) * 100) / 100;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + tax) * 100) / 100;

      const [invoice] = await db.insert(invoices).values({
        invoiceNumber: `INV-2024-${String(i + 1).padStart(5, '0')}`,
        vendorId: vendor.id,
        customerId: customer.id,
        issueDate,
        dueDate,
        status,
        subtotal,
        tax,
        total,
        currency: 'USD'
      }).returning();

      createdInvoices.push(invoice);

      // Create line items for this invoice
      const numLineItems = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < numLineItems; j++) {
        const category = createdCategories[Math.floor(Math.random() * createdCategories.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = Math.round((Math.random() * 500 + 50) * 100) / 100;
        const amount = Math.round(quantity * unitPrice * 100) / 100;

        await db.insert(lineItems).values({
          invoiceId: invoice.id,
          categoryId: category.id,
          description: `${category.name} - Item ${j + 1}`,
          quantity,
          unitPrice,
          amount
        });
      }

      // Create payment if status is paid
      if (status === 'paid') {
        const paymentDate = new Date(dueDate.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000);
        
        await db.insert(payments).values({
          invoiceId: invoice.id,
          amount: total,
          paymentDate,
          method: ['bank_transfer', 'credit_card', 'check'][Math.floor(Math.random() * 3)],
          reference: `PAY-${String(i + 1).padStart(5, '0')}`
        });
      }
    }

    console.log(`✓ Created ${createdInvoices.length} invoices with line items`);
    console.log('\n✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Vendors: ${createdVendors.length}`);
    console.log(`   Customers: ${createdCustomers.length}`);
    console.log(`   Categories: ${createdCategories.length}`);
    console.log(`   Invoices: ${createdInvoices.length}`);
    console.log('');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }

  process.exit(0);
}

seed();
