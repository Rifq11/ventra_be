import db from '../../config/drizzle';
import { ventraKasir } from '../../drizzle/schema';
import { eq, sql, and, gte, lte, asc } from 'drizzle-orm';

export const CashiersService = {
    async getAllCashiers() {
        const rows = await db
            .select({
                kode_kasir: ventraKasir.kodeKasir,
                Nama: ventraKasir.nama,
                WaktuAktif: ventraKasir.waktuAktif,
                WaktuNonAktif: ventraKasir.waktuNonAktif,
            })
            .from(ventraKasir)
            .orderBy(asc(ventraKasir.kodeKasir));

        return rows.map(row => ({
            Nama: row.Nama,
            WaktuAktif: row.WaktuAktif,
            WaktuNonAktif: row.WaktuNonAktif
        }));
    },

    async getActiveCashiers() {
        const today = new Date().toISOString().split('T')[0];

        const rows = await db
            .select({
                kode_kasir: ventraKasir.kodeKasir,
                Nama: ventraKasir.nama,
                WaktuAktif: ventraKasir.waktuAktif,
                WaktuNonAktif: ventraKasir.waktuNonAktif,
            })
            .from(ventraKasir)
            .where(
                sql`${sql.raw(`'${today}'`)} BETWEEN ${ventraKasir.waktuAktif} AND ${ventraKasir.waktuNonAktif}`
            )
            .orderBy(asc(ventraKasir.kodeKasir));

        return rows.map(row => ({
            Nama: row.Nama,
            WaktuAktif: row.WaktuAktif,
            WaktuNonAktif: row.WaktuNonAktif
        }));
    },

    async getCashierByKode(kode: number) {
        const rows = await db
            .select({
                kode_kasir: ventraKasir.kodeKasir,
                Nama: ventraKasir.nama,
                WaktuAktif: ventraKasir.waktuAktif,
                WaktuNonAktif: ventraKasir.waktuNonAktif,
            })
            .from(ventraKasir)
            .where(eq(ventraKasir.kodeKasir, kode))
            .limit(1);

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            Nama: row.Nama,
            WaktuAktif: row.WaktuAktif,
            WaktuNonAktif: row.WaktuNonAktif
        };
    }
};
