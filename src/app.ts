import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static files
// Static files untuk uploads - tidak digunakan lagi karena pakai BLOB dari DB
// app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
import productsRoutes from './modules/products/products.routes';
import cashiersRoutes from './modules/cashiers/cashiers.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import combinationsRoutes from './modules/combinations/combinations.routes';

app.use('/api/products', productsRoutes);
app.use('/api/cashiers', cashiersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/combinations', combinationsRoutes);

// Error handler
app.use(errorHandler);

export default app;
