##### Build environment #####
FROM golang:1.18.10-alpine3.17 as builder

# 依存パッケージのインストール
RUN apk update

# Gin APIサーバーのビルド
COPY gin /gin
WORKDIR /gin
RUN go build main.go


##### Production environment #####
FROM node:16.19-alpine as releaser

# 依存パッケージのインストール
RUN apk update

# Gin APIサーバーのインストール
COPY --from=builder /gin /gin
CMD ["./main"]