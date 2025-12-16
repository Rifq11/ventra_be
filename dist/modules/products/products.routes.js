"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const products_controller_1 = require("./products.controller");
const router = (0, express_1.Router)();
router.get('/', products_controller_1.ProductsController.getProducts);
router.get('/:kode', products_controller_1.ProductsController.getProductByKode);
exports.default = router;
