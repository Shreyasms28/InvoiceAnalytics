# Analytics Test Data

## Instructions

Place your `Analytics_Test_Data.json` file in this directory.

The seed script expects JSON data in one of these formats:

### Format 1: Array of Invoices
```json
[
  {
    "invoiceNumber": "INV-2024-00001",
    "vendor": {
      "name": "Acme Corp",
      "email": "billing@acmecorp.com"
    },
    "customer": {
      "name": "ABC Company"
    },
    "issueDate": "2024-01-15",
    "dueDate": "2024-02-15",
    "status": "paid",
    "subtotal": 1000,
    "tax": 80,
    "total": 1080,
    "lineItems": [
      {
        "category": "Office Supplies",
        "description": "Paper and pens",
        "quantity": 10,
        "unitPrice": 100,
        "amount": 1000
      }
    ],
    "payments": [
      {
        "amount": 1080,
        "paymentDate": "2024-02-10",
        "method": "bank_transfer",
        "reference": "PAY-001"
      }
    ]
  }
]
```

### Format 2: Object with Invoices Array
```json
{
  "invoices": [
    {
      "invoiceNumber": "INV-2024-00001",
      ...
    }
  ]
}
```

## If File is Missing

If `Analytics_Test_Data.json` is not found, the seed script will automatically generate 50 sample invoices with:
- Random vendors and customers
- Mixed statuses (paid, pending, overdue)
- Realistic dates and amounts
- Multiple line items per invoice
- Payment records for paid invoices

## Running the Seed

```bash
cd apps/api
npm run seed
```

Or manually:
```bash
npx ts-node prisma/seed.ts
```

## Data Structure Requirements

Each invoice must include:
- `invoiceNumber` (unique)
- `vendor` (name required)
- `customer` (name required)
- `issueDate` (ISO date string)
- `dueDate` (ISO date string)
- `status` ("paid", "pending", "overdue", or "cancelled")
- `total` (number)

Optional fields:
- `subtotal`, `tax`, `currency`, `notes`
- `lineItems` array
- `payments` array
