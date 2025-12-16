# Ventra API - Express.js

Backend API for Ventra application, migrated from PHP to Express.js with TypeScript.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL2 (connection pool)
- **Language**: TypeScript
- **Port**: 3001

## Structure

```
ventra_be/
├── src/
│   ├── config/          # Database configuration
│   ├── middleware/      # Error handling
│   ├── common/          # Async handler
│   ├── modules/         # API modules
│   │   └── products/    # Products endpoints
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry
├── public/
│   └── uploads/         # Static files
└── package.json
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## API Endpoints

### Products

- `GET /ventra/api/products?page=1&limit=20` - Get products list
- `GET /ventra/api/products/:kode` - Get product by code

### Static Files

- `/ventra/api/uploads/patterns/*` - Pattern images

## Environment Variables

Create `.env` file:

```env
PORT=3001
DB_HOST=localhost
DB_USER=neoe3718
DB_PASSWORD=your_password
DB_NAME=neoe3718_recode
DB_PORT=3306
BASE_URL=https://backend24.site/Rian/XI/recode/Ventra
```

## Migration Notes

- PHP persistent connections → MySQL2 connection pool
- BLOB images → base64 encoded
- Pattern file discovery → file system search
- Pagination maintained from PHP version
