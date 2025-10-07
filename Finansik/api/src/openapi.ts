export const openApiSpec = {
  openapi: '3.0.3',
  info: { title: 'Finansik API', version: '0.1.0' },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { summary: 'Health check', responses: { '200': { description: 'ok' } } } },
    '/api/auth/signup': {
      post: {
        summary: 'Signup',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { login: { type: 'string' }, password: { type: 'string' }, visualname: { type: 'string' } }, required: ['login', 'password'] } } } },
        responses: { '200': { description: 'token' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login (returns access and refresh tokens)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { login: { type: 'string' }, password: { type: 'string' } }, required: ['login', 'password'] } } } },
        responses: { '200': { description: 'tokens' } },
      },
    },
    '/api/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } } } },
        responses: { '200': { description: 'new access token' } },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout (revoke refresh token)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } } } },
        responses: { '204': { description: 'logged out' } },
      },
    },
    '/api/categories': {
      get: { summary: 'List categories', responses: { '200': { description: 'ok' } } },
      post: { summary: 'Create category', requestBody: { required: true }, responses: { '201': { description: 'created' } } },
    },
    '/api/operations/summary/monthly': { get: { summary: 'Monthly summary', responses: { '200': { description: 'ok' } } } },
    '/api/analytics/balance': { get: { summary: 'Balances', responses: { '200': { description: 'ok' } } } },
  },
} as const;



