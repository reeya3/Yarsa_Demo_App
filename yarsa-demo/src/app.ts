import express from 'express';
import userRoutes from './routes/userRoutes';
import { initDB } from './controllers/userController';

const app = express();
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Yarsa Demo API is running! Use /users endpoints');
});

app.use('/users', userRoutes);

const start = async () => {
  await initDB();
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Yarsa Demo running on port ${PORT}`);
  });
};

start();
