import pool from '../../config/db';
import { RowDataPacket } from 'mysql2';

export const CashiersService = {
    async getAllCashiers() {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                kode_kasir,
                Nama,
                WaktuAktif,
                WaktuNonAktif
            FROM ventra_kasir
            ORDER BY kode_kasir`
        );

        return rows;
    },

    async getActiveCashiers() {
        const today = new Date().toISOString().split('T')[0];

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                kode_kasir,
                Nama,
                WaktuAktif,
                WaktuNonAktif
            FROM ventra_kasir
            WHERE ? BETWEEN WaktuAktif AND WaktuNonAktif
            ORDER BY kode_kasir`,
            [today]
        );

        return rows;
    },

    async getCashierByKode(kode: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                kode_kasir,
                Nama,
                WaktuAktif,
                WaktuNonAktif
            FROM ventra_kasir
            WHERE kode_kasir = ?
            LIMIT 1`,
            [kode]
        );

        if (rows.length === 0) return null;

        return rows[0];
    }
};
