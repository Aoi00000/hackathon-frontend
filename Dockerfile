# ===== GCP Cloud Run 用フロントエンド Dockerfile =====
# 1段目: Reactアプリをビルドする。
FROM node:22-bookworm AS builder

WORKDIR /app

# 依存関係を先に入れて、ビルドキャッシュを効かせる。
COPY package.json ./
RUN npm install

# フロントエンドのソースコードをコピー。
COPY . .

# Viteはビルド時に VITE_ で始まる環境変数を埋め込みます。
# Cloud Runに載せる場合は、ビルド時に VITE_API_BASE_URL を渡してください。
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# 静的ファイルを dist/ に生成。
RUN npm run build

# 2段目: nginxで静的ファイルを配信する。
FROM nginx:1.27-alpine

# Cloud Runはデフォルトで8080番ポートを期待するため、nginxも8080で待ち受けます。
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ビルド済みの静的ファイルをnginxの公開ディレクトリにコピー。
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
