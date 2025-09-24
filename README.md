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
    npm install --save @antv/g6@4.3.3
    npm install express@4.18.2

## 导入数据
    将./data中的neo4j.dump文件导入neo4j中

## 启动服务
在neo4j的/bin目录运行

    neo4j.bat start

./code/backend目录运行

    npm run dev

./code/frontend目录运行

    python -m http.server 8000

进入./code/backend/.env
    
    将其中
    NEO4J_USER=neo4j
    NEO4J_PASSWORD=XAX17588888
    两列修改为当前neo4j的用户名及密码