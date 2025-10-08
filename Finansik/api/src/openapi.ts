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
    // Financial Goals
    '/api/goals': {
      get: { 
        summary: 'List financial goals', 
        responses: { '200': { description: 'List of financial goals for the authenticated user' } } 
      },
      post: {
        summary: 'Create financial goal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  goal_name: { type: 'string', minLength: 1, description: 'Name of the financial goal' },
                  goal: { type: 'integer', minimum: 1, description: 'Target amount to achieve' },
                  description: { type: 'string', description: 'Optional description of the goal' },
                  target_date: { type: 'string', format: 'date-time', description: 'Optional target date to achieve the goal' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium', description: 'Priority level of the goal' },
                  category: { type: 'string', description: 'Optional category for the goal' },
                  current_amount: { type: 'integer', minimum: 0, default: 0, description: 'Current amount saved towards the goal' },
                  user_id: { type: 'integer', description: 'Optional, admin only: create for another user' },
                },
                required: ['goal_name', 'goal'],
              },
              examples: {
                basic: { value: { goal_name: 'Emergency Fund', goal: 50000 } },
                detailed: { value: { 
                  goal_name: 'Vacation Fund', 
                  goal: 30000, 
                  description: 'Save for summer vacation',
                  target_date: '2024-06-30T23:59:59.000Z',
                  priority: 'medium',
                  category: 'Travel',
                  current_amount: 5000
                } },
                adminForUser: { value: { goal_name: 'House Down Payment', goal: 200000, user_id: 1 } },
              },
            },
          },
        },
        responses: { '201': { description: 'Financial goal created successfully' } },
      },
    },
    '/api/goals/{id}': {
      get: {
        summary: 'Get specific goal by ID',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Goal details' } },
      },
      put: {
        summary: 'Update financial goal',
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
                  goal_name: { type: 'string', minLength: 1, description: 'Name of the financial goal' },
                  goal: { type: 'integer', minimum: 1, description: 'Target amount to achieve' },
                  description: { type: 'string', description: 'Description of the goal' },
                  target_date: { type: 'string', format: 'date-time', description: 'Target date to achieve the goal' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level of the goal' },
                  category: { type: 'string', description: 'Category for the goal' },
                  current_amount: { type: 'integer', minimum: 0, description: 'Current amount saved towards the goal' },
                },
              },
              examples: {
                updateName: { value: { goal_name: 'Updated Emergency Fund' } },
                updateAmount: { value: { goal: 75000 } },
                updatePriority: { value: { priority: 'high' } },
                fullUpdate: { value: { 
                  goal_name: 'Premium Emergency Fund', 
                  goal: 100000, 
                  description: 'Updated description',
                  priority: 'high',
                  current_amount: 25000
                } },
              },
            },
          },
        },
        responses: { '200': { description: 'Goal updated successfully' } },
      },
      delete: {
        summary: 'Delete financial goal by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '204': { description: 'Goal deleted successfully' } },
      },
    },
    '/api/goals/{id}/add-money': {
      post: {
        summary: 'Add money to a goal',
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
                  amount: { type: 'integer', minimum: 1, description: 'Amount to add to the goal' },
                },
                required: ['amount'],
              },
              examples: {
                addMoney: { value: { amount: 5000 } },
                largeAmount: { value: { amount: 25000 } },
              },
            },
          },
        },
        responses: { 
          '200': { description: 'Money added to goal' },
          '400': { description: 'Cannot add money to completed goal' },
          '404': { description: 'Goal not found' },
        },
      },
    },
    '/api/goals/{id}/complete': {
      post: {
        summary: 'Mark goal as completed',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { 
          '200': { description: 'Goal marked as completed' },
          '404': { description: 'Goal not found' },
        },
      },
    },
    '/api/goals/analytics/summary': {
      get: {
        summary: 'Get goal analytics and summary',
        responses: { 
          '200': { 
            description: 'Goal analytics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_goals: { type: 'integer' },
                    completed_goals: { type: 'integer' },
                    active_goals: { type: 'integer' },
                    total_target_amount: { type: 'integer' },
                    total_current_amount: { type: 'integer' },
                    completion_rate: { type: 'number' },
                    average_goal_amount: { type: 'number' },
                    priority_distribution: {
                      type: 'object',
                      properties: {
                        high: { type: 'integer' },
                        medium: { type: 'integer' },
                        low: { type: 'integer' },
                      },
                    },
                    overdue_goals: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/goals/priority/{priority}': {
      get: {
        summary: 'Get goals by priority level',
        parameters: [
          { in: 'path', name: 'priority', required: true, schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
        ],
        responses: { 
          '200': { description: 'Goals filtered by priority' },
          '400': { description: 'Invalid priority level' },
        },
      },
    },
  },
} as const;



