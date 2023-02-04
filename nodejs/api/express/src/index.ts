import express, { Application, Request, Response } from "express";
import { createClient } from "redis";
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 環境変数
const dbHost = process.env.REDIS_CONTAINER_IPV4; // DBコンテナIPv4
const dbPort = process.env.REDIS_CONTAINER_PORT; // DBコンテナポート番号
const apiHost = process.env.API_CONTAINER_IPV4; // APIコンテナIPv4
const apiPort = process.env.API_CONTAINER_PORT; // APIコンテナポート番号

// key-valueの追加
app.post("/redis", async (req: Request, res: Response) => {
  const body = req.body;
  if (!("key" in body) || !("value" in body)) {
    return res.status(500).send({
      message: "Bad Request",
    });
  }
  // Redisクライアントの作成
  if (dbHost === undefined || dbPort === undefined) {
    return res.status(500).send({
      message: "Internal Server Error",
    });
  }
  const url = "redis://" + dbHost + ":" + dbPort;
  console.log(url);
  const client = createClient({
    url: url,
  });
  client.on("error", (err) => {
    console.log("Redis Client Error", err);
    return res.status(500).send({
      message: "Internal Server Error",
    });
  });
  // Redis接続
  await client.connect();
  // key-valueの追加
  await client.set(body.key, body.value);
  // Redis接続終了
  await client.disconnect();
  // レスポンス
  return res.status(200).send({
    message: "OK",
  });
});

// 全keyの取得
app.get("/keys", async (req: Request, res: Response) => {
  // Redisクライアントの作成
  if (dbHost === undefined || dbPort === undefined) {
    return res.status(500).send({
      message: "Bad Request",
    });
  }
  const url = "redis://" + dbHost + ":" + dbPort;
  console.log(url);
  const client = createClient({
    url: url,
  });
  client.on("error", (err) => {
    console.log("Redis Client Error", err);
    return res.status(500).send({
      message: "Internal Server Error",
    });
  });
  // Redis接続
  await client.connect();
  // 全keyの取得
  const result = await client.keys("*");
  // Redis接続終了
  await client.disconnect();
  // レスポンス
  return res.status(200).send({
    message: result,
  });
});

// 指定したkeyの値の取得
app.get("/redis/:key", async (req: Request, res: Response) => {
  // Redisクライアントの作成
  if (dbHost === undefined || dbPort === undefined) {
    return res.status(500).send({
      message: "Bad Request",
    });
  }
  const url = "redis://" + dbHost + ":" + dbPort;
  console.log(url);
  const client = createClient({
    url: url,
  });
  client.on("error", (err) => {
    console.log("Redis Client Error", err);
    return res.status(500).send({
      message: "Internal Server Error",
    });
  });
  // Redis接続
  await client.connect();
  // key-valueの取得
  const key = req.params.key;
  const value = await client.get(key);
  // Redis接続終了
  await client.disconnect();
  // レスポンス
  return res.status(200).send({
    message: { key: value },
  });
});

// サーバーを起動する処理
try {
  app.listen(apiPort, () => {
    console.log("server running at: http://" + apiHost + ":" + apiPort);
  });
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
