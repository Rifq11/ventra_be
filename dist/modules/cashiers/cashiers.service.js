"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashiersService = void 0;
const drizzle_1 = __importDefault(require("../../config/drizzle"));
const schema_1 = require("../../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
exports.CashiersService = {
    async getAllCashiers() {
        const rows = await drizzle_1.default
            .select({
            kode_kasir: schema_1.ventraKasir.kodeKasir,
            Nama: schema_1.ventraKasir.nama,
            WaktuAktif: schema_1.ventraKasir.waktuAktif,
            WaktuNonAktif: schema_1.ventraKasir.waktuNonAktif,
        })
            .from(schema_1.ventraKasir)
            .orderBy((0, drizzle_orm_1.asc)(schema_1.ventraKasir.kodeKasir));
        return rows.map(row => ({
            Nama: row.Nama,
            WaktuAktif: row.WaktuAktif,
            WaktuNonAktif: row.WaktuNonAktif
        }));
    },
    async getActiveCashiers() {
        const today = new Date().toISOString().split('T')[0];
        const rows = await drizzle_1.default
            .select({
            kode_kasir: schema_1.ventraKasir.kodeKasir,
            Nama: schema_1.ventraKasir.nama,
            WaktuAktif: schema_1.ventraKasir.waktuAktif,
            WaktuNonAktif: schema_1.ventraKasir.waktuNonAktif,
        })
            .from(schema_1.ventraKasir)
            .where((0, drizzle_orm_1.sql) `${drizzle_orm_1.sql.raw(`'${today}'`)} BETWEEN ${schema_1.ventraKasir.waktuAktif} AND ${schema_1.ventraKasir.waktuNonAktif}`)
            .orderBy((0, drizzle_orm_1.asc)(schema_1.ventraKasir.kodeKasir));
        return rows.map(row => ({
            Nama: row.Nama,
            WaktuAktif: row.WaktuAktif,
            WaktuNonAktif: row.WaktuNonAktif
        }));
    },
    async getCashierByKode(kode) {
        const rows = await drizzle_1.default
            .select({
            kode_kasir: schema_1.ventraKasir.kodeKasir,
            Nama: schema_1.ventraKasir.nama,
            WaktuAktif: schema_1.ventraKasir.waktuAktif,
            WaktuNonAktif: schema_1.ventraKasir.waktuNonAktif,
        })
            .from(schema_1.ventraKasir)
            .where((0, drizzle_orm_1.eq)(schema_1.ventraKasir.kodeKasir, kode))
            .limit(1);
        if (rows.length === 0)
            return null;
        const row = rows[0];
        return {
            Nama: row.Nama,
            WaktuAktif: row.WaktuAktif,
            WaktuNonAktif: row.WaktuNonAktif
        };
    }
};
