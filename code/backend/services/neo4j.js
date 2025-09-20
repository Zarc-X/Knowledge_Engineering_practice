// services/neo4j.js
const neo4j = require('neo4j-driver');

// 数据库连接配置 - 使用默认的本地Neo4j设置
const URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'password'; // 请更改为你的实际密码

// 创建驱动实例
let driver;

/**
 * 初始化Neo4j驱动并测试连接
 * @returns {neo4j.Driver} Neo4j驱动实例
 */
function initDriver() {
    try {
        driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
        console.log('Neo4j驱动已初始化');
        return driver;
    } catch (error) {
        console.error('Neo4j驱动初始化失败:', error);
        throw error;
    }
}

/**
 * 获取Neo4j驱动实例
 * @returns {neo4j.Driver} Neo4j驱动实例
 */
function getDriver() {
    return driver;
}

/**
 * 关闭Neo4j驱动连接
 * @returns {Promise<void>}
 */
async function closeDriver() {
    if (driver) {
        await driver.close();
        console.log('Neo4j连接已关闭');
    }
}

/**
 * 执行读操作Cypher查询
 * @param {string} query Cypher查询语句
 * @param {Object} params 查询参数
 * @returns {Promise<neo4j.Result>} 查询结果
 */
async function read(query, params = {}) {
    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
        const result = await session.run(query, params);
        return result;
    } finally {
        await session.close();
    }
}

/**
 * 执行写操作Cypher查询
 * @param {string} query Cypher查询语句
 * @param {Object} params 查询参数
 * @returns {Promise<neo4j.Result>} 查询结果
 */
async function write(query, params = {}) {
    const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
        const result = await session.run(query, params);
        return result;
    } finally {
        await session.close();
    }
}

// 初始化驱动
initDriver();

// 导出功能
module.exports = {
    getDriver: () => driver,
    closeDriver: async () => {
        if (driver) {
            await driver.close();
            console.log('Neo4j连接已关闭');
        }
    },
    read: async (query, params = {}) => {
        const session = driver.session({ defaultAccessMode: neo4j.session.READ });
        try {
            return await session.run(query, params);
        } finally {
            await session.close();
        }
    },
    write: async (query, params = {}) => {
        const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
        try {
            return await session.run(query, params);
        } finally {
            await session.close();
        }
    },
    int: neo4j.int, // 导出neo4j.int函数
    isInt: neo4j.isInt // 导出neo4j.isInt函数
};