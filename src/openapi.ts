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
    // Financial Goals
    '/api/goals': {
      get: {
        summary: 'List all financial goals with progress',
        responses: {
          '200': {
            description: 'Goals with progress calculation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    goals: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          goal_name: { type: 'string' },
                          goal: { type: 'integer' },
                          description: { type: 'string' },
                          target_date: { type: 'string', format: 'date-time' },
                          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                          category: { type: 'string' },
                          current_amount: { type: 'integer' },
                          is_completed: { type: 'boolean' },
                          progress: { type: 'number' },
                          remaining_amount: { type: 'integer' },
                          is_overdue: { type: 'boolean' },
                          days_remaining: { type: 'integer' },
                        },
                      },
                    },
                    totalBalance: { type: 'integer' },
                    summary: {
                      type: 'object',
                      properties: {
                        total_goals: { type: 'integer' },
                        completed_goals: { type: 'integer' },
                        active_goals: { type: 'integer' },
                        overdue_goals: { type: 'integer' },
                        total_target_amount: { type: 'integer' },
                        total_current_amount: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create new financial goal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  goal_name: { type: 'string', minLength: 1, maxLength: 100 },
                  goal: { type: 'integer', minimum: 1 },
                  description: { type: 'string' },
                  target_date: { type: 'string', format: 'date-time' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
                  category: { type: 'string' },
                  current_amount: { type: 'integer', minimum: 0, default: 0 },
                  is_completed: { type: 'boolean', default: false },
                },
                required: ['goal_name', 'goal'],
              },
            },
          },
        },
        responses: { '201': { description: 'Goal created' } },
      },
    },
    '/api/goals/{id}': {
      get: {
        summary: 'Get specific goal by ID',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Goal details with progress' },
          '404': { description: 'Goal not found' },
        },
      },
      put: {
        summary: 'Update goal',
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
                  goal_name: { type: 'string', minLength: 1, maxLength: 100 },
                  goal: { type: 'integer', minimum: 1 },
                  description: { type: 'string' },
                  target_date: { type: 'string', format: 'date-time' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  category: { type: 'string' },
                  current_amount: { type: 'integer', minimum: 0 },
                  is_completed: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Goal updated' },
          '404': { description: 'Goal not found' },
        },
      },
      delete: {
        summary: 'Delete goal',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '204': { description: 'Goal deleted' },
          '404': { description: 'Goal not found' },
        },
      },
    },
    '/api/goals/{id}/add': {
      post: {
        summary: 'Add money to goal',
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
                  amount: { type: 'integer', minimum: 1 },
                },
                required: ['amount'],
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



