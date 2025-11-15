import express from 'express';
import routes from './routes';
import cors from 'cors';
import { requestLogger, errorLogger } from './shared/middlewares/logging';
import { compressionMiddleware, cacheMiddleware } from './shared/middlewares/optimization';
import { setupSwagger } from "./swagger/swaggerConfig";

const app = express();

// Middleware de compressão (antes de outros middlewares)
app.use(compressionMiddleware);

app.use(
  cors({
    origin: true, // Permite qualquer origem
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);

// Middleware adicional para CORS (caso o acima não funcione)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
setupSwagger(app);

// Middleware de logging de requests
app.use(requestLogger);

// Middleware de cache
app.use(cacheMiddleware);

app.use('/api', routes);

// Middleware de logging de erros (deve ser o último)
app.use(errorLogger);

export default app;
