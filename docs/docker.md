<br>

# 目录导航

## 整体架构设计

### [Application Architecture](#application-architecture-1)

## Docker项目部署

### [Docker Install](#docker-install-1)

### [DockerFile Create](#dockerfile-create-1)

### [Docker-Compose Startup](#docker-compose-startup-1)

<br><br>

# 整体架构设计

## Application Architecture
- front-end: vuejs开发，使用bootstrap UI框架
- back-end: flask开发

```


                               ---> (cdn代理)  
                               |        |
                               |        ↓
   Https ------> Cloudflare ---|--> (DNS 解析) ---------------------------> Chrome                
    ↑                          |        |    
    |                          |    (域名专属)   
    |                          |        ↓
    |                          --> Turnstile --(人机挑战)--  
    |                                                     |
    |                                                     |
    -------(加密)--------- 云主机 -------> Docker          |           
             ↑               ↑               |            |                   
             |               |               |            |
         (SSL证书)       (端口映射)       (镜像构建)        |    
             |               |               ↓            |
   ----------|---------------|----------------------------|--------------------------
   |         |               |                            |                         |
   |         |           (流量输出)                        |                         |
   |         |               |                            |                         |
   |  Nginx Proxy Manager-----                            |                         |
   |         |                                            ↓                         |                  
   |         |             --> Nginx ---(静态代理)---> front-end                     |                   
   |         |             |                              |                         |                   
   |         |             |                              |                         |                 
   |         ---(web代理)---                            axios(连接前后端)            |                   
   |                       |                              |                         |
   |                       |                              |                         |                
   |                       --> Gunicorn --(进程代理)-- back-end                      |
   |                                                      |                         |                
   |                                                    (连接)                      |
   |                                                      |                         |
   |                                     -----------------|-----------------        |
   |                                     |                |                |        |
   |                                 (数据存储)       (搜索 功能)        (缓存系统)   |
   |                                     |                |                |        |
   |                                   MySQL        Elasticsearch        Redis      |
   |                                                                                |
   ----------------------------------------------------------------------------------

```

<br><br>

# Docker项目部署

## Docker Install
*Docker 镜像存储在本地系统目录的文件里面，我们的基础目录选择在/www/flask-vuejs-madblog/下*

**三种安装方法**
- 官方安装 速度慢,在大陆有可能被DNS污染导致失败.
- 手动安装 手动下载,离线安装.
- PIP在线安装 - 使用Python的PIP包管理工具在线安装

**官方安装**
```
curl -L https://github.com/docker/compose/releases/download/1.24.1/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

chmod +x /usr/local/bin/docker-compose

docker-compose version
```

**手动安装**
- 官网选择版本 https://github.com/docker/compose/releases 
```
chmod +x /usr/local/bin/docker-compose

docker-compose version
```

**PIP在线安装**
- 安装依赖
```
yum -y install epel-release

yum -y install python-pip

pip install --upgrade pip

pip --version

> pip 19.3.1 from /usr/lib/python2.7/site-packages/pip (python 2.7)

pip install -U docker-compose==1.24.1

docker-compose version
```

- 如果使用PIP安装时报以下错误,先升级安装requests库.
```
> ERROR: Cannot uninstall 'requests'. It is a distutils installed project and thus we cannot accurately determine which files belong to it which would lead to only a partial uninstall.
```

```
pip install -I requests==2.10.0

pip install -U docker-compose==1.24.1
```

- 最后给docker赋权
```
sudo groupadd docker 

sudo gpasswd -a root docker 

sudo service docker restart 
```

- 启动docker并自启
```
systemctl start docker

systemctl enable docker
```

## DockerFile Create

### Elasticsearch
- 由于我们的代码中使用了 ik 分词器，所以需要在 Elasticsearch 官方提供的镜像中先安装 ik，再保存为修改后的镜像
- 启动容器
```
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.0.0

docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e ES_JAVA_OPTS="-Xms256m -Xmx256m" \
  docker.elastic.co/elasticsearch/elasticsearch:7.0.0
```

- 安装 IK 分词器
- docker exec 命令允许你在运行中的容器内执行命令。-it 选项组合是为了开启一个交互式的 tty 终端，使你能够直接与容器内的命令行交互。elasticsearch 是目标容器的名称或 ID，/bin/bash 是你希望在容器内执行的命令，这里是启动 bash shell。
```
docker exec -it elasticsearch /bin/bash

elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.0.0/elasticsearch-analysis-ik-7.0.0.zip

exit
```
- 保存为新的镜像，删除旧容器
```
docker commit elasticsearch my-elasticsearch-ik

docker rm -f elasticsearch 
```

### Flask-api Dockerfile
- 配置gunicorn
- /www/flask-vuejs-madblog/back-end/
```
vim gunicorn.conf.py
```
  
```
import multiprocessing

bind = '0.0.0.0:5000'
workers = multiprocessing.cpu_count() * 2 + 1
loglevel = 'info'
accesslog = "-"
errorlog = "-"
```

- 新建启动脚本，因为有多条命令，不方便直接写到 Dockerfile 中的 CMD 子命令中
```
vim back-end/boot.sh
```

```
#!/bin/bash

while true; do
    flask db upgrade
    if [ "$?" == "0" ]; then
        break
    fi
    echo "Failed to apply the migration to the database, retrying in 3 secs..."
    sleep 3
done
flask deploy
exec gunicorn madblog:app -c gunicorn.conf.py
```
- 授予可执行权限
```
chmod +x back-end/boot.sh
```

- 然后再新建一个 Dockerfile
```
vim back-end/Dockerfile
```

```
FROM python:3.7.4

COPY ./back-end /usr/src/app
WORKDIR /usr/src/app

RUN pip install -r requirements.txt && pip install pymysql gunicorn pyopenssl

ENV FLASK_APP madblog.py
EXPOSE 5000
ENTRYPOINT ["bash", "./boot.sh"]
```

- 开始构建后端 Flask API 镜像
- -f 或 --file 参数指定了构建镜像时使用的 Dockerfile 文件的路径，在这个例子中，Dockerfile 位于 back-end 目录下
- -t 或 --tag 参数用于给构建的镜像指定一个标签，格式通常是 `<name>:<tag>`
- 使用 . 表示当前目录作为构建上下文发送给 Docker 守护进程
```
docker build -f back-end/Dockerfile -t madblog-api:0.0.1 .
```

### Nginx Dockerflie
- 首先宿主机安装 Node.js，我们通过 Node Version Manager（简称，nvm）来安装指定版本
- 加载 .bash_profile 文件，其中包含初始化 NVM 环境所需的路径和变量
```
curl https://raw.githubusercontent.com/creationix/nvm/v0.13.1/install.sh | bash

source ~/.bash_profile

nvm list-remote

nvm install v10.15.3

node --version
```

- 生成静态文件
```
cd front-end

npm install

npm run build

mkdir -p ../docker/nginx/data

cp -a dist/* ../docker/nginx/data

cd ..
```

## Docker-Compose Startup
*在单机上可以使用 Docker Compose 来编排我们多个容器，只需要提供一个 YAML 配置文件，一条命令就可以把这些容器全部启动起来，非常方便*

- Linux 安装 Docker-CE 时，默认没有安装 Compose 工具，需要我们额外安装
```
curl -L "https://github.com/docker/compose/releases/download/1.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

chmod +x /usr/local/bin/docker-compose

docker-compose --version

> docker-compose version 1.24.0, build 0aa59064
```

- 或者通过 Python3 下的 pip3 工具安装
```
pip3 install docker-compose

ln -s /usr/local/python-3.6/bin/docker-compose /usr/local/bin/docker-compose
```

- 配置docker-compose.yml
- 可以使用 `docker-compose config` 命令检查有没有语法错误
- www/flask-vuejs-madblog/
```
vim docker-compose.yml
```

```
version: "3.7"
services:

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=Password_123456
      - MYSQL_DATABASE=madblog
      - MYSQL_USER=testuser
      - MYSQL_PASSWORD=Password_123456
    ports:
      - "3306:3306"
    volumes:
      - "$PWD/docker/mysql/conf.d:/etc/mysql/conf.d"
      - "$PWD/docker/mysql/data:/var/lib/mysql"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - "$PWD/docker/redis/data:/data"
    command: redis-server --appendonly yes

  elasticsearch:
    image: my-elasticsearch-ik
    environment:
      - "discovery.type=single-node"
      - "ES_JAVA_OPTS=-Xms256m -Xmx256m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - "$PWD/docker/elasticsearch/data:/usr/share/elasticsearch/data"

  madblog-api:
    image: madblog-api:0.0.1
    environment:
      - REDIS_URL=redis://redis:6379/0
      - ELASTICSEARCH_URL=elasticsearch:9200
      - ADMINS='dawn.inator.lzl@gmail.com'
      - MAIL_SERVER='smtp.qq.com'
      - MAIL_PORT=465
      - MAIL_USE_SSL=1
      - MAIL_USERNAME='dawn.inator.bot@qq.com'
      - MAIL_PASSWORD='mjcnkweizcsqdfji'
      - MAIL_SENDER="Admin <dawn.inator.bot@qq.com>"
      - DATABASE_URL=mysql+pymysql://testuser:Password_123456@mysql:3306/madblog
    ports:
      - "5000:5000"

  rq-worker:
    image: madblog-api:0.0.1
    environment:
      - DATABASE_URL=mysql+pymysql://testuser:Password_123456@mysql/madblog
      - REDIS_URL=redis://redis:6379/0
      - ELASTICSEARCH_URL=elasticsearch:9200
      - ADMINS='dawn.inator.lzl@gmail.com'
      - MAIL_SERVER='smtp.qq.com'
      - MAIL_PORT=465
      - MAIL_USE_SSL=1
      - MAIL_USERNAME='dawn.inator.bot@qq.com'
      - MAIL_PASSWORD='mjcnkweizcsqdfji'
      - MAIL_SENDER="Admin <dawn.inator.bot@qq.com>"
    entrypoint: rq
    command: worker -u redis://redis:6379/0 madblog-tasks

  nginx:
    image: nginx
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - "$PWD/docker/nginx/data:/usr/share/nginx/html"

  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
      
```

- 启动所有容器，'-d' 选项表示在后台运行 compose，否则在前台输出日志
- ps查看容器状态
```
docker-compose up -d

docker-compose ps
```

- logs查看各容器的运行日志，'-f' 选项持续输出
- 后面加容器名字可以查看指定容器
```
docker-compose logs 

docker-compose logs madblog-api
```

- 停止全部容器
- 或者删除指定容器
```
docker-compose stop

docker-compose rm [container_name_or_id]
```

- 操作容器内部
- 如nginx，这样可以进入nginx内部的命令行
```
docker-compose exec nginx bash
```

- 容器保存
```
docker save mysql:8.0 redis:alpine my-elasticsearch-ik madblog-api:0.0.1 nginx -o madblog-docker.tar
```

- 容器加载
```
docker load -i madblog-docker.tar
```

