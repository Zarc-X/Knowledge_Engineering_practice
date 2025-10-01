class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
    }


    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
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

            const result = await response.json();

            if (result && typeof result.success !== 'undefined') {
                return result;
            } else {
                return {
                    success: true,
                    data: result
                };
            }
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 节点相关API
    async getNodes(limit = 10000, skip = 0, label = null) {
        const params = new URLSearchParams({
            limit: limit.toString(),
            skip: skip.toString()
        });
        if (label) params.append('label', label);

        console.log("API请求节点，参数:", { limit, skip, label });
        console.log("请求URL:", `/nodes?${params}`);

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

    async createNode(nodeData) {
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
    async getEdges(limit = 10000, skip = 0, type = null) {
        const params = new URLSearchParams({
            limit: limit.toString(),
            skip: skip.toString()
        });
        if (type) params.append('type', type);

        console.log("API请求关系，参数:", { limit, skip, type });
        console.log("请求URL:", `/edges?${params}`);

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

    async createEdge(edgeData) {
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

    async searchNodes(key, value, limit = 10000, skip = 0) {
        const params = new URLSearchParams({ limit, skip });
        return this.request(`/nodes/search/${key}/${value}?${params}`);
    }

    async getNodeEdges(nodeId, direction = 'both', limit = 10000, skip = 0) {
        const params = new URLSearchParams({ direction, limit, skip });
        return this.request(`/edges/node/${nodeId}?${params}`);
    }
}