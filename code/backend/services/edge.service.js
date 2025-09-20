// services/edge.service.js
const neo4j = require('./neo4j');
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
    async getAllEdges(limit = 100, skip = 0) {
        try {
            const query = `
        MATCH ()-[r]->()
        RETURN r, startNode(r) as start, endNode(r) as end
        SKIP $skip
        LIMIT $limit
      `;

            const params = { skip: neo4j.int(skip), limit: neo4j.int(limit) };
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
            const query = `
        MATCH ()-[r {id: $id}]->()
        RETURN r, startNode(r) as start, endNode(r) as end
      `;

            const params = { id };
            const result = await neo4j.read(query, params);

            if (result.records.length === 0) {
                return null;
            }

            const record = result.records[0];
            const relationship = record.get('r');
            const startNode = record.get('start');
            const endNode = record.get('end');

            return this.formatEdge(relationship, startNode, endNode);
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
    async getEdgesByType(type, limit = 100, skip = 0) {
        try {
            const query = `
        MATCH ()-[r:${type}]->()
        RETURN r, startNode(r) as start, endNode(r) as end
        SKIP $skip
        LIMIT $limit
      `;

            const params = { skip: neo4j.int(skip), limit: neo4j.int(limit) };
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
            // 生成唯一ID
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
    async deleteEdge(id) {
        try {
            const query = `
        MATCH ()-[r {id: $id}]->()
        DELETE r
      `;

            const params = { id };
            const result = await neo4j.write(query, params);

            // 检查是否有关系被删除
            return result.summary.counters.updates().relationshipsDeleted > 0;
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
    async getNodeEdges(nodeId, direction = 'both', limit = 100, skip = 0) {
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

            const params = {
                nodeId,
                skip: neo4j.int(skip),
                limit: neo4j.int(limit)
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
            // 如果需要，可以添加Neo4j内部ID
            neo4jId: relationship.identity.toString()
        };
    }
}

// 导出单例实例
module.exports = new EdgeService();