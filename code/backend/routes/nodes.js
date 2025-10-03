const express = require('express');
const router = express.Router();
const nodeService = require('../services/node.service');

/**
 * @route GET /api/nodes
 * @desc 获取所有节点（支持分页和标签过滤）
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        const {
            limit = 10000,  // 修改默认值为10000
            skip = 0,
            label
        } = req.query;

        // 添加调试日志
        console.log(`节点路由接收参数: limit=${limit}, skip=${skip}, label=${label}`);

        let nodes;

        if (label) {
            // 如果提供了标签参数，按标签过滤
            nodes = await nodeService.getNodesByLabel(
                label,
                parseInt(limit),
                parseInt(skip)
            );
        } else {
            // 否则获取所有节点
            nodes = await nodeService.getAllNodes(
                parseInt(limit),
                parseInt(skip)
            );
        }

        res.json({
            success: true,
            count: nodes.length,
            data: nodes,
            meta: {
                limit: parseInt(limit),
                skip: parseInt(skip),
                total: nodes.length
            }
        });
    } catch (error) {
        console.error('获取节点列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取节点列表失败',
            error: error.message
        });
    }
});

/**
 * @route GET /api/nodes/:id
 * @desc 根据ID获取特定节点
 * @access Public
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const node = await nodeService.getNodeById(id);

        if (!node) {
            return res.status(404).json({
                success: false,
                message: '节点不存在'
            });
        }

        res.json({
            success: true,
            data: node
        });
    } catch (error) {
        console.error('获取节点失败:', error);
        res.status(500).json({
            success: false,
            message: '获取节点失败',
            error: error.message
        });
    }
});

/**
 * @route POST /api/nodes
 * @desc 创建新节点
 * @access Public
 */
router.post('/', async (req, res) => {
    try {
        const { properties, labels } = req.body;

        // 验证必要参数
        if (!properties) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数: properties'
            });
        }

        const node = await nodeService.createNode(properties, labels || []);

        res.status(201).json({
            success: true,
            message: '节点创建成功',
            data: node
        });
    } catch (error) {
        console.error('创建节点失败:', error);
        res.status(500).json({
            success: false,
            message: '创建节点失败',
            error: error.message
        });
    }
});

/**
 * @route PUT /api/nodes/:id
 * @desc 更新节点属性
 * @access Public
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { properties } = req.body;

        if (!properties) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数: properties'
            });
        }

        const node = await nodeService.updateNode(id, properties);

        res.json({
            success: true,
            message: '节点删除成功',
            deletedCount: 1 // 明确返回删除的数量
        });
    } catch (error) {
        console.error('更新节点失败:', error);

        if (error.message === '节点不存在') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: '更新节点失败',
            error: error.message
        });
    }
});

/**
 * @route DELETE /api/nodes/:id
 * @desc 删除节点
 * @access Public
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await nodeService.deleteNode(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: '节点不存在'
            });
        }

        res.json({
            success: true,
            message: '节点删除成功'
        });
    } catch (error) {
        console.error('删除节点失败:', error);
        res.status(500).json({
            success: false,
            message: '删除节点失败',
            error: error.message
        });
    }
});

/**
 * @route GET /api/nodes/search/:key/:value
 * @desc 根据属性键值搜索节点
 * @access Public
 */
router.get('/search/:key/:value', async (req, res) => {
    try {
        const { key, value } = req.params;
        const { limit = 10000, skip = 0 } = req.query;

        const nodes = await nodeService.searchNodes(
            key,
            value,
            parseInt(limit),
            parseInt(skip)
        );

        res.json({
            success: true,
            count: nodes.length,
            data: nodes
        });
    } catch (error) {
        console.error('搜索节点失败:', error);
        res.status(500).json({
            success: false,
            message: '搜索节点失败',
            error: error.message
        });
    }
});

/**
 * @route GET /api/nodes/label/:label
 * @desc 根据标签获取节点
 * @access Public
 */
router.get('/label/:label', async (req, res) => {
    try {
        const { label } = req.params;
        const { limit = 10000, skip = 0 } = req.query;

        const nodes = await nodeService.getNodesByLabel(
            label,
            parseInt(limit),
            parseInt(skip)
        );

        res.json({
            success: true,
            count: nodes.length,
            data: nodes
        });
    } catch (error) {
        console.error('按标签获取节点失败:', error);
        res.status(500).json({
            success: false,
            message: '按标签获取节点失败',
            error: error.message
        });
    }
});

module.exports = router;