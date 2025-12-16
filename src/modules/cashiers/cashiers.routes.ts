import { Router } from 'express';
import { CashiersController } from './cashiers.controller';
import { asyncHandler } from '../../common/async.handler';

const router = Router();

router.get('/', asyncHandler(CashiersController.getAllCashiers));
router.get('/active', asyncHandler(CashiersController.getActiveCashiers));
router.get('/:kode', asyncHandler(CashiersController.getCashierByKode));

export default router;
