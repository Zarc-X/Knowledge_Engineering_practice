class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            // 确保请求体是JSON字符串
            if (options.body && typeof options.body !== 'string') {
                options.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return response.json();
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 节点相关API
    async getNodes(limit = 100, skip = 0, label = null) {
        const params = new URLSearchParams({ limit, skip });
        if (label) params.append('label', label);

        return this.request(`/nodes?${params}`);
    }

    async getNode(id) {
        try {
            console.log("请求节点详情，ID:", id);
            const response = await this.request(`/nodes/${id}`);
            console.log("节点详情响应:", response);
            return response;
        } catch (error) {
            console.error("获取节点详情API错误:", error);
            throw error;
        }
    }

    // 修改创建节点方法
    async createNode(nodeData) {
        // 确保数据格式正确
        const requestData = {
            properties: nodeData.properties || {},
            labels: nodeData.labels || []
        };

        console.log("创建节点请求数据:", requestData);

        return this.request('/nodes', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }


    async updateNode(id, nodeData) {
        return this.request(`/nodes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(nodeData)
        });
    }

    async deleteNode(id) {
        return this.request(`/nodes/${id}`, {
            method: 'DELETE'
        });
    }

    // 关系相关API
    async getEdges(limit = 100, skip = 0, type = null) {
        const params = new URLSearchParams({ limit, skip });
        if (type) params.append('type', type);

        return this.request(`/edges?${params}`);
    }

    async getEdge(id) {
        try {
            console.log("请求关系详情，ID:", id);
            const response = await this.request(`/edges/${id}`);
            console.log("关系详情响应:", response);
            return response;
        } catch (error) {
            console.error("获取关系详情API错误:", error);
            throw error;
        }
    }

    // 修改创建关系方法
    async createEdge(edgeData) {
        // 确保数据格式正确
        const requestData = {
            startNodeId: edgeData.startNodeId,
            endNodeId: edgeData.endNodeId,
            type: edgeData.type,
            properties: edgeData.properties || {}
        };

        console.log("创建关系请求数据:", requestData);

        return this.request('/edges', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
    }

    async updateEdge(id, edgeData) {
        return this.request(`/edges/${id}`, {
            method: 'PUT',
            body: JSON.stringify(edgeData)
        });
    }

    async deleteEdge(id) {
        return this.request(`/edges/${id}`, {
            method: 'DELETE'
        });
    }

    // 搜索功能
    async searchNodes(key, value, limit = 100, skip = 0) {
        const params = new URLSearchParams({ limit, skip });
        return this.request(`/nodes/search/${key}/${value}?${params}`);
    }

    async getNodeEdges(nodeId, direction = 'both', limit = 100, skip = 0) {
        const params = new URLSearchParams({ direction, limit, skip });
        return this.request(`/edges/node/${nodeId}?${params}`);
    }
}