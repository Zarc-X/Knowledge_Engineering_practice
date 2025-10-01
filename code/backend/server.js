require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 根据环境配置CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:8000',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// 中间件
// app.use(cors()); // 允许前端4200端口访问后端3000端口
// 更详细的CORS配置
app.use(cors({
    origin: 'http://localhost:8000', // 您的前端地址
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json()); // 解析JSON请求体

app.use('/api', routes);

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('未捕获的错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : '未知错误'
    });
});

app.listen(PORT, () => {
    console.log(`后端服务器已启动在 http://localhost:${PORT}`);
});