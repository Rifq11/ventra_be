"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const async_handler_1 = require("../../common/async.handler");
const combinations_controller_1 = require("./combinations.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.get('/:produk_id', (0, async_handler_1.asyncHandler)(combinations_controller_1.CombinationsController.getByProductId));
router.post('/', upload.single('pattern'), (0, async_handler_1.asyncHandler)(combinations_controller_1.CombinationsController.uploadPattern));
exports.default = router;
