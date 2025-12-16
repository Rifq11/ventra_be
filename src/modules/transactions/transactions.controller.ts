import { Request, Response } from 'express';
import { TransactionsService } from './transactions.service';

export const TransactionsController = {
    async getTransactions(req: Request, res: Response) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const transactions = await TransactionsService.getTransactions(
            page,
            limit
        );

        res.json({
            success: true,
            data: transactions,
            pagination: {
                page,
                limit
            }
        });
    },

    // PHP-style GET /transactions/:id
    async getTransactionById(req: Request, res: Response) {
        const id = parseInt(req.params.id, 10);

        if (!id || id <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'ID transaksi tidak valid'
            });
        }

        const rows = await TransactionsService.getTransactionById(id);

        if (!rows) {
            return res.json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        res.json(rows);
    },

    // PHP-style GET /transactions/latest
    async getLatestTransaction(req: Request, res: Response) {
        const rows = await TransactionsService.getLatestTransaction();
        res.json(rows);
    },

    // PHP-style POST /transactions
    async createTransaction(req: Request, res: Response) {
        const body = req.body;

        if (!body || !body.total || !body.payment || !body.detail || !body.kasir) {
            return res.status(400).json({
                status: 'error',
                message: 'Data kosong atau tidak lengkap'
            });
        }

        const result = await TransactionsService.createTransaction({
            total: Number(body.total),
            payment: String(body.payment),
            detail: body.detail,
            kasir: String(body.kasir),
            uang_dibayar: body.uang_dibayar
                ? Number(body.uang_dibayar)
                : undefined,
            no_rek:
                body.no_rek !== undefined && body.no_rek !== null
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

    // PHP-style POST /transactions/delete-latest
    async deleteLatest(req: Request, res: Response) {
        const result = await TransactionsService.deleteLatestTransaction();

        if (result.error) {
            return res.json({
                status: 'error',
                message: result.message
            });
        }

        res.json({
            status: 'success',
            message:
                'Transaksi terakhir berhasil dihapus dan stok dikembalikan',
            data: {
                transaction_id: result.transaction_id,
                restored_items: result.restored_items
            }
        });
    }
};

