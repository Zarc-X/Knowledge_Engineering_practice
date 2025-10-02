const neo4j = require('./neo4j');
const { int } = require('./neo4j');
// const { read, write, int } = require('./neo4j'); // 从neo4j.js导入所需函数
const { v4: uuidv4 } = require('uuid'); // 用于生成唯一ID

/**
 * 边服务类 - 处理所有关系（边）相关的数据库操作
 */
class EdgeService {
    /**
     * 获取所有关系（带分页）
     * @param {number} limit - 每页数量
     * @param {number} skip - 跳过数量
     * @returns {Promise<Array>} 关系列表
     */
    /**
     * 获取所有关系（带极高上限）
     * @param {number} limit - 每页数量（前端控制）
     * @param {number} skip - 跳过数量
     * @returns {Promise<Array>} 关系列表
     */
    async getAllEdges(limit = 10000, skip = 0) {
        try {
            // 强制使用传入的参数
            const actualLimit = limit;
            const actualSkip = skip;

            // 设置安全上限
            const safeLimit = Math.min(actualLimit, 10000);

            const query = `
            MATCH ()-[r]->()
            RETURN r, startNode(r) as start, endNode(r) as end
            SKIP $skip
            LIMIT $limit
        `;

            const params = {
                skip: int(parseInt(actualSkip)),
                limit: int(parseInt(safeLimit))
            };

            console.log(`边服务: skip=${actualSkip}, limit=${safeLimit} (传入limit=${limit})`);

            const result = await neo4j.read(query, params);

            return result.records.map(record => {
                const relationship = record.get('r');
                const startNode = record.get('start');
                const endNode = record.get('end');
                return this.formatEdge(relationship, startNode, endNode);
            });
        } catch (error) {
            console.error('获取所有关系失败:', error);
            throw error;
        }
    }

    /**
     * 根据ID获取特定关系
     * @param {string} id - 关系ID
     * @returns {Promise<Object|null>} 关系对象或null
     */
    async getEdgeById(id) {
        try {
            console.log(`边服务: 根据ID获取关系, ID: ${id}`);

            // 只查询必要的关系信息，不返回完整节点数据
            let query = `
        MATCH (start)-[r]->(end)
        WHERE r.id = $id
        RETURN 
            r.id as id,
            type(r) as type,
            properties(r) as properties,
            start.id as startNodeId,
            end.id as endNodeId,
            labels(start) as startLabels,
            labels(end) as endLabels
        `;

            const params = { id };

            const result = await neo4j.read(query, params);

            if (result.records.length === 0) {
                console.log(`未找到关系，ID: ${id}`);
                return null;
            }

            const record = result.records[0];
            return {
                id: record.get('id'),
                type: record.get('type'),
                properties: record.get('properties'),
                startNode: {
                    id: record.get('startNodeId'),
                    labels: record.get('startLabels')
                },
                endNode: {
                    id: record.get('endNodeId'),
                    labels: record.get('endLabels')
                }
            };
        } catch (error) {
            console.error('根据ID获取关系失败:', error);
            throw error;
        }
    }

    /**
     * 根据类型获取关系
     * @param {string} type - 关系类型
     * @param {number} limit - 每页数量
     * @param {number} skip - 跳过数量
     * @returns {Promise<Array>} 关系列表
     */
    async getEdgesByType(type, limit = 10000, skip = 0) {
        try {
            const query = `
        MATCH ()-[r:${type}]->()
        RETURN r, startNode(r) as start, endNode(r) as end
        SKIP $skip
        LIMIT $limit
      `;

            // 确保参数是整数
            const params = {
                skip: int(parseInt(skip)),
                limit: int(parseInt(limit))
            };
            const result = await neo4j.read(query, params);

            return result.records.map(record => {
                const relationship = record.get('r');
                const startNode = record.get('start');
                const endNode = record.get('end');
                return this.formatEdge(relationship, startNode, endNode);
            });
        } catch (error) {
            console.error('根据类型获取关系失败:', error);
            throw error;
        }
    }

    /**
     * 创建新关系
     * @param {string} startNodeId - 起始节点ID
     * @param {string} endNodeId - 目标节点ID
     * @param {string} type - 关系类型
     * @param {Object} properties - 关系属性
     * @returns {Promise<Object>} 创建的关系
     */
    async createEdge(startNodeId, endNodeId, type, properties = {}) {
        try {
            const id = uuidv4();
            const edgeProperties = { ...properties, id };

            const query = `
        MATCH (a {id: $startNodeId}), (b {id: $endNodeId})
        CREATE (a)-[r:${type} $properties]->(b)
        RETURN r, a as start, b as end
      `;

            const params = {
                startNodeId,
                endNodeId,
                properties: edgeProperties
            };

            const result = await neo4j.write(query, params);

            if (result.records.length === 0) {
                throw new Error('创建关系失败，请检查节点ID是否正确');
            }

            const record = result.records[0];
            const relationship = record.get('r');
            const startNode = record.get('start');
            const endNode = record.get('end');

            return this.formatEdge(relationship, startNode, endNode);
        } catch (error) {
            console.error('创建关系失败:', error);
            throw error;
        }
    }

    /**
     * 更新关系属性
     * @param {string} id - 关系ID
     * @param {Object} properties - 要更新的属性
     * @returns {Promise<Object>} 更新后的关系
     */
    async updateEdge(id, properties) {
        try {
            const query = `
        MATCH ()-[r {id: $id}]->()
        SET r += $properties
        RETURN r, startNode(r) as start, endNode(r) as end
      `;

            const params = { id, properties };
            const result = await neo4j.write(query, params);

            if (result.records.length === 0) {
                throw new Error('关系不存在');
            }

            const record = result.records[0];
            const relationship = record.get('r');
            const startNode = record.get('start');
            const endNode = record.get('end');

            return this.formatEdge(relationship, startNode, endNode);
        } catch (error) {
            console.error('更新关系失败:', error);
            throw error;
        }
    }

    /**
     * 删除关系
     * @param {string} id - 关系ID
     * @returns {Promise<boolean>} 是否成功删除
     */
    // 在 edge.service.js 中修改 deleteEdge 方法
    async deleteEdge(id) {
        try {
            console.log(`删除关系服务: ID=${id}, 类型=${typeof id}`);

            // 使用更灵活的查询，同时支持字符串ID和Neo4j内部ID
            const query = `
        MATCH ()-[r]->()
        WHERE r.id = $id OR ID(r) = $neo4jId
        DELETE r
        RETURN r
        `;

            const params = {
                id: id,
                neo4jId: int(parseInt(id)) // 同时尝试作为Neo4j内部ID
            };

            console.log('删除关系参数:', params);

            const result = await neo4j.write(query, params);
            const deletedCount = result.summary.counters.updates().relationshipsDeleted;

            console.log(`删除关系结果: 删除了 ${deletedCount} 个关系`);

            return deletedCount > 0;
        } catch (error) {
            console.error('删除关系失败:', error);
            throw error;
        }
    }

    /**
     * 获取节点的所有关系
     * @param {string} nodeId - 节点ID
     * @param {string} direction - 关系方向: 'incoming', 'outgoing', 'both' (默认)
     * @param {number} limit - 每页数量
     * @param {number} skip - 跳过数量
     * @returns {Promise<Array>} 关系列表
     */
    async getNodeEdges(nodeId, direction = 'both', limit = 10000, skip = 0) {
        try {
            let pattern;

            switch (direction) {
                case 'incoming':
                    pattern = '()-[r]->(n)';
                    break;
                case 'outgoing':
                    pattern = '(n)-[r]->()';
                    break;
                default: // both
                    pattern = '(n)-[r]-()';
            }

            const query = `
        MATCH ${pattern}
        WHERE n.id = $nodeId
        RETURN r, startNode(r) as start, endNode(r) as end
        SKIP $skip
        LIMIT $limit
      `;

            // 确保参数是整数
            const params = {
                nodeId,
                skip: int(parseInt(skip)),
                limit: int(parseInt(limit))
            };


            const result = await neo4j.read(query, params);

            return result.records.map(record => {
                const relationship = record.get('r');
                const startNode = record.get('start');
                const endNode = record.get('end');
                return this.formatEdge(relationship, startNode, endNode);
            });
        } catch (error) {
            console.error('获取节点关系失败:', error);
            throw error;
        }
    }

    /**
     * 格式化关系数据，转换为前端友好的JSON格式
     * @param {Object} relationship - Neo4j关系对象
     * @param {Object} startNode - 起始节点
     * @param {Object} endNode - 目标节点
     * @returns {Object} 格式化后的关系
     */
    formatEdge(relationship, startNode, endNode) {
        return {
            id: relationship.properties.id || relationship.identity.toString(),
            type: relationship.type,
            properties: relationship.properties,
            startNode: {
                id: startNode.properties.id || startNode.identity.toString(),
                labels: startNode.labels,
                properties: startNode.properties
            },
            endNode: {
                id: endNode.properties.id || endNode.identity.toString(),
                labels: endNode.labels,
                properties: endNode.properties
            },
            neo4jId: relationship.identity.toString()
        };
    }
}

module.exports = new EdgeService();