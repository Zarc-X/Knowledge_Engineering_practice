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
            // G6 画布配置
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
                    stroke: '#e2e2e2'
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

        window.addEventListener('resize', () => {
            if (!this.graph || this.graph.get('destroyed')) return;
            const container = document.getElementById(this.containerId);
            const width = container.clientWidth;
            const height = container.clientHeight;
            this.graph.changeSize(width, height);
        });
    }

    //将数据转换为G6格式并渲染
    render(data) {
        if (!this.graph) return;

        const nodes = data.nodes.map(node => ({
            id: node.id,
            label: node.properties && node.properties.name
                ? node.properties.name
                : `节点 ${node.id ? node.id.substr(0, 8) : '未知'}`,
            properties: node.properties || {},
            labels: node.labels || []
        }));

        const edges = data.edges.map(edge => ({
            id: edge.id,
            source: edge.startNode ? edge.startNode.id : edge.startNodeId,
            target: edge.endNode ? edge.endNode.id : edge.endNodeId,
            label: edge.type || '关系',
            properties: edge.properties || {}
        }));

        console.log("渲染节点:", nodes);
        console.log("渲染边:", edges);

        this.graph.data({
            nodes,
            edges
        });

        this.graph.render();
        this.graph.fitView();

        this.bindGraphEvents();
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