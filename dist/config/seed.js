"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const promise_1 = __importDefault(require("mysql2/promise"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function seedDatabase() {
    console.log('🌱 Starting Ventra database seed...');
    // Parse DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set in .env file');
    }
    const urlMatch = databaseUrl.match(/mysql:\/\/([^:@]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
        throw new Error('Invalid DATABASE_URL format');
    }
    const dbConfig = {
        host: urlMatch[3],
        user: urlMatch[1],
        password: urlMatch[2] || '',
        database: urlMatch[5],
        port: parseInt(urlMatch[4]),
        multipleStatements: true,
        // Increase timeout for large BLOB data
        connectTimeout: 60000,
    };
    let connection = await promise_1.default.createConnection(dbConfig);
    console.log('✅ Connected to database');
    // Helper function to reconnect if connection is closed
    const ensureConnection = async () => {
        try {
            await connection.ping();
            return connection;
        }
        catch (err) {
            console.log('🔄 Connection lost, reconnecting...');
            if (connection) {
                try {
                    await connection.end();
                }
                catch (e) { }
            }
            connection = await promise_1.default.createConnection(dbConfig);
            console.log('✅ Reconnected to database');
            return connection;
        }
    };
    // Helper function to execute query with retry
    const executeWithRetry = async (statement, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                connection = await ensureConnection();
                await connection.query(statement);
                return true;
            }
            catch (error) {
                const isConnectionError = error.code === 'ECONNRESET' ||
                    error.code === 'PROTOCOL_CONNECTION_LOST' ||
                    error.message?.includes('closed state') ||
                    error.message?.includes('Connection lost');
                if (isConnectionError && attempt < maxRetries) {
                    console.log(`   ⚠️  Connection error on attempt ${attempt}, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Wait before retry
                    continue;
                }
                throw error;
            }
        }
        return false;
    };
    try {
        // Pastikan kolom Gambar punya tipe yang cukup besar (LONGBLOB) untuk data dari dump asli
        // Drizzle push sebelumnya bisa saja membuat tipe yang lebih kecil (misal TEXT)
        try {
            await connection.query("ALTER TABLE ventra_produk MODIFY COLUMN Gambar LONGBLOB NULL");
            console.log('🔧 Ensured ventra_produk.Gambar is LONGBLOB');
        }
        catch (alterErr) {
            console.warn('⚠️  Could not alter ventra_produk.Gambar to LONGBLOB (might already be correct):', alterErr.message);
        }
        // Read SQL file
        const sqlFilePath = path.join(__dirname, '../../../Ventra/api/neoe3718_recode.sql');
        console.log(`📖 Reading SQL file: ${sqlFilePath}`);
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL file not found at: ${sqlFilePath}`);
        }
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
        // Extract ALL INSERT statements (for all tables, not only ventra_*)
        const insertStatements = [];
        const lines = sqlContent.split('\n');
        let currentStatement = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip comments and empty lines
            if (line.startsWith('--') || line.startsWith('/*') || !line) {
                continue;
            }
            // Check if this is an INSERT statement
            if (line.match(/^INSERT INTO /i)) {
                currentStatement = line;
                // Check if statement continues on next lines
                while (i + 1 < lines.length && !lines[i + 1].trim().match(/^INSERT INTO|^--|^\/\*/)) {
                    i++;
                    const nextLine = lines[i].trim();
                    if (nextLine && !nextLine.startsWith('--')) {
                        currentStatement += ' ' + nextLine;
                    }
                }
                // Remove trailing semicolon if exists
                currentStatement = currentStatement.replace(/;+$/, '');
                insertStatements.push(currentStatement);
                currentStatement = '';
            }
        }
        console.log(`📝 Found ${insertStatements.length} INSERT statements (all tables)`);
        // Clear existing data (in correct order to respect foreign keys)
        console.log('🗑️  Clearing existing data for seeded tables...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        // Core Ventra tables
        await connection.query('DELETE FROM ventra_detail_transaksi');
        await connection.query('DELETE FROM ventra_transaksi');
        await connection.query('DELETE FROM ventra_detail_event');
        await connection.query('DELETE FROM ventra_produk_detail');
        await connection.query('DELETE FROM ventra_produk');
        await connection.query('DELETE FROM ventra_event');
        await connection.query('DELETE FROM ventra_kasir');
        // Non-Ventra tables that also come from the dump
        await connection.query('DELETE FROM Absensi');
        await connection.query('DELETE FROM admin');
        await connection.query('DELETE FROM categories');
        await connection.query('DELETE FROM otp_codes');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Cleared existing data');
        // Reset AUTO_INCREMENT
        await connection.query('ALTER TABLE ventra_detail_transaksi AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE ventra_transaksi AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE ventra_detail_event AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE ventra_produk AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE ventra_event AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE Absensi AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE admin AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE categories AUTO_INCREMENT = 1');
        // Execute INSERT statements
        console.log('💾 Inserting data...');
        let successCount = 0;
        let errorCount = 0;
        // Helper to parse hex string to Buffer
        const hexToBuffer = (hexString) => {
            // Remove 0x prefix if present
            const hex = hexString.startsWith('0x') ? hexString.substring(2) : hexString;
            return Buffer.from(hex, 'hex');
        };
        // Helper to insert ventra_produk with BLOB using prepared statement
        const insertVentraProdukWithBlob = async (statement) => {
            try {
                connection = await ensureConnection();
                // Parse using string manipulation instead of regex for large hex strings
                // Format: INSERT INTO `ventra_produk` (`id`, `Nama_Brg`, `Bahan`, `harga_jual`, `Kategori`, `Gambar`) VALUES (id, 'nama', 'bahan', harga, kategori, 0x...hex...)
                const valuesIdx = statement.indexOf('VALUES');
                if (valuesIdx === -1)
                    return false;
                const openParen = statement.indexOf('(', valuesIdx);
                if (openParen === -1)
                    return false;
                // Find positions of commas to split values
                const parts = [];
                let currentPos = openParen + 1;
                let depth = 1;
                let inString = false;
                let stringChar = '';
                let currentPart = '';
                // Parse values manually to handle hex strings correctly
                for (let i = currentPos; i < statement.length && depth > 0; i++) {
                    const char = statement[i];
                    if (!inString && (char === '"' || char === "'")) {
                        inString = true;
                        stringChar = char;
                        currentPart += char;
                    }
                    else if (inString && char === stringChar && statement[i - 1] !== '\\') {
                        inString = false;
                        currentPart += char;
                    }
                    else if (!inString && char === '(') {
                        depth++;
                        currentPart += char;
                    }
                    else if (!inString && char === ')') {
                        depth--;
                        if (depth === 0) {
                            parts.push(currentPart.trim());
                            break;
                        }
                        currentPart += char;
                    }
                    else if (!inString && char === ',' && depth === 1) {
                        parts.push(currentPart.trim());
                        currentPart = '';
                    }
                    else {
                        currentPart += char;
                    }
                }
                if (parts.length < 6)
                    return false;
                const id = parseInt(parts[0]);
                const namaBrg = parts[1].replace(/^['"]|['"]$/g, '');
                const bahan = parts[2].replace(/^['"]|['"]$/g, '');
                const hargaJual = parseInt(parts[3]);
                const kategori = parseInt(parts[4]);
                const gambarHex = parts[5].trim();
                connection = await ensureConnection();
                // Convert hex to Buffer if not NULL
                const gambarBuffer = gambarHex === 'NULL' || !gambarHex || gambarHex.length < 3 ? null : hexToBuffer(gambarHex);
                // Use prepared statement with Buffer for BLOB
                await connection.execute('INSERT INTO ventra_produk (id, Nama_Brg, Bahan, harga_jual, Kategori, Gambar) VALUES (?, ?, ?, ?, ?, ?)', [id, namaBrg, bahan, hargaJual, kategori, gambarBuffer]);
                return true;
            }
            catch (error) {
                // If it's still a connection error, it's likely server limitation
                if (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
                    throw error; // Re-throw to be handled by outer catch
                }
                console.error(`   ⚠️  Prepared statement insert failed: ${error.message}`);
                return false;
            }
        };
        // Helper to split multi-row INSERT into individual row inserts
        const splitMultiRowInsert = (statement) => {
            // Match INSERT INTO `table` (...) VALUES (...), (...), ...
            const match = statement.match(/^(INSERT INTO `[^`]+` \(`[^)]+`\) VALUES\s*)(.+)$/i);
            if (!match)
                return [statement]; // Can't parse, return as-is
            const [fullMatch, insertPrefix, valuesPart] = match;
            // Check if this is a multi-row insert (has multiple ),( patterns)
            const rowMatches = valuesPart.match(/\([^)]+\)/g);
            if (!rowMatches || rowMatches.length <= 1) {
                return [statement]; // Single row or can't parse, return as-is
            }
            // Only split if statement is very long (likely to cause connection issues)
            // or if it contains large BLOB data (0x... hex strings)
            const isLargeStatement = statement.length > 50000 || statement.includes('0xffd8') || statement.includes('0x89504e47');
            if (!isLargeStatement) {
                return [statement]; // Not too large, execute as-is
            }
            // Split into individual row inserts
            console.log(`   📦 Splitting large statement into ${rowMatches.length} individual inserts...`);
            return rowMatches.map(row => `${insertPrefix}${row}`);
        };
        for (let i = 0; i < insertStatements.length; i++) {
            const statement = insertStatements[i];
            try {
                // For large statements, split into smaller chunks
                const statementsToExecute = splitMultiRowInsert(statement);
                for (const stmt of statementsToExecute) {
                    const success = await executeWithRetry(stmt, 3);
                    if (!success) {
                        throw new Error('Failed after retries');
                    }
                }
                successCount++;
                // Log progress every 10 statements
                if ((i + 1) % 10 === 0) {
                    console.log(`   Processed ${i + 1}/${insertStatements.length} statements...`);
                }
            }
            catch (error) {
                // For connection errors on large BLOB statements (ventra_produk), try using prepared statement with Buffer
                const isConnectionErrorOnBlob = (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) &&
                    statement.includes('ventra_produk') &&
                    statement.includes('Gambar') &&
                    (statement.includes('0xffd8') || statement.includes('0x89504e47') || statement.length > 50000);
                if (isConnectionErrorOnBlob) {
                    try {
                        console.log(`   🔧 Retrying statement ${i + 1} with prepared statement (Buffer) for BLOB...`);
                        const success = await insertVentraProdukWithBlob(statement);
                        if (success) {
                            successCount++;
                            continue; // Success, skip error handling
                        }
                    }
                    catch (blobError) {
                        // If prepared statement also fails, it's likely a server/connection limitation
                        console.warn(`   ⚠️  Statement ${i + 1} failed due to very large BLOB (server/connection limit).`);
                        console.warn(`   💡 Tip: You may need to increase max_allowed_packet in MySQL config or insert manually via phpMyAdmin.`);
                        errorCount++;
                        continue; // Skip error logging below
                    }
                    // If insertVentraProdukWithBlob returned false (parse error), fall through
                    console.warn(`   ⚠️  Could not parse statement ${i + 1} for prepared statement insert.`);
                    errorCount++;
                    continue; // Skip error logging below
                }
                errorCount++;
                console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
                // Only show first 200 chars to avoid flooding console with huge BLOB data
                const preview = statement.length > 200 ? statement.substring(0, 200) + '...' : statement;
                console.error(`   Statement preview: ${preview}`);
            }
        }
        console.log(`\n✅ Seed completed!`);
        console.log(`   Success: ${successCount} statements`);
        console.log(`   Errors: ${errorCount} statements`);
    }
    catch (error) {
        console.error('❌ Seed error:', error.message);
        throw error;
    }
    finally {
        try {
            if (connection) {
                await connection.end();
                console.log('🔌 Database connection closed');
            }
        }
        catch (err) {
            // Ignore errors when closing
        }
    }
}
// Run seed
seedDatabase()
    .then(() => {
    console.log('🎉 Seed process finished successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('💥 Seed process failed:', error);
    process.exit(1);
});
