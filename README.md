# 知识图谱后端服务

## 环境要求
    jdk 11
    nodejs 22.19.0
    angular_cli 20.3.2
    neo4j 4.4
    express 4.18.2
    AntV_G6 4.3.3

## 安装依赖
在 ./code/backend 目录运行

    npm install
    npm install express@4.18.2
    npm install --save @antv/g6@4.3.3

## 加载数据
1. 确保neo4j处于停机状态
2. 在neo4j/bin目录下运行如下命令

        neo4j-admin load --from="C:\Users\Zarc\Downloads\data\neo4j.dump" --database=neo4j --force

## 启动服务
1. 在neo4j的/bin目录运行

    neo4j.bat console

2. 在./code/backend目录运行

    npm run dev

3. 在./code/frontend目录运行

    python -m http.server 8000

4. 从8000端口访问管理界面