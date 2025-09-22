# 知识图谱后端服务

## 环境要求
    jdk 11
    nodejs 22.19.0
    angular_cli 20.3.2
    neo4j 4.4
    express 4.18.2


## 安装依赖
在 ./code/backend 目录运行

    npm install
    npm install express@4.18.2

## 启动服务
在neo4j的/bin目录运行

    neo4j.bat start

./code/backend目录运行

    npm run dev

./code/frontend目录运行

    python -m http.server 8000