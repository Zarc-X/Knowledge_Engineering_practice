class GraphRenderer {
    constructor(containerId) {
        this.containerId = containerId;
        this.graph = null;
        this.app = null; // 添加应用实例引用
        this.init();
    }

    // 设置应用实例的方法
    setAppInstance(app) {
        this.app = app;
    }

    init() {
        const container = document.getElementById(this.containerId);
        const width = container.clientWidth;
        const height = container.clientHeight || 600;

        this.graph = new G6.Graph({
            container: this.containerId,
            width,
            height,
            modes: {
                default: ['drag-canvas', 'zoom-canvas', 'drag-node']
            },
            defaultNode: {
                size: 30,
                style: {
                    fill: '#DEE9FF',
                    stroke: '#5B8FF9'
                },
                labelCfg: {
                    style: {
                        fill: '#000',
                        fontSize: 12
                    }
                }
            },
            defaultEdge: {
                style: {
                    stroke: '#e2e2e2',
                    lineWidth: 2, // 增加线宽确保可见
                    opacity: 1 // 确保不透明
                },
                labelCfg: {
                    autoRotate: true,
                    style: {
                        fill: '#000',
                        backgroundColor: '#fff',
                        fontSize: 12
                    }
                }
            },
            layout: {
                type: 'force',
                preventOverlap: true,
                linkDistance: 100
            }
        });

        // 添加渲染完成事件监听
        this.graph.on('afterrender', () => {
            console.log('图谱渲染完成');
            const edges = this.graph.getEdges();
            console.log(`实际渲染的边数量: ${edges.length}`);
        });
    }

    //将数据转换为G6格式并渲染
    render(data) {
        if (!this.graph) {
            console.error("图谱实例未初始化");
            return;
        }

        console.log("原始数据 - 节点:", data.nodes.length, "边:", data.edges.length);

        const nodes = data.nodes.map(node => ({
            id: node.id,
            label: node.properties && node.properties.name
                ? node.properties.name
                : `节点 ${node.id ? node.id.substr(0, 8) : '未知'}`,
            properties: node.properties || {},
            labels: node.labels || []
        }));

        // 增强边的转换逻辑
        const edges = data.edges.map(edge => {
            // 多种方式获取source和target
            const source = edge.startNode ? edge.startNode.id :
                edge.startNodeId ? edge.startNodeId :
                    edge.source;

            const target = edge.endNode ? edge.endNode.id :
                edge.endNodeId ? edge.endNodeId :
                    edge.target;

            const edgeObj = {
                id: edge.id,
                source: source,
                target: target,
                label: edge.type || '关系',
                properties: edge.properties || {}
            };

            // 检查source和target是否存在
            const sourceExists = nodes.some(n => n.id === source);
            const targetExists = nodes.some(n => n.id === target);

            if (!sourceExists || !targetExists) {
                console.warn(`边 ${edge.id} 的节点引用不存在:`, {
                    source, sourceExists, target, targetExists,
                    edgeData: edge
                });
            }

            return edgeObj;
        });

        // 过滤掉节点引用不存在的边
        const validEdges = edges.filter(edge => {
            const sourceExists = nodes.some(n => n.id === edge.source);
            const targetExists = nodes.some(n => n.id === edge.target);
            return sourceExists && targetExists;
        });

        console.log("转换后 - 节点:", nodes.length, "有效边:", validEdges.length);
        console.log("节点ID示例:", nodes.slice(0, 3).map(n => n.id));
        console.log("边示例:", validEdges.slice(0, 3));

        this.graph.data({
            nodes,
            edges: validEdges
        });

        this.graph.render();
        this.graph.fitView();

        this.bindGraphEvents();

        try {
            this.graph.data({
                nodes,
                edges: validEdges
            });

            this.graph.render();
            this.graph.fitView();

            // 检查渲染结果
            const renderedNodes = this.graph.getNodes();
            const renderedEdges = this.graph.getEdges();

            console.log(`图谱渲染结果 - 节点: ${renderedNodes.length}, 边: ${renderedEdges.length}`);

            if (renderedEdges.length === 0 && validEdges.length > 0) {
                console.warn("边数据存在但未被渲染，检查G6配置");
                // 强制重新设置边样式
                this.graph.getEdges().forEach(edge => {
                    this.graph.updateItem(edge, {
                        style: {
                            stroke: '#ff0000', // 红色，便于调试
                            lineWidth: 2
                        }
                    });
                });
            }

            this.bindGraphEvents();
        } catch (error) {
            console.error("图谱渲染错误:", error);
        }
    }

    // …………………

    // 事件绑定
    bindGraphEvents() {
        this.graph.off('node:click');
        this.graph.off('edge:click');

        this.graph.on('node:click', (evt) => {
            const node = evt.item;
            const nodeId = node.get('model').id;
            console.log('节点被点击:', nodeId);

            if (this.app && this.app.showNodeDetail) {
                this.app.showNodeDetail(nodeId);
            } else {
                console.error('应用实例未找到或showNodeDetail方法不存在');
                document.dispatchEvent(new CustomEvent('nodeClick', { detail: nodeId }));
            }
        });

        this.graph.on('edge:click', (evt) => {
            const edge = evt.item;
            const edgeModel = edge.get('model');
            const edgeId = edgeModel.id;
            console.log('边被点击 - 模型数据:', edgeModel);
            console.log('边被点击 - ID:', edgeId);

            if (this.app && this.app.showEdgeDetail) {
                this.app.showEdgeDetail(edgeId);
            } else {
                console.error('应用实例未找到或showEdgeDetail方法不存在');
                document.dispatchEvent(new CustomEvent('edgeClick', { detail: edgeId }));
            }
        });
    }

    // 高亮节点
    highlightNodes(nodeIds) {
        if (!this.graph) return;

        this.graph.getNodes().forEach(node => {
            this.graph.updateItem(node, {
                style: {
                    fill: '#DEE9FF',
                    stroke: '#5B8FF9'
                }
            });
        });

        nodeIds.forEach(nodeId => {
            const node = this.graph.findById(nodeId);
            if (node) {
                this.graph.updateItem(node, {
                    style: {
                        fill: '#FF9D4D',
                        stroke: '#FF6A00'
                    }
                });
            }
        });

        this.graph.focusItem(nodeIds[0]);
    }
}

// document.addEventListener('nodeClick', (e) => {
//     console.log('节点被点击:', e.detail);
// });

// document.addEventListener('edgeClick', (e) => {
//     console.log('边被点击:', e.detail);
// });

document.addEventListener('nodeClick', (e) => {
    console.log('通过全局事件处理节点点击:', e.detail);
    if (window.app && window.app.showNodeDetail) {
        window.app.showNodeDetail(e.detail);
    } else {
        console.warn('无法处理节点点击事件：应用实例未找到');
    }
});

document.addEventListener('edgeClick', (e) => {
    console.log('通过全局事件处理边点击:', e.detail);
    if (window.app && window.app.showEdgeDetail) {
        window.app.showEdgeDetail(e.detail);
    } else {
        console.warn('无法处理边点击事件：应用实例未找到');
    }
});