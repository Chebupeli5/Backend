import { Router } from 'express';
import authRouter from './auth.js';
import categoriesRouter from './categories.js';
import operationsRouter from './operations.js';
import assetsRouter from './assets.js';
import goalsRouter from './goals.js';
import loansRouter from './loans.js';
import notificationsRouter from './notifications.js';
import reportsRouter from './reports.js';
import analyticsRouter from './analytics.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/categories', categoriesRouter);
router.use('/operations', operationsRouter);
router.use('/finance', assetsRouter);
router.use('/goals', goalsRouter);
router.use('/loans', loansRouter);
router.use('/notifications', notificationsRouter);
router.use('/reports', reportsRouter);
router.use('/analytics', analyticsRouter);

export default router;



