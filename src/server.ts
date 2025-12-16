import app from './app';
import './config/db';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Ventra API running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}/ventra/api`);
});
