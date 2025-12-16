import { Router } from 'express';
import { ProductsController } from './products.controller';

const router = Router();

router.get('/', ProductsController.getProducts);
router.get('/:kode', ProductsController.getProductByKode);

export default router;
