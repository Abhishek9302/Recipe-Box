import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool, initSchema, isDbUp } from './db';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import recipeRoutes from './routes/recipes';
import favoriteRoutes from './routes/favorites';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check — always 200 so the platform marks the service healthy;
// reports DB connectivity separately.
app.get('/health', async (_req, res) => {
  const dbUp = await isDbUp();
  res.json({ status: 'ok', db: dbUp ? 'up' : 'down', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/favorites', favoriteRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    // Test DB connection
    const client = await pool.connect();
    console.log('✅ Database connected');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    console.error('Make sure DATABASE_URL is set and the database is running.');
  }

  // Initialize schema (idempotent). Without this the tables never exist and
  // every /api/* query returns 500.
  try {
    await initSchema();
  } catch (err) {
    console.error('❌ Schema initialization failed:', err);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Recipe Box API running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Recipes: http://localhost:${PORT}/api/recipes`);
  });
}

start();
