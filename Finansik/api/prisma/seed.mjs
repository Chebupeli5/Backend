import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.users.upsert({
    where: { login: 'demo' },
    update: {},
    create: { login: 'demo', password, visualname: 'Demo User' },
  });

  const food = await prisma.categories.create({ data: { user_id: user.user_id, name: 'Продукты', balance: 0 } });
  const salary = await prisma.categories.create({ data: { user_id: user.user_id, name: 'Зарплата', balance: 0 } });
  await prisma.categorylimit.create({ data: { user_id: user.user_id, category_id: food.category_id, limit: 20000 } });

  await prisma.operations.createMany({
    data: [
      { user_id: user.user_id, category_id: salary.category_id, type: 'income', transaction: 120000, date: new Date() },
      { user_id: user.user_id, category_id: food.category_id, type: 'expense', transaction: 3500, date: new Date() },
    ],
  });

  await prisma.assets.create({ data: { user_id: user.user_id, name: 'Карта Tinkoff', balance: 15000 } });
  await prisma.savings_accounts.create({ data: { user_id: user.user_id, saving_name: 'Подушка', balance: 50000, interest_rate: 7.5 } });

  await prisma.financial_goals.create({ data: { user_id: user.user_id, goal_name: 'Новый ноутбук', goal: 120000 } });

  await prisma.loans.create({ data: { user_id: user.user_id, credit_name: 'Ипотека', loan_balance: 5000000, loan_payment: 45000, payment_date: new Date() } });

  await prisma.notifications.create({ data: { user_id: user.user_id, message: 'Добро пожаловать в Финансик!' } });
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });


