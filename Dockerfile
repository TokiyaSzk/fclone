FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# 将构建好的静态文件复制到 nginx 的默认静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html
# 复制自定义 nginx 配置以支持前端路由（React Router 单页应用）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
