"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_middleware_1 = require("./middleware/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Static files
// Static files untuk uploads - tidak digunakan lagi karena pakai BLOB dari DB
// app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads')));
// Routes
const products_routes_1 = __importDefault(require("./modules/products/products.routes"));
const cashiers_routes_1 = __importDefault(require("./modules/cashiers/cashiers.routes"));
const transactions_routes_1 = __importDefault(require("./modules/transactions/transactions.routes"));
const combinations_routes_1 = __importDefault(require("./modules/combinations/combinations.routes"));
app.use('/api/products', products_routes_1.default);
app.use('/api/cashiers', cashiers_routes_1.default);
app.use('/api/transactions', transactions_routes_1.default);
app.use('/api/combinations', combinations_routes_1.default);
// Error handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
