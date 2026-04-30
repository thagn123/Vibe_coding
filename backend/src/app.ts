import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import assistantRoutes from './routes/assistant.routes';
import authRoutes from './routes/auth.routes';
import bugRoutes from './routes/bug.routes';
import dashboardRoutes from './routes/dashboard.routes';
import helpRoutes from './routes/help.routes';
import promptRoutes from './routes/prompt.routes';
import userRoutes from './routes/user.routes';

const app = express();

app.use(
    cors({
        origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
        credentials: false,
    }),
);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many AI requests. Please retry shortly.',
        error: {
            code: 'RATE_LIMITED',
            statusCode: 429,
        },
    },
});

app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            environment: env.NODE_ENV,
            runnerMode: env.PYTEST_RUNNER_MODE,
        },
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/prompts', aiRateLimiter, promptRoutes);
app.use('/api/assistant', aiRateLimiter, assistantRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/help', helpRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
