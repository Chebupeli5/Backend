import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

app.use(express.json());

// Handle preflight OPTIONS requests
app.options('*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
  res.sendStatus(200);
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Test endpoint for CORS debugging
app.get('/cors-test', (req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    origin: req.headers.origin,
    protocol: req.protocol,
    host: req.headers.host,
    'x-forwarded-proto': req.headers['x-forwarded-proto']
  });
});

app.use('/api', routes);
app.use('/docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  // Get the current host from the request
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers.host || 'localhost:3000';
  
  // Force HTTPS for ngrok domains
  let finalProtocol = protocol;
  if (host.includes('.ngrok')) {
    finalProtocol = 'https';
  } else if (req.headers['x-forwarded-proto'] === 'https') {
    finalProtocol = 'https';
  }
  const baseUrl = `${finalProtocol}://${host}`;
  
  // Log for debugging
  console.log(`Swagger UI accessed from: ${baseUrl}`);
  console.log(`Original protocol: ${protocol}, Final protocol: ${finalProtocol}`);
  
  // Create a modified OpenAPI spec with the current host
  const modifiedSpec = {
    ...openApiSpec,
    servers: [
      { url: baseUrl, description: 'Current server' },
      { url: 'http://localhost:3000', description: 'Local development server' },
      { url: 'http://{host}:3000', description: 'Custom server', variables: { host: { default: 'localhost' } } }
    ]
  };

  swaggerUi.setup(modifiedSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      // Force Swagger UI to use the first server (current host)
      url: undefined,
      urls: undefined
    },
    customSiteTitle: 'Finansik API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `
  })(req, res, next);
});

export default app;



