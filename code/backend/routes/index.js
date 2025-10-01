const express = require('express');
const router = express.Router();

const nodesRouter = require('./nodes');
const edgesRouter = require('./edges');

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: '知识图谱管理信息系统 API 服务已启动',
        version: '1.0.0',
        endpoints: {
            nodes: '/api/nodes',
            edges: '/api/edges',
            documentation: '请查看API文档了解详细端点'
        },
        timestamp: new Date().toISOString()
    });
});

router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务运行正常',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

router.get('/api', (req, res) => {
    res.json({
        success: true,
        message: '知识图谱API',
        version: '1.0.0',
        endpoints: {
            nodes: {
                'GET /api/nodes': '获取所有节点',
                'GET /api/nodes/:id': '根据ID获取节点',
                'POST /api/nodes': '创建新节点',
                'PUT /api/nodes/:id': '更新节点',
                'DELETE /api/nodes/:id': '删除节点',
                'GET /api/nodes/search/:key/:value': '搜索节点',
                'GET /api/nodes/label/:label': '根据标签获取节点'
            },
            edges: {
                'GET /api/edges': '获取所有关系',
                'GET /api/edges/:id': '根据ID获取关系',
                'POST /api/edges': '创建新关系',
                'PUT /api/edges/:id': '更新关系',
                'DELETE /api/edges/:id': '删除关系',
                'GET /api/edges/type/:type': '根据类型获取关系',
                'GET /api/edges/node/:nodeId': '获取节点的所有关系'
            }
        }
    });
});

router.use('/nodes', nodesRouter);

router.use('/edges', edgesRouter);

router.get('*', (req, res) => {
    handle404(req, res);
});

router.post('*', (req, res) => {
    handle404(req, res);
});

router.put('*', (req, res) => {
    handle404(req, res);
});

router.delete('*', (req, res) => {
    handle404(req, res);
});

function handle404(req, res) {
    res.status(404).json({
        success: false,
        message: 'API端点不存在',
        requestedUrl: req.originalUrl,
        availableEndpoints: [
            '/api/nodes',
            '/api/edges',
            '/api/health',
            '/api'
        ]
    });
}

router.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : '未知错误'
    });
});

module.exports = router;