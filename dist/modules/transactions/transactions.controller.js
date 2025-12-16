"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const transactions_service_1 = require("./transactions.service");
exports.TransactionsController = {
    async getTransactions(req, res) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const transactions = await transactions_service_1.TransactionsService.getTransactions(page, limit);
        res.json({
            success: true,
            data: transactions,
            pagination: {
                page,
                limit
            }
        });
    },
    async getTransactionById(req, res) {
        const id = parseInt(req.params.id, 10);
        if (!id || id <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'ID transaksi tidak valid'
            });
        }
        const rows = await transactions_service_1.TransactionsService.getTransactionById(id);
        if (!rows) {
            return res.json({
                status: 'error',
                message: 'Transaction not found'
            });
        }
        res.json(rows);
    },
    async getLatestTransaction(req, res) {
        const rows = await transactions_service_1.TransactionsService.getLatestTransaction();
        res.json(rows);
    },
    async createTransaction(req, res) {
        const body = req.body;
        if (!body || !body.total || !body.payment || !body.detail || !body.kasir) {
            return res.status(400).json({
                status: 'error',
                message: 'Data kosong atau tidak lengkap'
            });
        }
        const result = await transactions_service_1.TransactionsService.createTransaction({
            total: Number(body.total),
            payment: String(body.payment),
            detail: body.detail,
            kasir: String(body.kasir),
            uang_dibayar: body.uang_dibayar
                ? Number(body.uang_dibayar)
                : undefined,
            no_rek: body.no_rek !== undefined && body.no_rek !== null
                ? String(body.no_rek)
                : null
        });
        res.json({
            status: 'success',
            message: 'Transaksi dan detail berhasil disimpan.',
            data: {
                id: result.id
            }
        });
    },
    async deleteLatest(req, res) {
        const result = await transactions_service_1.TransactionsService.deleteLatestTransaction();
        if (result.error) {
            return res.json({
                status: 'error',
                message: result.message
            });
        }
        res.json({
            status: 'success',
            message: 'Transaksi terakhir berhasil dihapus dan stok dikembalikan',
            data: {
                transaction_id: result.transaction_id,
                restored_items: result.restored_items
            }
        });
    }
};
