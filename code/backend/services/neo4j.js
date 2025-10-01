const neo4j = require('neo4j-driver');
require('dotenv').config(); // 确保加载环境变量


const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USER;
const PASSWORD = process.env.NEO4J_PASSWORD;

if (!URI || !USER || !PASSWORD) {
    console.error('缺少必要的数据库连接环境变量');
    process.exit(1);
}

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
        process.exit(1); // 退出进程
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

initDriver();

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
    int: neo4j.int,
    isInt: neo4j.isInt
};