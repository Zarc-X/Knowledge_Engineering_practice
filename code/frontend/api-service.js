class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // 节点相关API
    async getNodes(limit = 100, skip = 0, label = null) {
        const params = new URLSearchParams({ limit, skip });
        if (label) params.append('label', label);

        return this.request(`/nodes?${params}`);
    }

    async getNode(id) {
        return this.request(`/nodes/${id}`);
    }

    async createNode(nodeData) {
        return this.request('/nodes', {
            method: 'POST',
            body: JSON.stringify(nodeData)
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
        return this.request(`/edges/${id}`);
    }

    async createEdge(edgeData) {
        return this.request('/edges', {
            method: 'POST',
            body: JSON.stringify(edgeData)
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