import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with optimized settings for serverless
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  maxUses: 7500,
  allowExitOnIdle: false, // Keep connections alive
  idleTimeoutMillis: 30000 // 30 seconds
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Don't exit process on pool errors
});

export const db = drizzle({ client: pool, schema });