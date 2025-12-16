import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../common/async.handler';
import { CombinationsController } from './combinations.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', asyncHandler(CombinationsController.getByProductId));
router.post(
    '/',
    upload.single('pattern'),
    asyncHandler(CombinationsController.uploadPattern)
);

export default router;


