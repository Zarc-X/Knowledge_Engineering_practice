const neo4j = require('./neo4j');
const { int } = require('./neo4j');
// const { read, write, int } = require('./neo4j'); // 从neo4j.js导入所需函数
const { v4: uuidv4 } = require('uuid'); // 用于生成唯一ID

/**
 * 节点服务类 - 处理所有节点相关的数据库操作
 */
class NodeService {
    /**
     * 获取所有节点（带极高上限）
     * @param {number} limit - 每页数量（前端控制）
     * @param {number} skip - 跳过数量
     * @returns {Promise<Array>} 节点列表
     */
    async getAllNodes(limit = 10000, skip = 0) {
        try {
            const actualLimit = limit;
            const actualSkip = skip;

            const safeLimit = Math.min(actualLimit, 10000);

            const query = `
            MATCH (n)
            RETURN n
            SKIP $skip
            LIMIT $limit
        `;

            const params = {
                skip: int(parseInt(actualSkip)),
                limit: int(parseInt(safeLimit))
            };

            console.log(`节点服务: skip=${actualSkip}, limit=${safeLimit} (传入limit=${limit})`);

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
            // 优化查询，只返回必要字段
            const query = `
        MATCH (n)
        WHERE n.id = $id
        RETURN 
            n.id as id,
            labels(n) as labels,
            properties(n) as properties
      `;

            const params = { id };
            const result = await neo4j.read(query, params);

            if (result.records.length === 0) {
                return null;
            }

            const record = result.records[0];
            return {
                id: record.get('id'),
                labels: record.get('labels'),
                properties: record.get('properties')
            };
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
    async getNodesByLabel(label, limit = 10000, skip = 0) {
        try {
            const query = `
        MATCH (n:${label})
        RETURN n
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
            const id = uuidv4();
            const nodeProperties = { ...properties, id };

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
            console.log(`删除节点服务: ID=${id}, 类型=${typeof id}`);

            // 使用与 getNodeById 相同的查询逻辑
            const query = `
            MATCH (n)
            WHERE n.id = $id OR ID(n) = $neo4jId
            DETACH DELETE n
        `;

            const params = {
                id: id,
                neo4jId: int(parseInt(id)) // 同时尝试作为Neo4j内部ID
            };

            console.log('删除节点参数:', params);

            const result = await neo4j.write(query, params);
            const deletedCount = result.summary.counters.updates().nodesDeleted;

            console.log(`删除节点结果: 删除了 ${deletedCount} 个节点`);

            return deletedCount > 0;
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
    async searchNodes(key, value, limit = 10000, skip = 0) {
        try {
            const query = `
        MATCH (n)
        WHERE n.${key} = $value
        RETURN n
        SKIP $skip
        LIMIT $limit
      `;

            // 确保参数是整数
            const params = {
                value,
                skip: int(parseInt(skip)),
                limit: int(parseInt(limit))
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
            neo4jId: node.identity.toString()
        };
    }
}

module.exports = new NodeService();