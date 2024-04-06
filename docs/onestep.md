<br>

# Docker一键部署

- 克隆仓库
```
yum install -y git

git clone https://github.com/Dawn-Inator/flask-vuejs-madblog.git -b Docker
```

- 编辑变量
- 将其中的中文改为你的配置
- 如：MAIL_USERNAME='<服务器的qq邮箱>' --> MAIL_USERNAME='123456@qq.com'
```
cd flask-vuejs-madblog

vim docker-compose.yml
```

- 启动
```
chmod +x onestep.sh&&./onestep.sh
```

- 以后启动和关闭项目用以下命令
```
docker-compose up -d

docker-compose stop
```

<br><br>

# 网站配置和SSL申请

## NPM and SSL Configure
***Nginx Proxy Manager(NPM)可以代理应用并管理域名和网站流量，也可以一步申请SSL证书，使用的是Let's encryt的证书*** 

- 当docker容器跑起来后， 连接到81端口即可访问管理界面。访问：http://你的服务器IP:81
- 第一次登录的默认管理员账户：
```
Email:    admin@example.com
Password: changeme
```

- 第一次登陆后，你会立刻被要求修改登录密码和一些重要信息。
- 然后进行应用代理，添加ssl证书
```
代理端口如下:

Nginx: 8080

madblog-api: 5000
```

<br><br>

# 防火墙配置与部署错误处理

## FireWall Configure and Chrome Error

- 接下来记得配置防火墙
- 具体详情点击[这里](firewall.md)

---
