# Step 1: 使用官方 Node 镜像作为构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json / pnpm-lock.yaml / yarn.lock
COPY package*.json ./

# 安装依赖
RUN npm install
# 如果你用 pnpm 或 yarn，替换上面一行

# 复制整个项目
COPY . .

# 构建生产版本
RUN npm run build
# Vite 默认会生成 dist 文件夹

# -------------------------------
# Step 2: 使用轻量级 Nginx 镜像提供服务
FROM nginx:alpine

# 删除默认的 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/

# 将构建好的前端文件复制到 Nginx 的 html 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
