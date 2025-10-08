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
    // Operations API
    '/api/operations': {
      get: {
        summary: 'Get all operations with advanced filtering and pagination',
        parameters: [
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' }, description: 'Start date filter' },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' }, description: 'End date filter' },
          { in: 'query', name: 'category_id', schema: { type: 'integer' }, description: 'Filter by category' },
          { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] }, description: 'Filter by type' },
          { in: 'query', name: 'tags', schema: { type: 'string' }, description: 'Filter by tags (comma-separated)' },
          { in: 'query', name: 'min_amount', schema: { type: 'integer' }, description: 'Minimum amount filter' },
          { in: 'query', name: 'max_amount', schema: { type: 'integer' }, description: 'Maximum amount filter' },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search in descriptions' },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 }, description: 'Items per page' },
          { in: 'query', name: 'sort_by', schema: { type: 'string', default: 'date' }, description: 'Sort field' },
          { in: 'query', name: 'sort_order', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort order' },
        ],
        responses: {
          '200': {
            description: 'Operations with pagination and summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    operations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          operation_id: { type: 'integer' },
                          category_id: { type: 'integer' },
                          type: { type: 'string', enum: ['income', 'expense'] },
                          transaction: { type: 'integer' },
                          date: { type: 'string', format: 'date-time' },
                          description: { type: 'string' },
                          tags: { type: 'string' },
                          is_recurring: { type: 'boolean' },
                          recurring_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                          category: { type: 'object', properties: { category_id: { type: 'integer' }, name: { type: 'string' } } },
                        },
                      },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        hasNext: { type: 'boolean' },
                        hasPrev: { type: 'boolean' },
                      },
                    },
                    summary: {
                      type: 'object',
                      properties: {
                        total_operations: { type: 'integer' },
                        total_amount: { type: 'integer' },
                        average_amount: { type: 'integer' },
                        income_total: { type: 'integer' },
                        expense_total: { type: 'integer' },
                        net_amount: { type: 'integer' },
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
        summary: 'Create new operation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  category_id: { type: 'integer', minimum: 1 },
                  type: { type: 'string', enum: ['income', 'expense'] },
                  transaction: { type: 'integer' },
                  date: { type: 'string', format: 'date-time' },
                  description: { type: 'string' },
                  tags: { type: 'string' },
                  is_recurring: { type: 'boolean', default: false },
                  recurring_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                  recurring_end_date: { type: 'string', format: 'date-time' },
                },
                required: ['category_id', 'type', 'transaction'],
              },
            },
          },
        },
        responses: { '201': { description: 'Operation created' } },
      },
    },
    '/api/operations/{id}': {
      get: {
        summary: 'Get specific operation by ID',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Operation details' },
          '404': { description: 'Operation not found' },
        },
      },
      put: {
        summary: 'Update operation',
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
                  category_id: { type: 'integer', minimum: 1 },
                  type: { type: 'string', enum: ['income', 'expense'] },
                  transaction: { type: 'integer' },
                  date: { type: 'string', format: 'date-time' },
                  description: { type: 'string' },
                  tags: { type: 'string' },
                  is_recurring: { type: 'boolean' },
                  recurring_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                  recurring_end_date: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Operation updated' },
          '404': { description: 'Operation not found' },
        },
      },
      delete: {
        summary: 'Delete operation',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '204': { description: 'Operation deleted' },
          '404': { description: 'Operation not found' },
        },
      },
    },
    '/api/operations/bulk': {
      post: {
        summary: 'Create multiple operations at once',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  operations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        category_id: { type: 'integer', minimum: 1 },
                        type: { type: 'string', enum: ['income', 'expense'] },
                        transaction: { type: 'integer' },
                        date: { type: 'string', format: 'date-time' },
                        description: { type: 'string' },
                        tags: { type: 'string' },
                        is_recurring: { type: 'boolean', default: false },
                        recurring_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                        recurring_end_date: { type: 'string', format: 'date-time' },
                      },
                      required: ['category_id', 'type', 'transaction'],
                    },
                    maxItems: 100,
                  },
                },
                required: ['operations'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Bulk operations created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    created_count: { type: 'integer' },
                    requested_count: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/operations/summary/monthly': {
      get: {
        summary: 'Get monthly summary with enhanced data',
        parameters: [
          { in: 'query', name: 'year', schema: { type: 'integer' }, description: 'Year (defaults to current year)' },
        ],
        responses: {
          '200': {
            description: 'Monthly summary with year totals',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    monthly_data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          month: { type: 'string', format: 'date-time' },
                          income: { type: 'number' },
                          expense: { type: 'number' },
                          operation_count: { type: 'integer' },
                          average_amount: { type: 'number' },
                        },
                      },
                    },
                    year_summary: {
                      type: 'object',
                      properties: {
                        total_operations: { type: 'integer' },
                        total_amount: { type: 'number' },
                        income_total: { type: 'number' },
                        expense_total: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/operations/summary/by-category': {
      get: {
        summary: 'Get category summary with enhanced data',
        parameters: [
          { in: 'query', name: 'year', schema: { type: 'integer' }, description: 'Filter by year' },
          { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] }, description: 'Filter by type' },
        ],
        responses: {
          '200': {
            description: 'Category summary with operation counts and averages',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category_id: { type: 'integer' },
                      name: { type: 'string' },
                      income: { type: 'number' },
                      expense: { type: 'number' },
                      operation_count: { type: 'integer' },
                      average_amount: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/operations/summary/daily': {
      get: {
        summary: 'Get daily summary',
        parameters: [
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' }, description: 'Start date (defaults to 30 days ago)' },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' }, description: 'End date (defaults to today)' },
        ],
        responses: {
          '200': {
            description: 'Daily summary data',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      day: { type: 'string', format: 'date-time' },
                      income: { type: 'number' },
                      expense: { type: 'number' },
                      operation_count: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/operations/analytics/insights': {
      get: {
        summary: 'Get spending analytics and insights',
        parameters: [
          { in: 'query', name: 'period', schema: { type: 'integer', default: 30 }, description: 'Period in days' },
        ],
        responses: {
          '200': {
            description: 'Analytics insights including spending patterns, top categories, and trends',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    spending_patterns: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          hour: { type: 'integer' },
                          day_of_week: { type: 'integer' },
                          average_amount: { type: 'number' },
                          operation_count: { type: 'integer' },
                        },
                      },
                    },
                    top_categories: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          total_amount: { type: 'number' },
                          operation_count: { type: 'integer' },
                        },
                      },
                    },
                    monthly_trends: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          month: { type: 'string', format: 'date-time' },
                          income: { type: 'number' },
                          expense: { type: 'number' },
                        },
                      },
                    },
                    period_days: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/operations/export/csv': {
      get: {
        summary: 'Export operations to CSV',
        parameters: [
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' }, description: 'Start date filter' },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' }, description: 'End date filter' },
          { in: 'query', name: 'category_id', schema: { type: 'integer' }, description: 'Filter by category' },
          { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] }, description: 'Filter by type' },
        ],
        responses: {
          '200': {
            description: 'CSV file download',
            content: {
              'text/csv': {
                schema: { type: 'string' },
              },
            },
          },
        },
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



