/**
 * Prisma Seed Script
 * 
 * Reads Analytics_Test_Data.json and normalizes the nested structure
 * into relational database tables using Prisma
 * 
 * The JSON file contains invoices with nested vendor, customer, line items, etc.
 * This script extracts and upserts:
 * - Vendors
 * - Customers  
 * - Categories
 * - Invoices
 * - Line Items
 * - Payments
 * 
 * Uses upsert operations for idempotency (can be run multiple times safely)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Helper to generate sample data if Analytics_Test_Data.json doesn't exist
function generateSampleData() {
  const vendors = ['Acme Corp', 'TechSupply Inc', 'Office Depot', 'CloudServices LLC', 'Global Logistics'];
  const customers = ['ABC Company', 'XYZ Corp'];
  const categories = ['Office Supplies', 'Software', 'Hardware', 'Services', 'Utilities'];
  const statuses = ['paid', 'pending', 'overdue'];

  const invoices = [];
  const currentYear = new Date().getFullYear();
  const startDate = new Date(currentYear, 0, 1);

  for (let i = 0; i < 50; i++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const issueDate = new Date(startDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const lineItemCount = Math.floor(Math.random() * 5) + 1;
    const lineItems = [];
    let subtotal = 0;

    for (let j = 0; j < lineItemCount; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = Math.round((Math.random() * 500 + 50) * 100) / 100;
      const amount = Math.round(quantity * unitPrice * 100) / 100;
      subtotal += amount;

      lineItems.push({
        category,
        description: `${category} item ${j + 1}`,
        quantity,
        unitPrice,
        amount
      });
    }

    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    invoices.push({
      invoiceNumber: `INV-${currentYear}-${String(i + 1).padStart(5, '0')}`,
      vendor: { name: vendor, email: `contact@${vendor.toLowerCase().replace(/\s+/g, '')}.com` },
      customer: { name: customer, email: `billing@${customer.toLowerCase().replace(/\s+/g, '')}.com` },
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status,
      subtotal,
      tax,
      total,
      lineItems,
      payments: status === 'paid' ? [{
        amount: total,
        paymentDate: new Date(dueDate.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
        method: 'bank_transfer',
        reference: `PAY-${String(i + 1).padStart(5, '0')}`
      }] : []
    });
  }

  return invoices;
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Try to read the JSON file
    const dataFilePath = process.env.DATA_FILE_PATH || path.join(__dirname, 'data', 'Analytics_Test_Data.json');
    
    let invoicesData: any[];

    if (fs.existsSync(dataFilePath)) {
      console.log(`📂 Reading data from: ${dataFilePath}`);
      const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      // If the JSON is already in expected array/object form, use it
      let rawArray: any[] = Array.isArray(jsonData) ? jsonData : (jsonData.invoices || []);

      // Detect user's nested structure and adapt if necessary
      const looksNested = rawArray.length > 0 && rawArray[0]?.extractedData?.llmData;
      if (looksNested) {
        console.log('🔄 Detected nested llmData structure. Adapting to seed format...');
        const safeGet = (obj: any, path: string[], def: any = null) => {
          try {
            return path.reduce((o, k) => (o && k in o ? o[k] : undefined), obj) ?? def;
          } catch {
            return def;
          }
        };

        rawArray = rawArray.map((item) => {
          const llm = item.extractedData.llmData;

          const invoiceId = safeGet(llm, ['invoice', 'value', 'invoiceId', 'value'], undefined) || `INV-${Date.now()}-${Math.floor(Math.random()*10000)}`;
          const issueDateStr = safeGet(llm, ['invoice', 'value', 'invoiceDate', 'value'], new Date().toISOString());
          const issueDate = new Date(issueDateStr);
          const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

          const vendorName = safeGet(llm, ['vendor', 'value', 'vendorName', 'value'], 'Unknown Vendor');
          const customerName = safeGet(llm, ['customer', 'value', 'customerName', 'value'], 'Unknown Customer');

          const subTotal = Math.abs(Number(safeGet(llm, ['summary', 'value', 'subTotal', 'value'], 0))) || 0;
          const totalTax = Math.abs(Number(safeGet(llm, ['summary', 'value', 'totalTax', 'value'], 0))) || 0;
          const invoiceTotal = Math.abs(Number(safeGet(llm, ['summary', 'value', 'invoiceTotal', 'value'], subTotal + totalTax))) || 0;

          const itemsArr = safeGet(llm, ['lineItems', 'value', 'items', 'value'], []) as any[];
          const mappedItems = Array.isArray(itemsArr) ? itemsArr.map((li) => ({
            category: safeGet(li, ['Sachkonto', 'value'], null) ? 'General' : null,
            description: safeGet(li, ['description', 'value'], 'Item'),
            quantity: Number(safeGet(li, ['quantity', 'value'], 1)) || 1,
            unitPrice: Number(safeGet(li, ['unitPrice', 'value'], 0)) || 0,
            amount: Number(safeGet(li, ['totalPrice', 'value'], 0)) || 0,
          })) : [];

          return {
            invoiceNumber: String(invoiceId),
            vendor: { name: vendorName, email: null },
            customer: { name: customerName, email: null },
            issueDate: issueDate.toISOString(),
            dueDate: dueDate.toISOString(),
            status: 'pending',
            subtotal: subTotal || mappedItems.reduce((s, it) => s + (it.amount || 0), 0),
            tax: totalTax,
            total: invoiceTotal,
            currency: 'EUR',
            lineItems: mappedItems,
            payments: [],
          };
        });
      }

      invoicesData = rawArray;
      console.log(`✅ Prepared ${invoicesData.length} invoices from file\n`);
    } else {
      console.log(`⚠️  Data file not found at ${dataFilePath}`);
      console.log('📝 Generating sample data instead...\n');
      invoicesData = generateSampleData();
    }

    // Track counts for summary
    let vendorCount = 0;
    let customerCount = 0;
    let categoryCount = 0;
    let invoiceCount = 0;
    let lineItemCount = 0;
    let paymentCount = 0;

    // Process each invoice
    for (const invoiceData of invoicesData) {
      try {
        // Upsert Vendor
        const vendor = await prisma.vendor.upsert({
          where: { name: invoiceData.vendor.name || invoiceData.vendor },
          update: {},
          create: {
            name: invoiceData.vendor.name || invoiceData.vendor,
            email: invoiceData.vendor.email || null,
            phone: invoiceData.vendor.phone || null,
            address: invoiceData.vendor.address || null
          }
        });
        vendorCount++;

        // Upsert Customer
        const customer = await prisma.customer.upsert({
          where: { name: invoiceData.customer.name || invoiceData.customer },
          update: {},
          create: {
            name: invoiceData.customer.name || invoiceData.customer,
            email: invoiceData.customer.email || null,
            phone: invoiceData.customer.phone || null,
            address: invoiceData.customer.address || null
          }
        });
        customerCount++;

        // Create Invoice
        const invoice = await prisma.invoice.upsert({
          where: { invoiceNumber: invoiceData.invoiceNumber },
          update: {
            status: invoiceData.status,
            total: invoiceData.total
          },
          create: {
            invoiceNumber: invoiceData.invoiceNumber,
            vendorId: vendor.id,
            customerId: customer.id,
            issueDate: new Date(invoiceData.issueDate),
            dueDate: new Date(invoiceData.dueDate),
            status: invoiceData.status,
            subtotal: invoiceData.subtotal,
            tax: invoiceData.tax || 0,
            total: invoiceData.total,
            currency: invoiceData.currency || 'USD',
            notes: invoiceData.notes || null
          }
        });
        invoiceCount++;

        // Create Line Items
        if (invoiceData.lineItems && Array.isArray(invoiceData.lineItems)) {
          for (const lineItemData of invoiceData.lineItems) {
            // Upsert Category if specified
            let categoryId = null;
            if (lineItemData.category) {
              const category = await prisma.category.upsert({
                where: { name: lineItemData.category },
                update: {},
                create: { name: lineItemData.category }
              });
              categoryId = category.id;
              categoryCount++;
            }

            await prisma.lineItem.create({
              data: {
                invoiceId: invoice.id,
                categoryId,
                description: lineItemData.description,
                quantity: lineItemData.quantity,
                unitPrice: lineItemData.unitPrice,
                amount: lineItemData.amount
              }
            });
            lineItemCount++;
          }
        }

        // Create Payments
        if (invoiceData.payments && Array.isArray(invoiceData.payments)) {
          for (const paymentData of invoiceData.payments) {
            await prisma.payment.create({
              data: {
                invoiceId: invoice.id,
                amount: paymentData.amount,
                paymentDate: new Date(paymentData.paymentDate),
                method: paymentData.method,
                reference: paymentData.reference || null
              }
            });
            paymentCount++;
          }
        }

        // Progress indicator
        if (invoiceCount % 10 === 0) {
          console.log(`   Processed ${invoiceCount} invoices...`);
        }
      } catch (error: any) {
        console.error(`❌ Error processing invoice ${invoiceData.invoiceNumber}:`, error.message);
        // Continue with next invoice instead of failing completely
      }
    }

    // Print summary
    console.log('\n✅ Seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Vendors: ${vendorCount}`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Invoices: ${invoiceCount}`);
    console.log(`   Line Items: ${lineItemCount}`);
    console.log(`   Payments: ${paymentCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
