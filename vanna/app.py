"""
Vanna AI Service - FastAPI application for natural language to SQL conversion

This service:
1. Receives natural language queries from the frontend
2. Calls Groq API to generate SQL from the query
3. Validates the SQL for safety (SELECT only, no semicolons, table whitelist, row limits)
4. Executes the SQL on PostgreSQL using psycopg
5. Returns both the generated SQL and query results

Security measures:
- Only allows SELECT statements
- Enforces table whitelist (ALLOWED_TABLES env var)
- Limits row count (MAX_ROWS env var)
- No semicolons or multiple statements
- Runs SQL in read-only mode
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import re
import psycopg
from typing import List, Dict, Any
import httpx
from dotenv import load_dotenv
import traceback
import asyncio
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

app = FastAPI(
    title="Vanna AI SQL Service",
    description="Natural language to SQL conversion service using Groq",
    version="1.0.0"
)

# CORS configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/invoice_analytics")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
MAX_ROWS = int(os.getenv("MAX_ROWS", "100"))
ALLOWED_TABLES = os.getenv("ALLOWED_TABLES", "invoices,vendors,customers,categories,line_items,payments").split(",")
FALLBACK_ENABLED = os.getenv("FALLBACK_ENABLED", "true").lower() in ("1", "true", "yes", "on")

# Thread pool for blocking database operations
executor = ThreadPoolExecutor(max_workers=5)

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    sql: str
    rows: List[Dict[str, Any]]

# SQL prompt template for Groq
SQL_PROMPT_TEMPLATE = """You are a SQL expert. Convert the following natural language query into a PostgreSQL SQL query.

Database Schema (tables are snake_case, columns are camelCase to match the actual database):
- vendors (id, name, email, phone, address)
- customers (id, name, email, phone, address)
- invoices (id, invoiceNumber, vendorId, customerId, issueDate, dueDate, status, subtotal, tax, total, currency, notes)
- line_items (id, invoiceId, categoryId, description, quantity, unitPrice, amount)
- categories (id, name)
- payments (id, invoiceId, amount, paymentDate, method, reference)

Important rules:
1. ONLY generate SELECT statements (no INSERT, UPDATE, DELETE, DROP, etc.)
2. Use the exact column names shown above (camelCase), and the exact table names shown above (snake_case plural).
3. DOUBLE-QUOTE all column names (e.g., "invoiceNumber", "vendorId") to preserve camelCase in PostgreSQL. Do NOT quote table names.
4. Use appropriate JOINs when querying related tables
5. Include ORDER BY and LIMIT clauses when appropriate
6. Return ONLY the SQL query, no explanations or markdown

Natural language query: {query}

SQL query:"""

def validate_sql(sql: str) -> bool:
    """
    Validate SQL for security:
    - Must be a SELECT statement
    - No semicolons (prevents multiple statements)
    - Only references allowed tables
    - No dangerous keywords
    """
    sql_upper = sql.upper().strip()
    
    # Must start with SELECT
    if not sql_upper.startswith("SELECT"):
        raise ValueError("Only SELECT queries are allowed")
    
    # No semicolons (prevent SQL injection with multiple statements)
    if ";" in sql:
        raise ValueError("Semicolons are not allowed")
    
    # Check for dangerous keywords
    dangerous_keywords = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE", "TRUNCATE", "EXEC", "EXECUTE"]
    for keyword in dangerous_keywords:
        if keyword in sql_upper:
            raise ValueError(f"Keyword '{keyword}' is not allowed")
    
    # Verify only allowed tables are referenced
    # Support schema-qualified names (e.g., public.invoices), quoted identifiers, and aliases
    table_pattern = re.compile(r'\bFROM\s+([A-Z0-9_\."]+)|\bJOIN\s+([A-Z0-9_\."]+)', re.IGNORECASE)
    for match in table_pattern.finditer(sql_upper):
        raw = match.group(1) or match.group(2) or ""
        # take the first token before whitespace
        token = raw.strip().split()[0]
        # remove surrounding quotes
        token = token.replace('"', '')
        # if schema-qualified, take the last segment
        table = token.split('.')[-1]
        if table.lower() not in [t.strip().lower() for t in ALLOWED_TABLES]:
            raise ValueError(f"Table '{table}' is not in the allowed list: {ALLOWED_TABLES}")
    
    return True

async def generate_sql_with_groq(query: str) -> str:
    """
    Call Groq API to generate SQL from natural language query
    """
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    prompt = SQL_PROMPT_TEMPLATE.format(query=query)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a SQL expert that converts natural language to PostgreSQL queries."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,  # Low temperature for more consistent SQL generation
                "max_tokens": 500
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Groq API error: {response.text}")
        
        result = response.json()
        sql = result["choices"][0]["message"]["content"].strip()
        
        # Clean up SQL (remove markdown code blocks if present)
        sql = re.sub(r'^```sql\s*', '', sql, flags=re.MULTILINE)
        sql = re.sub(r'^```\s*', '', sql, flags=re.MULTILINE)
        sql = sql.strip()
        
        return sql

def generate_fallback_sql(nl_query: str) -> str | None:
    """Very simple intent matcher that returns known-good SQL for common queries.
    Columns are camelCase and must be double-quoted.
    Tables are snake_case.
    Returns None if no fallback applies.
    """
    q = (nl_query or "").lower()
    # Top vendors by spend
    if ("top" in q and "vendor" in q and ("spend" in q or "total" in q)) or (
        "top 5 vendors" in q
    ):
        return (
            'SELECT v.name AS "vendor", SUM(i."total") AS "total"\n'
            'FROM invoices i\n'
            'JOIN vendors v ON v.id = i."vendorId"\n'
            "WHERE i.status <> 'cancelled'\n"
            'GROUP BY v.name\n'
            'ORDER BY "total" DESC\n'
            'LIMIT 5'
        )
    return None

def execute_sql_sync(sql: str) -> List[Dict[str, Any]]:
    """
    Execute SQL query synchronously (runs in thread pool)
    Uses psycopg3 with read-only transaction
    """
    # Add LIMIT if not present (safety measure)
    if "LIMIT" not in sql.upper():
        sql = f"{sql} LIMIT {MAX_ROWS}"
    
    # Connect and execute
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            # Start an explicit read-only transaction
            cur.execute("BEGIN READ ONLY")
            cur.execute(sql)
            
            # Get column names
            columns = [desc[0] for desc in cur.description]
            
            # Fetch rows and convert to list of dicts
            rows = []
            for row in cur.fetchall():
                row_dict = {}
                for i, col in enumerate(columns):
                    value = row[i]
                    # Convert dates to ISO strings for JSON serialization
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    row_dict[col] = value
                rows.append(row_dict)
            
            return rows

async def execute_sql(sql: str) -> List[Dict[str, Any]]:
    """
    Execute SQL query in thread pool (async wrapper for blocking psycopg)
    """
    loop = asyncio.get_event_loop()
    rows = await loop.run_in_executor(executor, execute_sql_sync, sql)
    return rows

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Vanna AI SQL Service",
        "status": "running",
        "groq_configured": bool(GROQ_API_KEY),
        "database_configured": bool(DATABASE_URL)
    }

@app.post("/query", response_model=QueryResponse)
async def query_data(request: QueryRequest):
    """
    Main endpoint: Convert natural language to SQL, validate, execute, return results
    """
    try:
        # Step 1: Generate SQL (Groq or fallback)
        sql: str
        try:
            sql = await generate_sql_with_groq(request.query)
        except Exception as groq_err:
            if FALLBACK_ENABLED:
                fb = generate_fallback_sql(request.query)
                if fb:
                    sql = fb
                else:
                    # No fallback matched; rethrow for proper error to client
                    raise groq_err
            else:
                raise groq_err
        print("Generated SQL:", sql)
        
        # Step 2: Validate SQL for safety
        validate_sql(sql)
        
        # Step 3: Execute SQL
        rows = await execute_sql(sql)
        
        # Step 4: Return results
        return QueryResponse(sql=sql, rows=rows)
        
    except ValueError as e:
        print("Validation error:", traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")
    except psycopg.Error as e:
        print("Database error:", traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")
    except Exception as e:
        # If it's already an HTTPException (e.g., Groq error bubbled up), re-raise as-is
        if isinstance(e, HTTPException):
            raise e
        print("Internal error:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

# Alternative: Using asyncpg instead of psycopg (for Linux/production)
# Uncomment this section and comment out the psycopg version above if needed
"""
import asyncpg

async def execute_sql_asyncpg(sql: str) -> List[Dict[str, Any]]:
    # Add LIMIT if not present
    if "LIMIT" not in sql.upper():
        sql = f"{sql} LIMIT {MAX_ROWS}"
    
    # Parse DATABASE_URL for asyncpg
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Execute query
        rows = await conn.fetch(sql)
        
        # Convert to list of dicts
        return [dict(row) for row in rows]
    finally:
        await conn.close()
"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
