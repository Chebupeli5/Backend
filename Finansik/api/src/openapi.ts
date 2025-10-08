export const openApiSpec = {
  openapi: '3.0.3',
  info: { title: 'Finansik API', version: '0.1.0' },
  servers: [
    { url: 'http://localhost:3000', description: 'Local development server' },
    { url: 'http://{host}:3000', description: 'Custom server', variables: { host: { default: 'localhost' } } },
    { url: 'http://{host}:80', description: 'Via nginx gateway', variables: { host: { default: 'localhost' } } }
  ],
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
      post: {
        summary: 'Create category',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  balance: { type: 'integer', description: 'Optional. Defaults to 0' },
                  user_id: { type: 'integer', description: 'Optional, admin only: create for another user' },
                },
                required: ['name'],
              },
              examples: {
                basic: { value: { name: 'Food' } },
                withBalance: { value: { name: 'Food', balance: 0 } },
                adminForUser: { value: { name: 'Food', user_id: 1 } },
              },
            },
          },
        },
        responses: { '201': { description: 'created' } },
      },
    },
    '/api/categories/limits': {
      get: { summary: 'List category limits', responses: { '200': { description: 'ok' } } },
      post: {
        summary: 'Create category limit',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  category_id: { type: 'integer' },
                  limit: { type: 'integer', description: 'Nonnegative monthly limit' },
                  user_id: { type: 'integer', description: 'Optional, admin only: create for another user' },
                },
                required: ['category_id', 'limit'],
              },
              examples: {
                basic: { value: { category_id: 1, limit: 20000 } },
                adminForUser: { value: { category_id: 1, limit: 20000, user_id: 2 } },
              },
            },
          },
        },
        responses: { '201': { description: 'created' } },
      },
    },
    '/api/categories/limits/{id}': {
      delete: {
        summary: 'Delete category limit by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '204': { description: 'deleted' } },
      },
    },
    '/api/categories/{id}': {
      delete: {
        summary: 'Delete category by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '204': { description: 'deleted' } },
      },
    },
    '/api/analytics/balance': { get: { summary: 'Balances', responses: { '200': { description: 'ok' } } } },
    // Assets
    '/api/finance/assets': {
      get: { summary: 'List assets', responses: { '200': { description: 'ok' } } },
      post: {
        summary: 'Create asset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  balance: { type: 'integer', description: 'Optional. Defaults to 0' },
                  user_id: { type: 'integer', description: 'Optional, admin only: create for another user' },
                },
                required: ['name'],
              },
              examples: {
                basic: { value: { name: 'Cash' } },
                withBalance: { value: { name: 'Debit Card', balance: 15000 } },
                adminForUser: { value: { name: 'Cash', user_id: 1 } },
              },
            },
          },
        },
        responses: { '201': { description: 'created' } },
      },
    },
    '/api/finance/assets/{id}': {
      delete: {
        summary: 'Delete asset by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '204': { description: 'deleted' } },
      },
    },
    // Savings Accounts
    '/api/savings_accounts': {
      get: { 
        summary: 'List savings accounts', 
        responses: { '200': { description: 'List of savings accounts for the authenticated user' } } 
      },
      post: {
        summary: 'Create savings account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  saving_name: { type: 'string', minLength: 1, description: 'Name of the savings account' },
                  balance: { type: 'integer', description: 'Optional. Initial balance. Defaults to 0' },
                  interest_rate: { type: 'number', minimum: 0, maximum: 100, description: 'Optional. Interest rate percentage. Defaults to 0' },
                  user_id: { type: 'integer', description: 'Optional, admin only: create for another user' },
                },
                required: ['saving_name'],
              },
              examples: {
                basic: { value: { saving_name: 'Emergency Fund' } },
                withDetails: { value: { saving_name: 'High Yield Savings', balance: 50000, interest_rate: 4.5 } },
                adminForUser: { value: { saving_name: 'Vacation Fund', user_id: 1 } },
              },
            },
          },
        },
        responses: { '201': { description: 'Savings account created successfully' } },
      },
    },
    '/api/savings_accounts/{id}': {
      put: {
        summary: 'Update savings account',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  saving_name: { type: 'string', minLength: 1, description: 'Name of the savings account' },
                  balance: { type: 'integer', description: 'Current balance' },
                  interest_rate: { type: 'number', minimum: 0, maximum: 100, description: 'Interest rate percentage' },
                },
              },
              examples: {
                updateName: { value: { saving_name: 'Updated Emergency Fund' } },
                updateBalance: { value: { balance: 75000 } },
                updateInterest: { value: { interest_rate: 5.0 } },
                fullUpdate: { value: { saving_name: 'Premium Savings', balance: 100000, interest_rate: 6.0 } },
              },
            },
          },
        },
        responses: { '200': { description: 'Savings account updated successfully' } },
      },
      delete: {
        summary: 'Delete savings account by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '204': { description: 'Savings account deleted successfully' } },
      },
    },
  },
} as const;



