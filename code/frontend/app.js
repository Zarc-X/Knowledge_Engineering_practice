class KnowledgeGraphApp {
    constructor() {
        console.log("KnowledgeGraphApp 初始化开始");
        this.api = new ApiService();
        this.graphRenderer = new GraphRenderer('graph');
        this.currentData = {
            nodes: [],
            edges: []
        };

        this.init();
        console.log("KnowledgeGraphApp 初始化完成");
    }

    init() {
        console.log("开始初始化事件绑定和数据加载");
        this.bindEvents();
        this.loadData();
        console.log("初始化完成");
    }

    bindEvents() {
        // 使用事件委托或确保DOM完全加载后再绑定事件
        const bindEventWhenReady = (selector, event, handler) => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener(event, handler);
                console.log(`成功绑定事件: ${selector}`);
            } else {
                console.error(`元素未找到: ${selector}`);
                // 延迟重试
                setTimeout(() => {
                    const retryElement = document.querySelector(selector);
                    if (retryElement) {
                        retryElement.addEventListener(event, handler);
                        console.log(`延迟绑定成功: ${selector}`);
                    }
                }, 100);
            }
        };

        // 刷新按钮
        bindEventWhenReady('#refresh-btn', 'click', () => {
            this.loadData();
        });

        // 添加节点按钮
        bindEventWhenReady('#add-node-btn', 'click', () => {
            this.showNodeForm();
        });

        // 添加关系按钮
        bindEventWhenReady('#add-edge-btn', 'click', () => {
            this.showEdgeForm();
        });

        // 搜索功能
        bindEventWhenReady('#search-btn', 'click', () => {
            this.handleSearch();
        });

        // 调试按钮
        bindEventWhenReady('#debug-btn', 'click', () => {
            this.debugInfo();
        });

        // 关闭模态框
        bindEventWhenReady('.close', 'click', () => {
            this.hideModal();
        });

        // 点击模态框外部关闭
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('modal');
            if (event.target === modal) {
                this.hideModal();
            }
        });

        console.log("所有事件绑定完成");
    }

    async loadData() {
        try {
            console.log("开始加载数据...");

            // 同时获取节点和关系
            const [nodesResponse, edgesResponse] = await Promise.all([
                this.api.getNodes(),
                this.api.getEdges()
            ]);

            console.log("节点响应:", nodesResponse);
            console.log("关系响应:", edgesResponse);

            // 确保数据存在
            this.currentData.nodes = nodesResponse.data || [];
            this.currentData.edges = edgesResponse.data || [];

            // 打印所有节点ID以供调试
            console.log("所有节点ID:", this.currentData.nodes.map(n => n.id));
            console.log("所有关系ID:", this.currentData.edges.map(e => e.id));

            this.renderSidebarLists();
            this.graphRenderer.render(this.currentData);

            console.log("数据加载完成");
        } catch (error) {
            console.error('加载数据失败:', error);
            alert('加载数据失败: ' + error.message);
        }
    }

    debugInfo() {
        console.log("=== 调试信息开始 ===");
        console.log("当前数据:", this.currentData);
        console.log("节点数量:", this.currentData.nodes.length);
        console.log("关系数量:", this.currentData.edges.length);

        // 检查API服务状态
        console.log("API基础URL:", this.api.baseUrl);

        // 测试API连接 - 使用更简单的方式
        console.log("测试API连接...");

        // 直接测试API端点
        fetch(`${this.api.baseUrl}/nodes?limit=1`)
            .then(response => {
                console.log("API响应状态:", response.status, response.statusText);
                return response.json();
            })
            .then(data => {
                console.log("API测试成功:", data);
            })
            .catch(error => {
                console.error("API测试失败:", error);
            });

        // 检查图谱渲染器状态
        console.log("图谱容器:", this.graphRenderer.containerId);
        console.log("图谱实例:", this.graphRenderer.graph ? "已初始化" : "未初始化");

        // 检查所有按钮状态
        const buttons = ['refresh-btn', 'add-node-btn', 'add-edge-btn', 'debug-btn', 'search-btn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            console.log(`按钮 ${btnId}:`, btn ? "存在" : "不存在");
        });

        console.log("=== 调试信息结束 ===");

        // 显示简单提示
        alert("调试信息已输出到控制台，请按F12查看");
    }

    isValidId(id) {
        return id && typeof id === 'string' && id.length > 0;
    }

    // 修改 renderSidebarLists 方法中的节点点击处理
    renderSidebarLists() {
        // 渲染节点列表
        const nodesContainer = document.getElementById('nodes-container');
        nodesContainer.innerHTML = '';

        this.currentData.nodes.forEach(node => {
            const li = document.createElement('li');
            // 使用更安全的显示方式
            const displayName = node.properties && node.properties.name
                ? node.properties.name
                : `节点 ${node.id ? node.id.substring(0, 8) : '未知'}`;

            li.textContent = displayName;
            li.dataset.id = node.id;
            li.addEventListener('click', () => {
                console.log("点击节点，ID:", node.id);
                this.showNodeDetail(node.id);
            });
            nodesContainer.appendChild(li);
        });

        // 渲染关系列表
        const edgesContainer = document.getElementById('edges-container');
        edgesContainer.innerHTML = '';

        this.currentData.edges.forEach(edge => {
            const li = document.createElement('li');
            const startName = edge.startNode && edge.startNode.properties && edge.startNode.properties.name
                ? edge.startNode.properties.name
                : (edge.startNodeId || '未知');
            const endName = edge.endNode && edge.endNode.properties && edge.endNode.properties.name
                ? edge.endNode.properties.name
                : (edge.endNodeId || '未知');

            li.textContent = `${edge.type || '关系'}: ${startName} → ${endName}`;
            li.dataset.id = edge.id;
            li.addEventListener('click', () => {
                console.log("点击关系，ID:", edge.id);
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
        try {
            const name = document.getElementById('node-name').value;
            const labels = document.getElementById('node-labels').value.split(',').map(l => l.trim()).filter(l => l);
            const propertiesText = document.getElementById('node-properties').value || '{}';

            // 安全地解析JSON
            let properties;
            try {
                properties = JSON.parse(propertiesText);
            } catch (e) {
                throw new Error('属性JSON格式不正确');
            }

            properties.name = name; // 确保名称属性

            if (existingNode) {
                console.log("更新节点:", existingNode.id, properties);
                await this.api.updateNode(existingNode.id, properties);
            } else {
                console.log("创建节点:", properties, labels);
                await this.api.createNode({ properties, labels });
            }

            this.hideModal();
            this.loadData(); // 刷新数据
        } catch (error) {
            console.error('保存节点失败:', error);
            alert('保存节点失败: ' + error.message);
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
        try {
            const startNodeId = document.getElementById('edge-start').value;
            const endNodeId = document.getElementById('edge-end').value;
            const type = document.getElementById('edge-type').value;
            const propertiesText = document.getElementById('edge-properties').value || '{}';

            // 安全地解析JSON
            let properties;
            try {
                properties = JSON.parse(propertiesText);
            } catch (e) {
                throw new Error('属性JSON格式不正确');
            }

            if (existingEdge) {
                console.log("更新关系:", existingEdge.id, properties);
                await this.api.updateEdge(existingEdge.id, properties);
            } else {
                console.log("创建关系:", startNodeId, endNodeId, type, properties);
                await this.api.createEdge({ startNodeId, endNodeId, type, properties });
            }

            this.hideModal();
            this.loadData(); // 刷新数据
        } catch (error) {
            console.error('保存关系失败:', error);
            alert('保存关系失败: ' + error.message);
        }
    }

    async showNodeDetail(nodeId) {
        if (!this.isValidId(nodeId)) {
            alert('无效的节点ID');
            return;
        }

        try {
            console.log("显示节点详情，ID:", nodeId);

            // 首先检查节点是否在当前数据中
            const nodeInCurrentData = this.currentData.nodes.find(n => n.id === nodeId);
            if (!nodeInCurrentData) {
                console.warn("节点不在当前数据中，尝试从API获取");
            }

            const response = await this.api.getNode(nodeId);

            if (!response.success) {
                throw new Error(response.message || "获取节点详情失败");
            }

            const node = response.data;

            if (!node) {
                throw new Error("节点数据为空");
            }

            const detailHtml = `
            <h2>节点详情</h2>
            <p><strong>ID:</strong> ${node.id}</p>
            <p><strong>标签:</strong> ${node.labels ? node.labels.join(', ') : '无'}</p>
            <p><strong>属性:</strong></p>
            <pre>${JSON.stringify(node.properties || {}, null, 2)}</pre>
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
            alert('获取节点详情失败: ' + error.message);

            // 显示错误详情
            const errorHtml = `
            <h2>错误</h2>
            <p>获取节点详情失败</p>
            <p><strong>错误信息:</strong> ${error.message}</p>
            <p><strong>节点ID:</strong> ${nodeId}</p>
        `;
            this.showModal(errorHtml);
        }
    }

    async showEdgeDetail(edgeId) {
        if (!this.isValidId(edgeId)) {
            alert('无效的关系ID');
            return;
        }

        try {
            console.log("显示关系详情，ID:", edgeId);

            const response = await this.api.getEdge(edgeId);

            if (!response.success) {
                throw new Error(response.message || "获取关系详情失败");
            }

            const edge = response.data;

            if (!edge) {
                throw new Error("关系数据为空");
            }

            const startName = edge.startNode && edge.startNode.properties && edge.startNode.properties.name
                ? edge.startNode.properties.name
                : (edge.startNodeId || '未知');
            const endName = edge.endNode && edge.endNode.properties && edge.endNode.properties.name
                ? edge.endNode.properties.name
                : (edge.endNodeId || '未知');

            const detailHtml = `
            <h2>关系详情</h2>
            <p><strong>ID:</strong> ${edge.id}</p>
            <p><strong>类型:</strong> ${edge.type || '未知'}</p>
            <p><strong>起始节点:</strong> ${startName} (ID: ${edge.startNode ? edge.startNode.id : edge.startNodeId})</p>
            <p><strong>目标节点:</strong> ${endName} (ID: ${edge.endNode ? edge.endNode.id : edge.endNodeId})</p>
            <p><strong>属性:</strong></p>
            <pre>${JSON.stringify(edge.properties || {}, null, 2)}</pre>
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
            alert('获取关系详情失败: ' + error.message);

            // 显示错误详情
            const errorHtml = `
            <h2>错误</h2>
            <p>获取关系详情失败</p>
            <p><strong>错误信息:</strong> ${error.message}</p>
            <p><strong>关系ID:</strong> ${edgeId}</p>
        `;
            this.showModal(errorHtml);
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

// 在文件末尾添加
// 全局错误处理
window.addEventListener('error', function (e) {
    console.error('全局错误:', e.error);
});

// 捕获未处理的Promise拒绝
window.addEventListener('unhandledrejection', function (e) {
    console.error('未处理的Promise拒绝:', e.reason);
});