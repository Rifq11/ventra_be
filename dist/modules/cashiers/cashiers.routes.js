"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cashiers_controller_1 = require("./cashiers.controller");
const router = (0, express_1.Router)();
router.get('/', cashiers_controller_1.CashiersController.getAllCashiers);
router.get('/active', cashiers_controller_1.CashiersController.getActiveCashiers);
router.get('/:kode', cashiers_controller_1.CashiersController.getCashierByKode);
exports.default = router;
