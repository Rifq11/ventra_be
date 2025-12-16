import { Router } from 'express';
import { CashiersController } from './cashiers.controller';

const router = Router();

router.get('/', CashiersController.getAllCashiers);
router.get('/active', CashiersController.getActiveCashiers);
router.get('/:kode', CashiersController.getCashierByKode);

export default router;
