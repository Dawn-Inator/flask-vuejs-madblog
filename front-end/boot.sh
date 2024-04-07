#!/bin/bash

cp -r /app/dist/* /usr/share/nginx/html/

# 启动 Nginx
exec nginx -g 'daemon off;'
