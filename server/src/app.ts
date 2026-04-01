import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import teamsRouter from './routes/teams';
import usersRouter from './routes/users';

// Create the Express application instance.
const app = express();

// Register common middleware.
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount feature routers.
app.use('/teams', teamsRouter);
app.use('/users', usersRouter);

// Basic health check for monitoring and diagnostics.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
