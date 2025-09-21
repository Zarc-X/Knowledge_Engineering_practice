class KnowledgeGraphApp {
    constructor() {
        this.api = new ApiService();
        this.graphRenderer = new GraphRenderer('graph');
        this.currentData = {
            nodes: [],
            edges: []
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
    }

    bindEvents() {
        // 刷新按钮
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadData();
        });

        // 添加节点按钮
        document.getElementById('add-node-btn').addEventListener('click', () => {
            this.showNodeForm();
        });

        // 添加关系按钮
        document.getElementById('add-edge-btn').addEventListener('click', () => {
            this.showEdgeForm();
        });

        // 搜索功能
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch();
        });

        // 关闭模态框
        document.querySelector('.close').addEventListener('click', () => {
            this.hideModal();
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('modal');
            if (event.target === modal) {
                this.hideModal();
            }
        });
    }

    async loadData() {
        try {
            // 同时获取节点和关系
            const [nodesResponse, edgesResponse] = await Promise.all([
                this.api.getNodes(),
                this.api.getEdges()
            ]);

            this.currentData.nodes = nodesResponse.data;
            this.currentData.edges = edgesResponse.data;

            this.renderSidebarLists();
            this.graphRenderer.render(this.currentData);
        } catch (error) {
            console.error('加载数据失败:', error);
            alert('加载数据失败，请检查后端服务是否运行');
        }
    }

    renderSidebarLists() {
        // 渲染节点列表
        const nodesContainer = document.getElementById('nodes-container');
        nodesContainer.innerHTML = '';

        this.currentData.nodes.forEach(node => {
            const li = document.createElement('li');
            li.textContent = node.properties.name || `节点 ${node.id}`;
            li.dataset.id = node.id;
            li.addEventListener('click', () => {
                this.showNodeDetail(node.id);
            });
            nodesContainer.appendChild(li);
        });

        // 渲染关系列表
        const edgesContainer = document.getElementById('edges-container');
        edgesContainer.innerHTML = '';

        this.currentData.edges.forEach(edge => {
            const li = document.createElement('li');
            li.textContent = `${edge.type}: ${edge.startNode.properties.name} → ${edge.endNode.properties.name}`;
            li.dataset.id = edge.id;
            li.addEventListener('click', () => {
                this.showEdgeDetail(edge.id);
            });
            edgesContainer.appendChild(li);
        });
    }

    async handleSearch() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        try {
            // 简单搜索实现：搜索节点名称包含关键词的节点
            const response = await this.api.searchNodes('name', query);

            if (response.data.length > 0) {
                // 高亮显示搜索结果
                this.graphRenderer.highlightNodes(response.data.map(node => node.id));
            } else {
                alert('未找到匹配的节点');
            }
        } catch (error) {
            console.error('搜索失败:', error);
            alert('搜索失败');
        }
    }

    showNodeForm(node = null) {
        const isEdit = !!node;
        const title = isEdit ? '编辑节点' : '添加节点';

        const formHtml = `
            <h2>${title}</h2>
            <form id="node-form">
                <div class="form-group">
                    <label for="node-name">名称</label>
                    <input type="text" id="node-name" value="${node ? node.properties.name : ''}" required>
                </div>
                <div class="form-group">
                    <label for="node-labels">标签</label>
                    <input type="text" id="node-labels" value="${node ? node.labels.join(',') : ''}" placeholder="多个标签用逗号分隔">
                </div>
                <div class="form-group">
                    <label for="node-properties">属性 (JSON格式)</label>
                    <textarea id="node-properties" rows="5">${node ? JSON.stringify(node.properties, null, 2) : '{}'}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-node-btn">取消</button>
                    <button type="submit">${isEdit ? '更新' : '创建'}</button>
                </div>
            </form>
        `;

        this.showModal(formHtml);

        // 绑定表单提交事件
        document.getElementById('node-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNode(node);
        });

        document.getElementById('cancel-node-btn').addEventListener('click', () => {
            this.hideModal();
        });
    }

    async saveNode(existingNode) {
        const name = document.getElementById('node-name').value;
        const labels = document.getElementById('node-labels').value.split(',').map(l => l.trim()).filter(l => l);
        const properties = JSON.parse(document.getElementById('node-properties').value || '{}');

        properties.name = name; // 确保名称属性

        try {
            if (existingNode) {
                await this.api.updateNode(existingNode.id, properties);
            } else {
                await this.api.createNode(properties, labels);
            }

            this.hideModal();
            this.loadData(); // 刷新数据
        } catch (error) {
            console.error('保存节点失败:', error);
            alert('保存节点失败');
        }
    }

    showEdgeForm(edge = null) {
        const isEdit = !!edge;
        const title = isEdit ? '编辑关系' : '添加关系';

        const formHtml = `
            <h2>${title}</h2>
            <form id="edge-form">
                <div class="form-group">
                    <label for="edge-start">起始节点ID</label>
                    <input type="text" id="edge-start" value="${edge ? edge.startNode.id : ''}" required>
                </div>
                <div class="form-group">
                    <label for="edge-end">目标节点ID</label>
                    <input type="text" id="edge-end" value="${edge ? edge.endNode.id : ''}" required>
                </div>
                <div class="form-group">
                    <label for="edge-type">关系类型</label>
                    <input type="text" id="edge-type" value="${edge ? edge.type : ''}" required>
                </div>
                <div class="form-group">
                    <label for="edge-properties">属性 (JSON格式)</label>
                    <textarea id="edge-properties" rows="5">${edge ? JSON.stringify(edge.properties, null, 2) : '{}'}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-edge-btn">取消</button>
                    <button type="submit">${isEdit ? '更新' : '创建'}</button>
                </div>
            </form>
        `;

        this.showModal(formHtml);

        // 绑定表单提交事件
        document.getElementById('edge-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdge(edge);
        });

        document.getElementById('cancel-edge-btn').addEventListener('click', () => {
            this.hideModal();
        });
    }

    async saveEdge(existingEdge) {
        const startNodeId = document.getElementById('edge-start').value;
        const endNodeId = document.getElementById('edge-end').value;
        const type = document.getElementById('edge-type').value;
        const properties = JSON.parse(document.getElementById('edge-properties').value || '{}');

        try {
            if (existingEdge) {
                await this.api.updateEdge(existingEdge.id, properties);
            } else {
                await this.api.createEdge(startNodeId, endNodeId, type, properties);
            }

            this.hideModal();
            this.loadData(); // 刷新数据
        } catch (error) {
            console.error('保存关系失败:', error);
            alert('保存关系失败');
        }
    }

    async showNodeDetail(nodeId) {
        try {
            const response = await this.api.getNode(nodeId);
            const node = response.data;

            const detailHtml = `
                <h2>节点详情</h2>
                <p><strong>ID:</strong> ${node.id}</p>
                <p><strong>标签:</strong> ${node.labels.join(', ')}</p>
                <p><strong>属性:</strong></p>
                <pre>${JSON.stringify(node.properties, null, 2)}</pre>
                <div class="form-actions">
                    <button id="edit-node-btn">编辑</button>
                    <button id="delete-node-btn">删除</button>
                </div>
            `;

            this.showModal(detailHtml);

            document.getElementById('edit-node-btn').addEventListener('click', () => {
                this.hideModal();
                this.showNodeForm(node);
            });

            document.getElementById('delete-node-btn').addEventListener('click', () => {
                if (confirm('确定要删除这个节点吗？')) {
                    this.deleteNode(node.id);
                }
            });
        } catch (error) {
            console.error('获取节点详情失败:', error);
            alert('获取节点详情失败');
        }
    }

    async showEdgeDetail(edgeId) {
        try {
            const response = await this.api.getEdge(edgeId);
            const edge = response.data;

            const detailHtml = `
                <h2>关系详情</h2>
                <p><strong>ID:</strong> ${edge.id}</p>
                <p><strong>类型:</strong> ${edge.type}</p>
                <p><strong>起始节点:</strong> ${edge.startNode.properties.name || edge.startNode.id}</p>
                <p><strong>目标节点:</strong> ${edge.endNode.properties.name || edge.endNode.id}</p>
                <p><strong>属性:</strong></p>
                <pre>${JSON.stringify(edge.properties, null, 2)}</pre>
                <div class="form-actions">
                    <button id="edit-edge-btn">编辑</button>
                    <button id="delete-edge-btn">删除</button>
                </div>
            `;

            this.showModal(detailHtml);

            document.getElementById('edit-edge-btn').addEventListener('click', () => {
                this.hideModal();
                this.showEdgeForm(edge);
            });

            document.getElementById('delete-edge-btn').addEventListener('click', () => {
                if (confirm('确定要删除这个关系吗？')) {
                    this.deleteEdge(edge.id);
                }
            });
        } catch (error) {
            console.error('获取关系详情失败:', error);
            alert('获取关系详情失败');
        }
    }

    async deleteNode(nodeId) {
        try {
            await this.api.deleteNode(nodeId);
            this.hideModal();
            this.loadData(); // 刷新数据
        } catch (error) {
            console.error('删除节点失败:', error);
            alert('删除节点失败');
        }
    }

    async deleteEdge(edgeId) {
        try {
            await this.api.deleteEdge(edgeId);
            this.hideModal();
            this.loadData(); // 刷新数据
        } catch (error) {
            console.error('删除关系失败:', error);
            alert('删除关系失败');
        }
    }

    showModal(content) {
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').style.display = 'block';
    }

    hideModal() {
        document.getElementById('modal').style.display = 'none';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new KnowledgeGraphApp();
});