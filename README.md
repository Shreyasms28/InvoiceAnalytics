# QualityAnalytics - Invoice Analytics Platform

A production-grade monorepo for invoice analytics featuring an interactive dashboard and AI-powered natural language SQL queries using Vanna AI with Groq.

## Architecture

This monorepo contains three main applications:

```
QualityAnalytics/
├── apps/
│   ├── web/          # Next.js frontend (adapted for Replit with Wouter)
│   └── api/          # Express.js backend with Prisma ORM
├── vanna/            # Python FastAPI Vanna AI service
└── client/           # Replit-specific frontend (for demo)
```

### Technology Stack

**Frontend (`apps/web` & `client/`):**
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- Chart.js (react-chartjs-2) for visualizations
- Wouter for routing (in Replit)
- TanStack Query for data fetching

**Backend (`apps/api`):**
- Node.js with Express.js
- Prisma ORM for PostgreSQL
- TypeScript
- RESTful API architecture

**AI Service (`vanna/`):**
- Python FastAPI
- Groq API for SQL generation
- psycopg3 for PostgreSQL queries
- SQL validation and safety checks

## Features

### Dashboard
- **Overview Cards**: Total Spend YTD, Total Invoices, Documents Uploaded, Avg Invoice Amount
- **Invoice Trends**: Dual-axis line chart showing amount and count over time
- **Top 10 Vendors**: Horizontal bar chart of highest spend vendors
- **Category Breakdown**: Pie chart of spending by category
- **Cash Outflow**: Projected monthly cash flow based on due dates
- **Invoice Table**: Searchable, filterable, paginated table with status badges

### Chat with Data
- Natural language query interface
- AI-powered SQL generation using Groq
- Real-time query execution
- Results displayed in formatted tables
- SQL query visibility for transparency

## Environment Variables

### apps/api (.env)
```bash
DATABASE_URL="postgresql://user:password@host:5432/invoice_analytics?schema=public"
PORT=4000
NODE_ENV=development
VANNA_AI_URL="http://localhost:8000"
DATA_FILE_PATH="./prisma/data/Analytics_Test_Data.json"
```

### vanna (.env)
```bash
DATABASE_URL="postgresql://user:password@host:5432/invoice_analytics"
GROQ_API_KEY="your_groq_api_key_here"
GROQ_API_URL="https://api.groq.com/openai/v1/chat/completions"
MAX_ROWS=100
ALLOWED_TABLES="invoices,vendors,customers,categories,line_items,payments"
CORS_ORIGINS="http://localhost:3000,http://localhost:5000,http://localhost:4000"
```

**Get your Groq API key**: https://console.groq.com/keys

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- Python 3.10+
- PostgreSQL 14+
- npm or yarn

### Step-by-Step Instructions

#### 1. Install Root Dependencies
```bash
npm install
```

#### 2. Set Up API (Express + Prisma)
```bash
cd apps/api
npm install
npm run prisma:generate

# Configure DATABASE_URL in apps/api/.env
# Example for local PostgreSQL:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/invoice_analytics?schema=public"

# Create database tables
npx prisma db push

# Or use migrations:
npx prisma migrate dev --name init
```

#### 3. Seed the Database
```bash
# Place your Analytics_Test_Data.json file at:
# apps/api/prisma/data/Analytics_Test_Data.json

# Run the seed script
npm run seed

# Or manually:
npx ts-node prisma/seed.ts
```

**Note**: If you don't have `Analytics_Test_Data.json`, the seed script will generate sample data automatically.

#### 4. Start the API Server
```bash
cd apps/api
npm run dev
# Server runs on http://localhost:4000
```

#### 5. Set Up Vanna AI Service (Python)
```bash
cd vanna

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env file with:
# - DATABASE_URL (same as API)
# - GROQ_API_KEY (get from https://console.groq.com/keys)

# Start Vanna service
uvicorn app:app --reload --port 8000
# Service runs on http://localhost:8000
```

#### 6. Start the Frontend

**For Replit (current setup):**
```bash
npm run dev
# Frontend runs on http://localhost:5000
```

**For Next.js (when running locally):**
```bash
cd apps/web
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### Testing the Setup

1. **Test API Health**:
   ```bash
   curl http://localhost:4000/health
   ```

2. **Test Stats Endpoint**:
   ```bash
   curl http://localhost:4000/api/stats
   ```

3. **Test Vanna AI**:
   ```bash
   curl -X POST http://localhost:8000/query \
     -H "Content-Type: application/json" \
     -d '{"query":"Show me the top 5 vendors by spend"}'
   ```

4. **Test Chat Proxy**:
   ```bash
   curl -X POST http://localhost:4000/api/chat-with-data \
     -H "Content-Type: application/json" \
     -d '{"query":"List top 5 vendors by spend"}'
   ```

## Running in Different Terminals

For full functionality, run these three commands in separate terminal windows:

```bash
# Terminal 1 - API Server
cd apps/api && npm run dev

# Terminal 2 - Vanna AI Service  
cd vanna && source .venv/bin/activate && uvicorn app:app --reload --port 8000

# Terminal 3 - Frontend
npm run dev
```

## Database Schema

The Prisma schema models these entities:

- **Vendor**: Companies/suppliers sending invoices
- **Customer**: Businesses receiving invoices
- **Category**: Line item categorization (e.g., "Office Supplies")
- **Invoice**: Main payment obligation entity
- **LineItem**: Individual items/services on an invoice
- **Payment**: Payment records against invoices

See `apps/api/prisma/schema.prisma` for full schema definition with relations.

## Data Seeding

The seed script (`apps/api/prisma/seed.ts`) normalizes nested JSON data into the relational schema:

1. Reads `Analytics_Test_Data.json` (or generates sample data if missing)
2. Upserts Vendors and Customers (idempotent)
3. Creates Invoices with proper foreign keys
4. Creates LineItems linked to Invoices and Categories
5. Creates Payment records for paid invoices

**Seed script features:**
- Defensive error handling (continues on individual failures)
- Progress indicators
- Detailed summary logging
- Idempotent operations (safe to run multiple times)

## Security Features (Vanna AI)

The Vanna service implements multiple security layers:

1. **SQL Validation**: Only SELECT statements allowed
2. **Keyword Blocking**: Prevents DROP, DELETE, INSERT, UPDATE, etc.
3. **Table Whitelist**: Only allows queries against approved tables
4. **Row Limits**: Enforces MAX_ROWS limit (default 100)
5. **No Semicolons**: Prevents SQL injection via multiple statements
6. **Read-Only Transactions**: Database connection set to read-only

## Troubleshooting

### Windows-Specific Issues

**psycopg installation fails:**
- Install Visual C++ Build Tools: https://visualstudio.microsoft.com/downloads/
- Or use WSL2 for Linux environment

**Virtual environment activation:**
```powershell
# PowerShell
.venv\Scripts\Activate.ps1

# CMD
.venv\Scripts\activate.bat
```

### Common Issues

**Port already in use:**
```bash
# Change PORT in .env files:
# API: PORT=4001
# Vanna: uvicorn app:app --port 8001
# Frontend: Update VITE_API_URL if needed
```

**Prisma client not found:**
```bash
cd apps/api
npm run prisma:generate
```

**Database connection failed:**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists: `CREATE DATABASE invoice_analytics;`

**Groq API errors:**
- Verify GROQ_API_KEY is set correctly
- Check API quota: https://console.groq.com/
- Ensure GROQ_API_URL is correct

## Replit Deployment Notes

PostgreSQL cannot run directly in Replit's sandbox. For Replit deployment:

1. **Use Remote PostgreSQL**:
   - Neon: https://neon.tech (recommended)
   - Supabase: https://supabase.com
   - ElephantSQL: https://www.elephantsql.com

2. **Set DATABASE_URL** to remote connection string in Replit Secrets

3. **Run seed from Replit shell**:
   ```bash
   cd apps/api
   npx ts-node prisma/seed.ts
   ```

4. **Vanna service** may need to run externally (Replit doesn't support Python + Node.js simultaneously)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Overview statistics |
| GET | `/api/invoice-trends` | Monthly trend data |
| GET | `/api/vendors/top10` | Top 10 vendors by spend |
| GET | `/api/category-spend` | Spending by category |
| GET | `/api/cash-outflow` | Projected cash outflow |
| GET | `/api/invoices` | Searchable invoice list |
| POST | `/api/chat-with-data` | Natural language SQL queries |

## Chart.js Configuration

All charts use:
- `maintainAspectRatio: false` for fixed-height containers
- Consistent color scheme from design tokens
- Responsive sizing
- Custom tooltip styling
- Inter font family

## Design System

- **Primary Font**: Inter (Google Fonts)
- **Mono Font**: JetBrains Mono (for SQL/invoice numbers)
- **Color Scheme**: Defined in `client/src/index.css`
- **Components**: shadcn/ui with Tailwind CSS
- **Icons**: Lucide React

## License

MIT

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review environment variable configuration
3. Verify all services are running
4. Check browser console and server logs

---

**Built with**: React • Express • Prisma • FastAPI • Groq • Chart.js • Tailwind CSS • shadcn/ui
