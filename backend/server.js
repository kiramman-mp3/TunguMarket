import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import wishlistRoutes from './src/routes/wishlistRoutes.js';
import withdrawalRoutes from './src/routes/withdrawalRoutes.js';
import addressRoutes from './src/routes/addressRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';
import { notFound, errorHandler } from './src/middlewares/errorMiddleware.js';
import initCronJobs from './src/utils/cronJobs.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Inicializa tareas programadas (Fin de mes, bloqueos, etc)
initCronJobs();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wallet', walletRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'TunguMarket API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
