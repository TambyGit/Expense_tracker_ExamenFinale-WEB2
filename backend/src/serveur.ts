import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
// Adaptez à votre port Vite
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));