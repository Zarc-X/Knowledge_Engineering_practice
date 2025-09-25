class KnowledgeGraphApp {
    constructor() {
        console.log("KnowledgeGraphApp 初始化开始");
        this.api = new ApiService();
        this.graphRenderer = new GraphRenderer('graph');
        this.currentData = {
            nodes: [],
            edges: []
        };

        // 添加配置项
        this.config = {
            maxNodes: 10000, // 默认最大显示50个节点
            maxEdges: 10000 // 可选：也可以控制最大关系数
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

        // 添加节点数控制事件绑定
        bindEventWhenReady('#debug-apply-limit', 'click', () => {
            const limitInput = document.getElementById('debug-node-limit');
            const maxNodes = parseInt(limitInput.value);
            if (!isNaN(maxNodes) && maxNodes > 0) {
                this.config.maxNodes = maxNodes;
                console.log(`手动设置最大节点数为: ${maxNodes}`);
                this.loadData();
            }
        });

        // 添加边数控制事件绑定 - 添加这行代码
        bindEventWhenReady('#debug-apply-edge-limit', 'click', () => {
            const limitInput = document.getElementById('debug-edge-limit');
            const maxEdges = parseInt(limitInput.value);
            if (!isNaN(maxEdges) && maxEdges > 0) {
                this.config.maxEdges = maxEdges;
                console.log(`手动设置最大边数为: ${maxEdges}`);
                this.loadData();
            }
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
            console.log("请求参数 - maxNodes:", this.config.maxNodes, "maxEdges:", this.config.maxEdges);

            // 使用配置的最大节点数
            const [nodesResponse, edgesResponse] = await Promise.all([
                this.api.getNodes(this.config.maxNodes),
                this.api.getEdges(this.config.maxEdges)
            ]);

            // 检查响应结构
            console.log("节点响应结构:", nodesResponse);
            console.log("关系响应结构:", edgesResponse);

            console.log("节点响应数据量:", nodesResponse.data ? nodesResponse.data.length : 0);
            console.log("关系响应数据量:", edgesResponse.data ? edgesResponse.data.length : 0);

            // 确保数据存在
            this.currentData.nodes = nodesResponse.data || [];
            this.currentData.edges = edgesResponse.data || [];

            // 诊断信息
            console.log("=== 数据诊断 ===");
            console.log("配置限制 - 节点:", this.config.maxNodes, "边:", this.config.maxEdges);
            console.log("实际获取 - 节点:", this.currentData.nodes.length, "边:", this.currentData.edges.length);

            if (this.currentData.nodes.length === this.config.maxNodes) {
                console.log("✅ 节点数量达到限制，后端限制生效");
            } else {
                console.log("⚠️ 节点数量未达到限制，可能原因:");
                console.log("   - 数据库中没有足够节点");
                console.log("   - 后端服务未正确处理limit参数");
                console.log("   - 网络请求参数错误");
            }

            // 如果返回的节点数超过限制，进行截断
            if (this.currentData.nodes.length > this.config.maxNodes) {
                console.warn(`节点数量超过限制，显示前 ${this.config.maxNodes} 个节点`);
                this.currentData.nodes = this.currentData.nodes.slice(0, this.config.maxNodes);
            }

            // 如果返回的边数超过限制，进行截断 - 添加这行代码
            if (this.currentData.edges.length > this.config.maxEdges) {
                console.warn(`边数量超过限制，显示前 ${this.config.maxEdges} 条边`);
                this.currentData.edges = this.currentData.edges.slice(0, this.config.maxEdges);
            }

            console.log("最终显示节点数量:", this.currentData.nodes.length);
            console.log("最终显示关系数量:", this.currentData.edges.length);

            this.renderSidebarLists();
            this.graphRenderer.render(this.currentData);

            console.log("数据加载完成");
        } catch (error) {
            console.error('加载数据失败:', error);
            alert('加载数据失败: ' + error.message);
        }
    }

    // 添加设置最大节点数的方法
    setMaxNodes(maxNodes) {
        if (maxNodes > 0 && maxNodes <= 10000) { // 设置合理范围
            this.config.maxNodes = maxNodes;
            console.log(`设置最大节点数为: ${maxNodes}`);
            this.loadData(); // 重新加载数据
        } else {
            alert('最大节点数必须在1-10000之间');
        }
    }

    // 添加设置最大边数的方法
    setMaxEdges(maxEdges) {
        if (maxEdges > 0 && maxEdges <= 10000) {
            this.config.maxEdges = maxEdges;
            console.log(`设置最大边数为: ${maxEdges}`);
            this.loadData();
        } else {
            alert('最大边数必须在1-10000之间');
        }
    }

    debugInfo() {
        console.log("=== 调试信息开始 ===");
        console.log("当前配置:", this.config);
        console.log("最大节点数:", this.config.maxNodes);
        console.log("最大边数:", this.config.maxEdges);

        // 检查API服务状态
        console.log("API基础URL:", this.api.baseUrl);

        // 测试API连接
        console.log("测试API连接...");

        // 直接测试API端点
        fetch(`${this.api.baseUrl}/nodes?limit=1`)
            .then(response => {
                console.log("API节点响应状态:", response.status, response.statusText);
                return response.json();
            })
            .then(data => {
                console.log("API节点测试成功:", data);
            })
            .catch(error => {
                console.error("API节点测试失败:", error);
            });

        // 测试边API端点
        fetch(`${this.api.baseUrl}/edges?limit=1`)
            .then(response => {
                console.log("API边响应状态:", response.status, response.statusText);
                return response.json();
            })
            .then(data => {
                console.log("API边测试成功:", data);
            })
            .catch(error => {
                console.error("API边测试失败:", error);
            });

        // 检查图谱渲染器状态
        console.log("图谱容器:", this.graphRenderer.containerId);
        console.log("图谱实例:", this.graphRenderer.graph ? "已初始化" : "未初始化");

        // 检查所有按钮状态
        const buttons = ['refresh-btn', 'add-node-btn', 'add-edge-btn', 'debug-btn', 'search-btn', 'debug-apply-limit', 'debug-apply-edge-limit'];
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

    renderSidebarLists() {
        const nodesContainer = document.getElementById('nodes-container');
        const edgesContainer = document.getElementById('edges-container');

        // 清空容器
        nodesContainer.innerHTML = '';
        edgesContainer.innerHTML = '';

        // 添加统计信息
        const statsHtml = `
        <div style="background: #f0f0f0; padding: 8px; margin-bottom: 10px; border-radius: 4px;">
            <strong>统计信息:</strong><br>
            节点: ${this.currentData.nodes.length}/${this.config.maxNodes}<br>
            关系: ${this.currentData.edges.length}/${this.config.maxEdges}
        </div>
    `;

        nodesContainer.innerHTML = statsHtml;

        // 渲染节点列表
        this.currentData.nodes.forEach(node => {
            const li = document.createElement('li');
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

            let result;
            if (existingNode) {
                console.log("更新节点:", existingNode.id, properties);
                result = await this.api.updateNode(existingNode.id, properties);
            } else {
                console.log("创建节点:", properties, labels);
                result = await this.api.createNode({ properties, labels });
            }

            // 检查API响应是否成功
            if (result && result.success) {
                this.showSuccessMessage(existingNode ? '节点更新成功！' : '节点创建成功！');
                this.hideModal();
                this.loadData(); // 刷新数据
            } else {
                throw new Error(result?.message || '操作失败，请检查服务器响应');
            }
        } catch (error) {
            console.error('保存节点失败:', error);
            this.showErrorMessage('保存节点失败: ' + error.message);
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

    // 显示成功消息
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // 显示错误消息
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // 显示消息（支持成功和错误类型）
    showMessage(message, type = 'info') {
        // 移除已存在的消息框
        const existingMessage = document.getElementById('operation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建消息元素
        const messageDiv = document.createElement('div');
        messageDiv.id = 'operation-message';
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
        <span>${message}</span>
        <button id="close-message-btn">&times;</button>
    `;

        // 添加到页面
        document.body.appendChild(messageDiv);

        // 添加关闭按钮事件
        document.getElementById('close-message-btn').addEventListener('click', () => {
            messageDiv.remove();
        });

        // 3秒后自动消失（仅对成功消息）
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 3000);
        }
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

            let result;
            if (existingEdge) {
                console.log("更新关系:", existingEdge.id, properties);
                result = await this.api.updateEdge(existingEdge.id, properties);
            } else {
                console.log("创建关系:", startNodeId, endNodeId, type, properties);
                result = await this.api.createEdge({ startNodeId, endNodeId, type, properties });
            }

            // 检查API响应是否成功
            if (result && result.success) {
                this.showSuccessMessage(existingEdge ? '关系更新成功！' : '关系创建成功！');
                this.hideModal();
                this.loadData(); // 刷新数据
            } else {
                throw new Error(result?.message || '操作失败，请检查服务器响应');
            }
        } catch (error) {
            console.error('保存关系失败:', error);
            this.showErrorMessage('保存关系失败: ' + error.message);
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