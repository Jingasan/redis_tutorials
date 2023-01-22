##### Build environment #####
FROM node:16.19-alpine as builder

# 依存パッケージのインストール
RUN apk update && \
    apk add mysql-client

# Express APIサーバーのビルド
COPY express /express
WORKDIR /express
RUN npm install
RUN npm run build


##### Production environment #####
FROM node:16.19-alpine as releaser

# 依存パッケージのインストール
RUN apk update && \
    apk add mysql-client

# Express APIサーバーのインストール
COPY --from=builder /express /express
CMD ["npm", "start"]