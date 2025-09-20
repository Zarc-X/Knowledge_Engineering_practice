// routes/edges.js
const express = require('express');
const router = express.Router();
const edgeService = require('../services/edge.service');

/**
 * @route GET /api/edges
 * @desc 获取所有关系（支持分页和类型过滤）
 * @access Public
 */
router.get('/', async (req, res) => {
    try {
        const {
            limit = 100,
            skip = 0,
            type
        } = req.query;

        let edges;

        if (type) {
            // 如果提供了类型参数，按类型过滤
            edges = await edgeService.getEdgesByType(
                type,
                parseInt(limit),
                parseInt(skip)
            );
        } else {
            // 否则获取所有关系
            edges = await edgeService.getAllEdges(
                parseInt(limit),
                parseInt(skip)
            );
        }

        res.json({
            success: true,
            count: edges.length,
            data: edges
        });
    } catch (error) {
        console.error('获取关系列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取关系列表失败',
            error: error.message
        });
    }
});

/**
 * @route GET /api/edges/:id
 * @desc 根据ID获取特定关系
 * @access Public
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const edge = await edgeService.getEdgeById(id);

        if (!edge) {
            return res.status(404).json({
                success: false,
                message: '关系不存在'
            });
        }

        res.json({
            success: true,
            data: edge
        });
    } catch (error) {
        console.error('获取关系失败:', error);
        res.status(500).json({
            success: false,
            message: '获取关系失败',
            error: error.message
        });
    }
});

/**
 * @route POST /api/edges
 * @desc 创建新关系
 * @access Public
 */
router.post('/', async (req, res) => {
    try {
        const { startNodeId, endNodeId, type, properties } = req.body;

        // 验证必要参数
        if (!startNodeId || !endNodeId || !type) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数: startNodeId, endNodeId, type'
            });
        }

        const edge = await edgeService.createEdge(
            startNodeId,
            endNodeId,
            type,
            properties || {}
        );

        res.status(201).json({
            success: true,
            message: '关系创建成功',
            data: edge
        });
    } catch (error) {
        console.error('创建关系失败:', error);
        res.status(500).json({
            success: false,
            message: '创建关系失败',
            error: error.message
        });
    }
});

/**
 * @route PUT /api/edges/:id
 * @desc 更新关系属性
 * @access Public
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { properties } = req.body;

        // 验证必要参数
        if (!properties) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数: properties'
            });
        }

        const edge = await edgeService.updateEdge(id, properties);

        res.json({
            success: true,
            message: '关系更新成功',
            data: edge
        });
    } catch (error) {
        console.error('更新关系失败:', error);

        if (error.message === '关系不存在') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: '更新关系失败',
            error: error.message
        });
    }
});

/**
 * @route DELETE /api/edges/:id
 * @desc 删除关系
 * @access Public
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await edgeService.deleteEdge(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: '关系不存在'
            });
        }

        res.json({
            success: true,
            message: '关系删除成功'
        });
    } catch (error) {
        console.error('删除关系失败:', error);
        res.status(500).json({
            success: false,
            message: '删除关系失败',
            error: error.message
        });
    }
});

/**
 * @route GET /api/edges/type/:type
 * @desc 根据类型获取关系
 * @access Public
 */
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 100, skip = 0 } = req.query;

        const edges = await edgeService.getEdgesByType(
            type,
            parseInt(limit),
            parseInt(skip)
        );

        res.json({
            success: true,
            count: edges.length,
            data: edges
        });
    } catch (error) {
        console.error('按类型获取关系失败:', error);
        res.status(500).json({
            success: false,
            message: '按类型获取关系失败',
            error: error.message
        });
    }
});

/**
 * @route GET /api/edges/node/:nodeId
 * @desc 获取节点的所有关系
 * @access Public
 */
router.get('/node/:nodeId', async (req, res) => {
    try {
        const { nodeId } = req.params;
        const {
            direction = 'both',
            limit = 100,
            skip = 0
        } = req.query;

        // 验证方向参数
        const validDirections = ['incoming', 'outgoing', 'both'];
        if (!validDirections.includes(direction)) {
            return res.status(400).json({
                success: false,
                message: 'direction参数必须是: incoming, outgoing 或 both'
            });
        }

        const edges = await edgeService.getNodeEdges(
            nodeId,
            direction,
            parseInt(limit),
            parseInt(skip)
        );

        res.json({
            success: true,
            count: edges.length,
            data: edges
        });
    } catch (error) {
        console.error('获取节点关系失败:', error);
        res.status(500).json({
            success: false,
            message: '获取节点关系失败',
            error: error.message
        });
    }
});

module.exports = router;