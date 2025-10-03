class KnowledgeGraphApp {
    constructor() {
        console.log("KnowledgeGraphApp 初始化开始");
        this.api = new ApiService();
        this.graphRenderer = new GraphRenderer('graph');
        this.currentData = {
            nodes: [],
            edges: []
        };

        this.config = {
            maxNodes: 10000,
            maxEdges: 10000
        };

        this.graphRenderer.setAppInstance(this);

        // 确保缓存对象正确初始化
        this.nodeCache = new Map();     // 节点缓存
        this.edgeCache = new Map();     // 关系缓存
        this.cacheTimeout = 30000;      // 缓存30秒

        // 确保缓存方法存在
        // this.preloadCaches = this.preloadCaches.bind(this);

        this.init();
        console.log("KnowledgeGraphApp 初始化完成");
    }

    // 预加载缓存 - 添加安全检查
    preloadCaches() {
        try {
            // 确保缓存对象存在
            if (!this.nodeCache) {
                console.warn('nodeCache 未初始化，正在重新初始化');
                this.nodeCache = new Map();
            }
            if (!this.edgeCache) {
                console.warn('edgeCache 未初始化，正在重新初始化');
                this.edgeCache = new Map();
            }

            // 清空旧缓存
            if (this.nodeCache.clear) {
                this.nodeCache.clear();
            }
            if (this.edgeCache.clear) {
                this.edgeCache.clear();
            }

            // 预缓存节点数据
            this.currentData.nodes.forEach(node => {
                if (node && node.id) {
                    this.nodeCache.set(node.id, {
                        data: node,
                        timestamp: Date.now()
                    });
                }
            });

            // 预缓存边数据
            this.currentData.edges.forEach(edge => {
                if (edge && edge.id) {
                    this.edgeCache.set(edge.id, {
                        data: edge,
                        timestamp: Date.now()
                    });
                }
            });

            console.log(`预缓存完成: ${this.nodeCache.size} 个节点, ${this.edgeCache.size} 条边`);
        } catch (error) {
            console.error('预加载缓存失败:', error);
            // 即使缓存失败也不应该阻止应用运行
        }
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

        // 节点数控制事件
        bindEventWhenReady('#debug-apply-limit', 'click', () => {
            const limitInput = document.getElementById('debug-node-limit');
            const maxNodes = parseInt(limitInput.value);
            if (!isNaN(maxNodes) && maxNodes > 0) {
                this.config.maxNodes = maxNodes;
                console.log(`手动设置最大节点数为: ${maxNodes}`);
                this.loadData();
            }
        });

        // 边数控制事件
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


    /*     
     * 数据管理
     */
    // 加载所有数据
    // async loadData() {
    //     try {
    //         console.log("开始加载数据...");
    //         console.log("请求参数 - maxNodes:", this.config.maxNodes, "maxEdges:", this.config.maxEdges);

    //         const [nodesResponse, edgesResponse] = await Promise.all([
    //             this.api.getNodes(this.config.maxNodes),
    //             this.api.getEdges(this.config.maxEdges)
    //         ]);

    //         console.log("节点响应结构:", nodesResponse);
    //         console.log("关系响应结构:", edgesResponse);

    //         console.log("节点响应数据量:", nodesResponse.data ? nodesResponse.data.length : 0);
    //         console.log("关系响应数据量:", edgesResponse.data ? edgesResponse.data.length : 0);

    //         this.currentData.nodes = nodesResponse.data || [];
    //         this.currentData.edges = edgesResponse.data || [];

    //         console.log("=== 数据诊断 ===");
    //         console.log("配置限制 - 节点:", this.config.maxNodes, "边:", this.config.maxEdges);
    //         console.log("实际获取 - 节点:", this.currentData.nodes.length, "边:", this.currentData.edges.length);

    //         if (this.currentData.nodes.length === this.config.maxNodes) {
    //             console.log("✅ 节点数量达到限制，后端限制生效");
    //         } else {
    //             console.log("⚠️ 节点数量未达到限制，可能原因:");
    //             console.log("   - 数据库中没有足够节点");
    //             console.log("   - 后端服务未正确处理limit参数");
    //             console.log("   - 网络请求参数错误");
    //         }

    //         // 如果返回的节点数超过限制，进行截断
    //         if (this.currentData.nodes.length > this.config.maxNodes) {
    //             console.warn(`节点数量超过限制，显示前 ${this.config.maxNodes} 个节点`);
    //             this.currentData.nodes = this.currentData.nodes.slice(0, this.config.maxNodes);
    //         }

    //         // 如果返回的边数超过限制，进行截断
    //         if (this.currentData.edges.length > this.config.maxEdges) {
    //             console.warn(`边数量超过限制，显示前 ${this.config.maxEdges} 条边`);
    //             this.currentData.edges = this.currentData.edges.slice(0, this.config.maxEdges);
    //         }

    //         console.log("最终显示节点数量:", this.currentData.nodes.length);
    //         console.log("最终显示关系数量:", this.currentData.edges.length);

    //         this.renderSidebarLists();
    //         this.graphRenderer.render(this.currentData);

    //         console.log("数据加载完成");
    //     } catch (error) {
    //         console.error('加载数据失败:', error);
    //         alert('加载数据失败: ' + error.message);
    //     }
    // }

    async loadData() {
        try {
            console.log("开始加载数据...");

            const [nodesResponse, edgesResponse] = await Promise.all([
                this.api.getNodes(this.config.maxNodes),
                this.api.getEdges(this.config.maxEdges)
            ]);

            this.currentData.nodes = nodesResponse.data || [];
            this.currentData.edges = edgesResponse.data || [];

            // 添加详细的数据诊断
            console.log("=== 数据诊断 ===");
            console.log("节点数量:", this.currentData.nodes.length);
            console.log("边数量:", this.currentData.edges.length);

            // 检查边的source和target是否能在节点中找到
            const nodeIds = new Set(this.currentData.nodes.map(node => node.id));
            let validEdges = 0;

            this.currentData.edges.forEach(edge => {
                const sourceId = edge.startNode ? edge.startNode.id : edge.startNodeId;
                const targetId = edge.endNode ? edge.endNode.id : edge.endNodeId;

                const sourceExists = nodeIds.has(sourceId);
                const targetExists = nodeIds.has(targetId);

                if (sourceExists && targetExists) {
                    validEdges++;
                } else {
                    console.warn(`无效的边: ${edge.id}, source存在: ${sourceExists}, target存在: ${targetExists}`);
                    console.warn(`  source: ${sourceId}, target: ${targetId}`);
                }
            });

            console.log(`有效边数量: ${validEdges}/${this.currentData.edges.length}`);

            // 预加载缓存
            try {
                this.preloadCaches();
            } catch (cacheError) {
                console.warn('缓存预加载失败，但不影响主要功能:', cacheError);
            }

            this.renderSidebarLists();
            this.graphRenderer.render(this.currentData);

            console.log("数据加载完成");
        } catch (error) {
            console.error('加载数据失败:', error);
            alert('加载数据失败: ' + error.message);
        }
    }

    // 预加载缓存
    preloadCaches() {
        // 清空旧缓存
        this.nodeCache.clear();
        this.edgeCache.clear();

        // 预缓存节点数据
        this.currentData.nodes.forEach(node => {
            this.nodeCache.set(node.id, {
                data: node,
                timestamp: Date.now()
            });
        });

        // 预缓存边数据
        this.currentData.edges.forEach(edge => {
            this.edgeCache.set(edge.id, {
                data: edge,
                timestamp: Date.now()
            });
        });

        console.log(`预缓存完成: ${this.nodeCache.size} 个节点, ${this.edgeCache.size} 条边`);
    }

    // 设置最大节点数
    setMaxNodes(maxNodes) {
        if (maxNodes > 0 && maxNodes <= 10000) {
            this.config.maxNodes = maxNodes;
            console.log(`设置最大节点数为: ${maxNodes}`);
            this.loadData();
        } else {
            alert('最大节点数必须在1-10000之间');
        }
    }

    // 设置最大边数
    setMaxEdges(maxEdges) {
        if (maxEdges > 0 && maxEdges <= 10000) {
            this.config.maxEdges = maxEdges;
            console.log(`设置最大边数为: ${maxEdges}`);
            this.loadData();
        } else {
            alert('最大边数必须在1-10000之间');
        }
    }


    /*
     * UI 交互 
     */
    // 显示表单
    // 编辑时传入节点对象，添加时传入null
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

        // 表单提交
        document.getElementById('node-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNode(node);
        });

        document.getElementById('cancel-node-btn').addEventListener('click', () => {
            this.hideModal();
        });
    }

    // 编辑时传入关系对象，添加时传入null
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

        // 表单提交事件
        document.getElementById('edge-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdge(edge);
        });

        document.getElementById('cancel-edge-btn').addEventListener('click', () => {
            this.hideModal();
        });
    }

    // 显示节点详情
    async showNodeDetail(nodeId, cachedData = null) {
        if (!this.isValidId(nodeId)) {
            alert('无效的节点ID');
            return;
        }

        // 立即显示加载状态
        this.showModal(`
            <h2>节点详情</h2>
            <div style="text-align: center; padding: 20px;">
                <div>加载中...</div>
            </div>
        `);

        // 检查缓存
        const cached = this.nodeCache.get(nodeId);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log("使用缓存的节点数据");
            this.hideModal(); // 先关闭加载模态框
            this.renderNodeDetail(cached.data);
            return;
        }

        try {
            console.log("显示节点详情，ID:", nodeId);

            // 先从当前数据中查找
            const nodeInCurrentData = this.currentData.nodes.find(n => n.id === nodeId);
            if (nodeInCurrentData) {
                console.log("从当前数据加载节点详情");
                this.hideModal(); // 关闭加载模态框
                this.renderNodeDetail(nodeInCurrentData);

                // 异步更新缓存
                this.fetchAndCacheNode(nodeId);
                return;
            }

            // 如果有传入的缓存数据，先使用它
            if (cachedData) {
                this.hideModal();
                this.renderNodeDetail(cachedData);
                this.fetchAndCacheNode(nodeId);
                return;
            }

            // 没有缓存也没有当前数据，才调用API
            const response = await this.api.getNode(nodeId);
            if (!response.success) {
                throw new Error(response.message || "获取节点详情失败");
            }

            const node = response.data;
            if (!node) {
                throw new Error("节点数据为空");
            }

            // 缓存结果
            this.nodeCache.set(nodeId, {
                data: node,
                timestamp: Date.now()
            });

            this.hideModal();
            this.renderNodeDetail(node);
        } catch (error) {
            console.error('获取节点详情失败:', error);
            this.hideModal();
            this.showNodeError(nodeId, error);
        }
    }

    // 显示关系详情
    async showEdgeDetail(edgeId) {
        // 检查缓存
        const cached = this.edgeCache.get(edgeId);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log("使用缓存的边数据");
            this.renderEdgeDetail(cached.data);
            return;
        }

        try {
            console.log("显示关系详情，ID:", edgeId);

            // 先从当前数据中查找
            const edgeInCurrentData = this.currentData.edges.find(e => e.id === edgeId);
            if (edgeInCurrentData) {
                console.log("从当前数据加载边详情");
                this.renderEdgeDetail(edgeInCurrentData);

                // 异步更新缓存
                this.fetchAndCacheEdge(edgeId);
                return;
            }

            // 没有缓存也没有当前数据，才调用API
            const response = await this.api.getEdge(edgeId);
            if (!response.success) {
                throw new Error(response.message || "获取关系详情失败");
            }

            const edge = response.data;
            if (!edge) {
                throw new Error("关系数据为空");
            }

            // 缓存结果
            this.edgeCache.set(edgeId, {
                data: edge,
                timestamp: Date.now()
            });

            this.renderEdgeDetail(edge);
        } catch (error) {
            console.error('获取关系详情失败:', error);
            this.showEdgeError(edgeId, error);
        }
    }

    // 异步更新节点缓存
    async fetchAndCacheNode(nodeId) {
        try {
            const response = await this.api.getNode(nodeId);
            if (response.success && response.data) {
                this.nodeCache.set(nodeId, {
                    data: response.data,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.warn('异步更新节点缓存失败:', error);
        }
    }

    // 专用的节点详情渲染方法
    renderNodeDetail(node) {
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
    }

    // 异步更新缓存
    async fetchAndCacheEdge(edgeId) {
        try {
            const response = await this.api.getEdge(edgeId);
            if (response.success && response.data) {
                this.edgeCache.set(edgeId, {
                    data: response.data,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.warn('异步更新边缓存失败:', error);
        }
    }

    // 专用的边详情渲染方法
    renderEdgeDetail(edge) {
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
    }

    showNodeError(nodeId, error) {
        const errorHtml = `
            <h2>错误</h2>
            <p>获取节点详情失败</p>
            <p><strong>错误信息:</strong> ${error.message}</p>
            <p><strong>节点ID:</strong> ${nodeId}</p>
        `;
        this.showModal(errorHtml);
    }

    showEdgeError(edgeId, error) {
        const errorHtml = `
        <h2>错误</h2>
        <p>获取关系详情失败</p>
        <p><strong>错误信息:</strong> ${error.message}</p>
        <p><strong>关系ID:</strong> ${edgeId}</p>
        `;
        this.showModal(errorHtml);
    }

    // 删除节点
    // 在 app.js 中修改 deleteNode 方法
    async deleteNode(nodeId) {
        try {
            console.log("开始删除节点，ID:", nodeId);

            if (!this.isValidId(nodeId)) {
                throw new Error('无效的节点ID');
            }

            const response = await this.api.deleteNode(nodeId);
            console.log("删除节点API响应:", response);

            if (response && (response.success === true || response.success === undefined || response.success === 'unknown')) {
                // 清理缓存
                this.nodeCache.delete(nodeId);

                // 清理与该节点相关的边缓存
                this.currentData.edges
                    .filter(edge =>
                        edge.startNode?.id === nodeId ||
                        edge.endNode?.id === nodeId
                    )
                    .forEach(edge => this.edgeCache.delete(edge.id));

                // 从当前数据中移除已删除的节点
                this.currentData.nodes = this.currentData.nodes.filter(node => node.id !== nodeId);

                // 同时移除相关的边
                this.currentData.edges = this.currentData.edges.filter(edge =>
                    edge.startNode?.id !== nodeId && edge.endNode?.id !== nodeId
                );

                if (response.success === 'unknown') {
                    this.showMessage('删除请求已发送，但由于超时请刷新页面确认删除状态', 'warning');
                } else {
                    this.showSuccessMessage('节点删除成功！');
                }

                this.hideModal();

                // 刷新UI但不重新加载所有数据
                this.renderSidebarLists();
                this.graphRenderer.render(this.currentData);

                // 如果是超时情况，建议用户刷新数据
                if (response.success === 'unknown') {
                    setTimeout(() => {
                        if (confirm('由于删除操作超时，建议刷新页面确认数据状态。是否立即刷新？')) {
                            this.loadData();
                        }
                    }, 2000);
                }
            } else {
                throw new Error(response?.message || '删除操作失败');
            }
        } catch (error) {
            console.error('删除节点失败:', error);

            let errorMessage = '删除节点失败: ' + error.message;
            if (error.message.includes('timeout') || error.name === 'AbortError') {
                errorMessage = '删除请求超时，但节点可能已在后台删除，请刷新页面确认';
            }

            this.showErrorMessage(errorMessage);
        }
    }

    // 删除关系
    // 添加缓存清理
    // 在 app.js 的 deleteEdge 方法中增强错误处理
    async deleteEdge(edgeId) {
        try {
            console.log("开始删除关系，ID:", edgeId);

            if (!this.isValidId(edgeId)) {
                throw new Error('无效的关系ID');
            }

            const response = await this.api.deleteEdge(edgeId);
            console.log("删除关系API响应:", response);

            if (response && (response.success === true || response.success === 'unknown')) {
                // 清理缓存
                this.edgeCache.delete(edgeId);

                // 从当前数据中移除已删除的关系
                this.currentData.edges = this.currentData.edges.filter(edge => edge.id !== edgeId);

                if (response.success === 'unknown') {
                    this.showMessage('删除请求已发送，但由于超时请刷新页面确认删除状态', 'warning');
                } else {
                    this.showSuccessMessage('关系删除成功！');
                }

                this.hideModal();

                // 刷新UI但不重新加载所有数据
                this.renderSidebarLists();
                this.graphRenderer.render(this.currentData);

                // 如果是超时情况，建议用户刷新数据
                if (response.success === 'unknown') {
                    setTimeout(() => {
                        if (confirm('由于删除操作超时，建议刷新页面确认数据状态。是否立即刷新？')) {
                            this.loadData();
                        }
                    }, 2000);
                }
            } else {
                throw new Error(response?.message || '删除操作失败');
            }
        } catch (error) {
            console.error('删除关系失败:', error);
            this.showErrorMessage('删除关系失败: ' + error.message);
        }
    }

    // 搜索
    async handleSearch() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        try {
            const response = await this.api.searchNodes('name', query);

            if (response.data.length > 0) {
                this.graphRenderer.highlightNodes(response.data.map(node => node.id));
            } else {
                alert('未找到匹配的节点');
            }
        } catch (error) {
            console.error('搜索失败:', error);
            alert('搜索失败');
        }
    }

    /*
     * 模态框 
     */
    showModal(content) {
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal').style.display = 'block';
    }

    hideModal() {
        document.getElementById('modal').style.display = 'none';
    }

    debugInfo() {
        console.log("=== 调试信息开始 ===");
        console.log("当前配置:", this.config);
        console.log("最大节点数:", this.config.maxNodes);
        console.log("最大边数:", this.config.maxEdges);

        console.log("API基础URL:", this.api.baseUrl);

        console.log("测试API连接...");

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

        console.log("图谱容器:", this.graphRenderer.containerId);
        console.log("图谱实例:", this.graphRenderer.graph ? "已初始化" : "未初始化");

        const buttons = ['refresh-btn', 'add-node-btn', 'add-edge-btn', 'debug-btn', 'search-btn', 'debug-apply-limit', 'debug-apply-edge-limit'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            console.log(`按钮 ${btnId}:`, btn ? "存在" : "不存在");
        });

        console.log("=== 调试信息结束 ===");

        alert("调试信息已输出到控制台，请按F12查看");
    }

    isValidId(id) {
        return id && typeof id === 'string' && id.length > 0;
    }

    // renderSidebarLists() {
    //     const nodesContainer = document.getElementById('nodes-container');
    //     const edgesContainer = document.getElementById('edges-container');

    //     nodesContainer.innerHTML = '';
    //     edgesContainer.innerHTML = '';

    //     // 统计信息
    //     const statsHtml = `
    // <div style="background: #f0f0f0; padding: 8px; margin-bottom: 10px; border-radius: 4px;">
    //     <strong>统计信息:</strong><br>
    //     节点: ${this.currentData.nodes.length}/${this.config.maxNodes}<br>
    //     关系: ${this.currentData.edges.length}/${this.config.maxEdges}
    // </div>
    // `;

    //     nodesContainer.innerHTML = statsHtml;

    //     // 使用事件委托优化节点点击
    //     this.currentData.nodes.forEach(node => {
    //         const li = document.createElement('li');
    //         const displayName = node.properties && node.properties.name
    //             ? node.properties.name
    //             : `节点 ${node.id ? node.id.substring(0, 8) : '未知'}`;

    //         li.textContent = displayName;
    //         li.dataset.id = node.id;
    //         li.dataset.type = 'node';
    //         nodesContainer.appendChild(li);
    //     });

    //     // 使用事件委托优化边点击
    //     this.currentData.edges.forEach(edge => {
    //         const li = document.createElement('li');
    //         const startName = edge.startNode && edge.startNode.properties && edge.startNode.properties.name
    //             ? edge.startNode.properties.name
    //             : (edge.startNodeId || '未知');
    //         const endName = edge.endNode && edge.endNode.properties && edge.endNode.properties.name
    //             ? edge.endNode.properties.name
    //             : (edge.endNodeId || '未知');

    //         li.textContent = `${edge.type || '关系'}: ${startName} → ${endName}`;
    //         li.dataset.id = edge.id;
    //         li.dataset.type = 'edge';
    //         li.dataset.edge = JSON.stringify(edge); // 预存边数据
    //         edgesContainer.appendChild(li);
    //     });

    //     // 使用事件委托处理点击
    //     nodesContainer.addEventListener('click', (e) => {
    //         const li = e.target.closest('li');
    //         if (li && li.dataset.type === 'node') {
    //             this.showNodeDetail(li.dataset.id);
    //         }
    //     });

    //     edgesContainer.addEventListener('click', (e) => {
    //         const li = e.target.closest('li');
    //         if (li && li.dataset.type === 'edge') {
    //             // 直接从dataset获取预存的边数据，避免立即调用API
    //             const edgeData = JSON.parse(li.dataset.edge);
    //             this.showEdgeDetail(li.dataset.id, edgeData);
    //         }
    //     });
    // }

    renderSidebarLists() {
        const nodesContainer = document.getElementById('nodes-container');
        const edgesContainer = document.getElementById('edges-container');

        nodesContainer.innerHTML = '';
        edgesContainer.innerHTML = '';

        // 统计信息
        const statsHtml = `
        <div style="background: #f0f0f0; padding: 8px; margin-bottom: 10px; border-radius: 4px;">
            <strong>统计信息:</strong><br>
            节点: ${this.currentData.nodes.length}/${this.config.maxNodes}<br>
            关系: ${this.currentData.edges.length}/${this.config.maxEdges}
        </div>
    `;

        nodesContainer.innerHTML = statsHtml;

        // 批量处理节点列表
        const nodeFragment = document.createDocumentFragment();
        this.currentData.nodes.forEach(node => {
            const li = document.createElement('li');
            const displayName = node.properties && node.properties.name
                ? node.properties.name
                : `节点 ${node.id ? node.id.substring(0, 8) : '未知'}`;

            li.textContent = displayName;
            li.dataset.id = node.id;
            li.dataset.type = 'node';
            li.dataset.node = JSON.stringify(node); // 预存节点数据
            nodeFragment.appendChild(li);
        });
        nodesContainer.appendChild(nodeFragment);

        // 批量处理边列表
        const edgeFragment = document.createDocumentFragment();
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
            li.dataset.type = 'edge';
            li.dataset.edge = JSON.stringify(edge);
            edgeFragment.appendChild(li);
        });
        edgesContainer.appendChild(edgeFragment);

        // 统一的事件委托处理
        this.setupSidebarEventDelegation();
    }

    // 单独设置事件委托的方法
    setupSidebarEventDelegation() {
        const nodesContainer = document.getElementById('nodes-container');
        const edgesContainer = document.getElementById('edges-container');

        // 移除旧的事件监听器（避免重复绑定）
        nodesContainer.replaceWith(nodesContainer.cloneNode(true));
        edgesContainer.replaceWith(edgesContainer.cloneNode(true));

        // 重新获取元素引用
        const newNodesContainer = document.getElementById('nodes-container');
        const newEdgesContainer = document.getElementById('edges-container');

        // 节点点击事件委托
        newNodesContainer.addEventListener('click', (e) => {
            const li = e.target.closest('li[data-type="node"]');
            if (li) {
                const nodeData = JSON.parse(li.dataset.node);
                this.showNodeDetail(li.dataset.id, nodeData);
            }
        });

        // 边点击事件委托
        newEdgesContainer.addEventListener('click', (e) => {
            const li = e.target.closest('li[data-type="edge"]');
            if (li) {
                const edgeData = JSON.parse(li.dataset.edge);
                this.showEdgeDetail(li.dataset.id, edgeData);
            }
        });
    }

    async saveNode(existingNode) {
        try {
            const name = document.getElementById('node-name').value;
            const labels = document.getElementById('node-labels').value.split(',').map(l => l.trim()).filter(l => l);
            const propertiesText = document.getElementById('node-properties').value || '{}';

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
                // 修改这里：将 properties 包装在对象中
                result = await this.api.updateNode(existingNode.id, { properties });
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

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        const existingMessage = document.getElementById('operation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.id = 'operation-message';
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
        <span>${message}</span>
        <button id="close-message-btn">&times;</button>
    `;

        document.body.appendChild(messageDiv);

        document.getElementById('close-message-btn').addEventListener('click', () => {
            messageDiv.remove();
        });

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

            let properties;
            try {
                properties = JSON.parse(propertiesText);
            } catch (e) {
                throw new Error('属性JSON格式不正确');
            }

            let result;
            if (existingEdge) {
                console.log("更新关系:", existingEdge.id, properties);
                // 修改这里：将 properties 包装在对象中
                result = await this.api.updateEdge(existingEdge.id, { properties });
            } else {
                console.log("创建关系:", startNodeId, endNodeId, type, properties);
                result = await this.api.createEdge({ startNodeId, endNodeId, type, properties });
            }

            if (result && result.success) {
                this.showSuccessMessage(existingEdge ? '关系更新成功！' : '关系创建成功！');
                this.hideModal();
                this.loadData();
            } else {
                throw new Error(result?.message || '操作失败，请检查服务器响应');
            }
        } catch (error) {
            console.error('保存关系失败:', error);
            this.showErrorMessage('保存关系失败: ' + error.message);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new KnowledgeGraphApp();
    window.app = app;
});

// 全局错误处理
window.addEventListener('error', function (e) {
    console.error('全局错误:', e.error);
});

// 捕获未处理的Promise拒绝
window.addEventListener('unhandledrejection', function (e) {
    console.error('未处理的Promise拒绝:', e.reason);
});