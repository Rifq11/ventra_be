import { Router } from 'express';
import { TransactionsController } from './transactions.controller';
import { asyncHandler } from '../../common/async.handler';

const router = Router();

router.get('/', asyncHandler(TransactionsController.getTransactions));
router.get('/latest', asyncHandler(TransactionsController.getLatestTransaction));
router.get('/:id', asyncHandler(TransactionsController.getTransactionById));
router.post('/', asyncHandler(TransactionsController.createTransaction));
router.post(
    '/delete-latest',
    asyncHandler(TransactionsController.deleteLatest)
);

export default router;
