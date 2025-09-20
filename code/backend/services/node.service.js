// services/node.service.js
const neo4j = require('./neo4j');
const { v4: uuidv4 } = require('uuid'); // 用于生成唯一ID

/**
 * 节点服务类 - 处理所有节点相关的数据库操作
 */
class NodeService {
    /**
     * 获取所有节点（带分页）
     * @param {number} limit - 每页数量
     * @param {number} skip - 跳过数量
     * @returns {Promise<Array>} 节点列表
     */
    async getAllNodes(limit = 100, skip = 0) {
        try {
            const query = `
        MATCH (n)
        RETURN n
        SKIP $skip
        LIMIT $limit
      `;

            const params = { skip: neo4j.int(skip), limit: neo4j.int(limit) };
            const result = await neo4j.read(query, params);

            return result.records.map(record => {
                const node = record.get('n');
                return this.formatNode(node);
            });
        } catch (error) {
            console.error('获取所有节点失败:', error);
            throw error;
        }
    }

    /**
     * 根据ID获取特定节点
     * @param {string} id - 节点ID
     * @returns {Promise<Object|null>} 节点对象或null
     */
    async getNodeById(id) {
        try {
            const query = `
        MATCH (n {id: $id})
        RETURN n
      `;

            const params = { id };
            const result = await neo4j.read(query, params);

            if (result.records.length === 0) {
                return null;
            }

            const node = result.records[0].get('n');
            return this.formatNode(node);
        } catch (error) {
            console.error('根据ID获取节点失败:', error);
            throw error;
        }
    }

    /**
     * 根据标签获取节点
     * @param {string} label - 节点标签
     * @param {number} limit - 每页数量
     * @param {number} skip - 跳过数量
     * @returns {Promise<Array>} 节点列表
     */
    async getNodesByLabel(label, limit = 100, skip = 0) {
        try {
            const query = `
        MATCH (n:${label})
        RETURN n
        SKIP $skip
        LIMIT $limit
      `;

            const params = { skip: neo4j.int(skip), limit: neo4j.int(limit) };
            const result = await neo4j.read(query, params);

            return result.records.map(record => {
                const node = record.get('n');
                return this.formatNode(node);
            });
        } catch (error) {
            console.error('根据标签获取节点失败:', error);
            throw error;
        }
    }

    /**
     * 创建新节点
     * @param {Object} properties - 节点属性
     * @param {Array} labels - 节点标签
     * @returns {Promise<Object>} 创建的节点
     */
    async createNode(properties, labels = []) {
        try {
            // 生成唯一ID
            const id = uuidv4();
            const nodeProperties = { ...properties, id };

            // 构建标签部分
            const labelString = labels.length > 0
                ? `:${labels.join(':')}`
                : '';

            const query = `
        CREATE (n${labelString} $properties)
        RETURN n
      `;

            const params = { properties: nodeProperties };
            const result = await neo4j.write(query, params);

            if (result.records.length === 0) {
                throw new Error('创建节点失败');
            }

            const node = result.records[0].get('n');
            return this.formatNode(node);
        } catch (error) {
            console.error('创建节点失败:', error);
            throw error;
        }
    }

    /**
     * 更新节点属性
     * @param {string} id - 节点ID
     * @param {Object} properties - 要更新的属性
     * @returns {Promise<Object>} 更新后的节点
     */
    async updateNode(id, properties) {
        try {
            const query = `
        MATCH (n {id: $id})
        SET n += $properties
        RETURN n
      `;

            const params = { id, properties };
            const result = await neo4j.write(query, params);

            if (result.records.length === 0) {
                throw new Error('节点不存在');
            }

            const node = result.records[0].get('n');
            return this.formatNode(node);
        } catch (error) {
            console.error('更新节点失败:', error);
            throw error;
        }
    }

    /**
     * 删除节点
     * @param {string} id - 节点ID
     * @returns {Promise<boolean>} 是否成功删除
     */
    async deleteNode(id) {
        try {
            const query = `
        MATCH (n {id: $id})
        DETACH DELETE n
      `;

            const params = { id };
            const result = await neo4j.write(query, params);

            // 检查是否有节点被删除
            return result.summary.counters.updates().nodesDeleted > 0;
        } catch (error) {
            console.error('删除节点失败:', error);
            throw error;
        }
    }

    /**
     * 搜索节点（根据属性值）
     * @param {string} key - 属性键
     * @param {string} value - 属性值
     * @param {number} limit - 每页数量
     * @param {number} skip - 跳过数量
     * @returns {Promise<Array>} 匹配的节点列表
     */
    async searchNodes(key, value, limit = 100, skip = 0) {
        try {
            const query = `
        MATCH (n)
        WHERE n.${key} = $value
        RETURN n
        SKIP $skip
        LIMIT $limit
      `;

            const params = {
                value,
                skip: neo4j.int(skip),
                limit: neo4j.int(limit)
            };

            const result = await neo4j.read(query, params);

            return result.records.map(record => {
                const node = record.get('n');
                return this.formatNode(node);
            });
        } catch (error) {
            console.error('搜索节点失败:', error);
            throw error;
        }
    }

    /**
     * 格式化节点数据，转换为前端友好的JSON格式
     * @param {Object} node - Neo4j节点对象
     * @returns {Object} 格式化后的节点
     */
    formatNode(node) {
        return {
            id: node.properties.id || node.identity.toString(),
            labels: node.labels,
            properties: node.properties,
            // 如果需要，可以添加Neo4j内部ID
            neo4jId: node.identity.toString()
        };
    }
}

// 导出单例实例
module.exports = new NodeService();