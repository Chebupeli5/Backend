export const openApiSpec = {
  openapi: '3.0.3',
  info: { title: 'Finansik API', version: '0.1.0' },
  tags: [
    { name: 'System', description: 'Service health and misc endpoints' },
    { name: 'Auth', description: 'Authentication and authorization' },
    { name: 'Categories', description: 'Expense/Income categories and limits' },
    { name: 'Assets', description: 'Financial assets (cash, cards, accounts)' },
    { name: 'Savings', description: 'Savings accounts' },
    { name: 'Goals', description: 'Financial goals' },
    { name: 'Operations', description: 'Income/expense operations and analytics' },
    { name: 'Loans', description: 'Loans and schedules' },
    { name: 'Notifications', description: 'User`s and system notifications' },
    { name: 'Analytics', description: 'Global analytics' },
  ],
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
    '/health': { get: { tags: ['System'], summary: 'Health check', responses: { '200': { description: 'ok' } } } },
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Signup',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { login: { type: 'string' }, password: { type: 'string' }, visualname: { type: 'string' } }, required: ['login', 'password'] } } } },
        responses: { '200': { description: 'token' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login (returns access and refresh tokens)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { login: { type: 'string' }, password: { type: 'string' } }, required: ['login', 'password'] } } } },
        responses: { '200': { description: 'tokens' } },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } } } },
        responses: { '200': { description: 'new access token' } },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (revoke refresh token)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } } } },
        responses: { '204': { description: 'logged out' } },
      },
    },
    '/api/categories': {
      get: { tags: ['Categories'], summary: 'List categories', responses: { '200': { description: 'ok' } } },
      post: {
        tags: ['Categories'],
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
      get: { tags: ['Categories'], summary: 'List category limits', responses: { '200': { description: 'ok' } } },
      post: {
        tags: ['Categories'],
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
        tags: ['Categories'],
        summary: 'Delete category limit by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '204': { description: 'deleted' } },
      },
    },
    '/api/categories/{id}': {
      put: {
        tags: ['Categories'],
        summary: 'Update category',
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
                  name: { type: 'string', minLength: 1 },
                  balance: { type: 'integer' },
                  limit: { type: 'integer', nullable: true, description: 'Monthly limit; null to remove' },
                },
              },
              examples: {
                updateName: { value: { name: 'Еда и напитки' } },
                updateBalance: { value: { balance: 12000 } },
                setLimit: { value: { limit: 20000 } },
                removeLimit: { value: { limit: null } },
              },
            },
          },
        },
        responses: { '200': { description: 'updated' } },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '204': { description: 'deleted' } },
      },
    },
    // Operations
    '/api/operations': {
      get: {
        tags: ['Operations'],
        summary: 'List operations',
        parameters: [
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'category_id', schema: { type: 'integer' } },
          { in: 'query', name: 'type', schema: { type: 'string', enum: ['income', 'expense'] } },
          { in: 'query', name: 'q', schema: { type: 'string' }, description: 'Search in description' },
          { in: 'query', name: 'tags', schema: { type: 'string' }, description: 'Filter by tags substring' },
        ],
        responses: { '200': { description: 'ok' } },
      },
      post: {
        tags: ['Operations'],
        summary: 'Create operation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  category_id: { type: 'integer' },
                  type: { type: 'string', enum: ['income', 'expense'] },
                  transaction: { type: 'integer' },
                  date: { type: 'string', description: 'Operation date. Accepts ISO 8601 (e.g., 2025-10-15T10:00:00.000Z) or dd.MM.yyyy (e.g., 15.10.2025). If omitted, current date is used.' },
                  description: { type: 'string' },
                  tags: { type: 'string', description: 'Comma-separated tags' },
                  is_recurring: { type: 'boolean' },
                  recurring_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                  recurring_end_date: { type: 'string', format: 'date-time' },
                },
                required: ['category_id', 'type', 'transaction'],
              },
              examples: {
                income: { value: { category_id: 1, type: 'income', transaction: 50000, description: 'Salary', tags: 'salary,job', date: '15.10.2025' } },
                expense: { value: { category_id: 2, type: 'expense', transaction: 1500, description: 'Groceries', tags: 'food,supermarket', date: '2025-10-15T10:00:00.000Z' } },
              },
            },
          },
        },
        responses: { '201': { description: 'created' } },
      },
    },
    '/api/operations/{id}': {
      get: {
        tags: ['Operations'],
        summary: 'Get operation by id',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        responses: { '200': { description: 'ok' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Operations'],
        summary: 'Update operation',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  category_id: { type: 'integer' },
                  type: { type: 'string', enum: ['income', 'expense'] },
                  transaction: { type: 'integer' },
                  date: { type: 'string', format: 'date-time' },
                  description: { type: 'string' },
                  tags: { type: 'string', description: 'Comma-separated tags' },
                  is_recurring: { type: 'boolean' },
                  recurring_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                  recurring_end_date: { type: 'string', format: 'date-time' },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: { '200': { description: 'updated' } },
      },
      delete: {
        tags: ['Operations'],
        summary: 'Delete operation by id',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        responses: { '204': { description: 'deleted' } },
      },
    },
    '/api/analytics/balance': { get: { tags: ['Analytics'], summary: 'Balances', responses: { '200': { description: 'ok' } } } },
    // Loans
    '/api/loans': {
      get: { tags: ['Loans'], summary: 'List loans', responses: { '200': { description: 'List of loans for the authenticated user' } } },
      post: {
        tags: ['Loans'],
        summary: 'Create loan',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  credit_name: { type: 'string', minLength: 1, description: 'Loan/Credit name' },
                  loan_balance: { type: 'integer', minimum: 1, description: 'Outstanding loan balance' },
                  loan_payment: { type: 'integer', minimum: 1, description: 'Monthly payment amount' },
                  payment_date: { type: 'string', format: 'date-time', description: 'First payment date' },
                },
                required: ['credit_name', 'loan_balance', 'loan_payment', 'payment_date'],
              },
              examples: {
                basic: { value: { credit_name: 'Bank Loan', loan_balance: 100000, loan_payment: 10000, payment_date: '2025-01-15T00:00:00.000Z' } },
              },
            },
          },
        },
        responses: { '201': { description: 'created' } },
      },
    },
    '/api/loans/{id}': {
      get: {
        tags: ['Loans'],
        summary: 'Get loan by id',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        responses: { '200': { description: 'ok' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Loans'],
        summary: 'Update loan',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  credit_name: { type: 'string', minLength: 1 },
                  loan_balance: { type: 'integer', minimum: 1 },
                  loan_payment: { type: 'integer', minimum: 1 },
                  payment_date: { type: 'string', format: 'date-time' },
                },
              },
              examples: {
                updateName: { value: { credit_name: 'Updated Loan Name' } },
                updatePayment: { value: { loan_payment: 12000 } },
                fullUpdate: { value: { credit_name: 'Consolidated Loan', loan_balance: 80000, loan_payment: 9000, payment_date: '2025-02-01T00:00:00.000Z' } },
              },
            },
          },
        },
        responses: { '200': { description: 'updated' } },
      },
      delete: {
        tags: ['Loans'],
        summary: 'Delete loan by id',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        responses: { '204': { description: 'deleted' } },
      },
    },
    '/api/loans/schedule/{id}': {
      get: {
        tags: ['Loans'],
        summary: 'Get payment schedule for a loan',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        responses: {
          '200': {
            description: 'Payment schedule',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    schedule: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          installment: { type: 'integer' },
                          amount: { type: 'integer' },
                          due: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': { description: 'Not found' },
        },
      },
    },
    // Assets
    '/api/finance/assets': {
      get: { tags: ['Assets'], summary: 'List assets', responses: { '200': { description: 'ok' } } },
      post: {
        tags: ['Assets'],
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
      put: {
        tags: ['Assets'],
        summary: 'Update asset by id',
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
                  name: { type: 'string', minLength: 1 },
                  balance: { type: 'integer' },
                },
              },
              examples: {
                updateName: { value: { name: 'Наличные' } },
                updateBalance: { value: { balance: 25000 } },
                updateBoth: { value: { name: 'Дебетовая карта', balance: 150000 } },
              },
            },
          },
        },
        responses: { '200': { description: 'updated' } },
      },
      delete: {
        tags: ['Assets'],
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
        tags: ['Savings'],
        summary: 'List savings accounts', 
        responses: {
          '200': {
            description: 'List of savings accounts for the authenticated user',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      saving_name: { type: 'string' },
                      balance: { type: 'integer' },
                      interest_rate: { type: 'number' },
                      monthly_yield: { type: 'integer', description: 'Computed monthly yield based on interest_rate and balance' },
                      yearly_yield: { type: 'integer', description: 'Computed yearly yield based on interest_rate and balance' },
                    },
                  },
                },
              },
            },
          },
        }, 
      },
      post: {
        tags: ['Savings'],
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
        tags: ['Savings'],
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
        tags: ['Savings'],
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
        tags: ['Goals'],
        summary: 'List financial goals', 
        responses: { '200': { description: 'List of financial goals for the authenticated user' } } 
      },
      post: {
        tags: ['Goals'],
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
        tags: ['Goals'],
        summary: 'Get specific goal by ID',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Goal details' } },
      },
      put: {
        tags: ['Goals'],
        summary: 'Update financial goal (supports amount addition and completion)',
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
                  amount: { type: 'integer', minimum: 1, description: 'Add money to the goal; will also mark completed if target reached' },
                  complete: { type: 'boolean', description: 'Mark goal as completed' },
                },
              },
              examples: {
                updateName: { value: { goal_name: 'Updated Emergency Fund' } },
                updateAmount: { value: { goal: 75000 } },
                addMoney: { value: { amount: 5000 } },
                complete: { value: { complete: true } },
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
        responses: { 
          '200': { description: 'Goal updated successfully' },
          '400': { description: 'Cannot add money to completed goal' },
          '404': { description: 'Goal not found' },
        },
      },
      delete: {
        tags: ['Goals'],
        summary: 'Delete financial goal by id',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' } },
        ],
        responses: { '204': { description: 'Goal deleted successfully' } },
      },
    },
            '/api/goals/analytics/summary': {
      get: {
        tags: ['Goals'],
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
        tags: ['Goals'],
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
    // Notifications
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications',
        responses: { '200': { description: 'List of notifications for the authenticated user' } },
      },
      post: {
        tags: ['Notifications'],
        summary: 'Create notification',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { message: { type: 'string', minLength: 1 } },
                required: ['message'],
              },
              examples: {
                basic: { value: { message: 'Payment due soon' } },
              },
            },
          },
        },
        responses: { '201': { description: 'created' } },
      },
    },
    '/api/notifications/{id}': {
      get: {
        tags: ['Notifications'],
        summary: 'Get notification by id',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        responses: { '200': { description: 'ok' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Notifications'],
        summary: 'Update notification',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { message: { type: 'string', minLength: 1 } },
              },
              examples: { update: { value: { message: 'Updated message' } } },
            },
          },
        },
        responses: { '200': { description: 'updated' } },
      },
      delete: {
        tags: ['Notifications'],
        summary: 'Delete notification by id',
        parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'integer' } } ],
        responses: { '204': { description: 'deleted' } },
      },
    },
    '/api/notifications/due': {
      get: {
        tags: ['Notifications'],
        summary: 'Get due notifications (e.g., upcoming loan payments within 3 days)',
        responses: { '200': { description: 'List of upcoming due events' } },
      },
    },
  },
} as const;



