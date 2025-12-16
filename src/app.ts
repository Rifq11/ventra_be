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
app.use('/ventra/api/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
import productsRoutes from './modules/products/products.routes';
import cashiersRoutes from './modules/cashiers/cashiers.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import combinationsRoutes from './modules/combinations/combinations.routes';

app.use('/ventra/api/products', productsRoutes);
app.use('/ventra/api/cashiers', cashiersRoutes);
app.use('/ventra/api/transactions', transactionsRoutes);
app.use('/ventra/api/combinations', combinationsRoutes);

// Error handler
app.use(errorHandler);

export default app;
