import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL
const parseDatabaseUrl = (url: string) => {
    // Format: mysql://user:password@host:port/database
    const regex = /mysql:\/\/([^:@]+)(?::([^@]+))?@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('Invalid DATABASE_URL format');
    }

    return {
        user: match[1],
        password: match[2] || '',
        host: match[3],
        port: parseInt(match[4]),
        database: match[5]
    };
};

const dbConfig = process.env.DATABASE_URL
    ? parseDatabaseUrl(process.env.DATABASE_URL)
    : {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'neoe3718_recode',
        port: 3306
    };

export const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

export default pool;
