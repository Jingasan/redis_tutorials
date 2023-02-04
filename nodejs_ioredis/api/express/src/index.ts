import express, { Application, Request, Response } from "express";
import * as IORedis from "ioredis";
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redisクライアント(APIコールの度に接続確立しないためにグローバルで作成)
let redisClient: IORedis.Redis;

// 環境変数
const dbHost = process.env.REDIS_CONTAINER_IPV4; // DBコンテナIPv4
const dbPort = process.env.REDIS_CONTAINER_PORT; // DBコンテナポート番号
const apiHost = process.env.API_CONTAINER_IPV4; // APIコンテナIPv4
const apiPort = process.env.API_CONTAINER_PORT; // APIコンテナポート番号

// key-valueの追加
app.post("/key-value/:key", async (req: Request, res: Response) => {
  try {
    // URLパラメータとBodyからのkey-value値の取得
    const key = req.params.key;
    const body = req.body;
    if (!("value" in body)) {
      return res.status(400).json("Bad Request");
    }
    // key-valueの追加
    await redisClient.set(key, JSON.stringify(body.value));
    // レスポンス
    return res.status(200).json("OK");
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// 指定したkeyの値の取得
app.get("/key-value/:key", async (req: Request, res: Response) => {
  try {
    // 指定したkeyの値の取得
    const key = req.params.key;
    const value = await redisClient.get(key);
    if (value != null) {
      // レスポンス
      let json: any = {};
      json[key] = JSON.parse(value);
      return res.status(200).json(json);
    }
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// 指定したkeyの削除
app.delete("/key-value/:key", async (req: Request, res: Response) => {
  try {
    // 指定したkeyの削除
    const key = req.params.key;
    await redisClient.del(key);
    // レスポンス
    return res.status(200).json("OK");
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// Pipelineによるkey-valueの一括追加
app.post("/pipeline", async (req: Request, res: Response) => {
  try {
    // Bodyからのkey-value値の配列を取得
    const body = req.body;
    // Pipelineによるkey-valueの一括追加
    const pipeline = redisClient.pipeline();
    body.forEach((param: any) => {
      pipeline.set(param.key, param.value);
    });
    await pipeline.exec();
    // レスポンス
    return res.status(200).json("OK");
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// Transactionによるkey-valueの一括追加
app.post("/transaction", async (req: Request, res: Response) => {
  try {
    // Bodyからのkey-value値の配列を取得
    const body = req.body;
    // Transactionによるkey-valueの一括追加(Transaction処理では途中で失敗した場合、元の状態に戻る)
    const transaction = redisClient.multi();
    body.forEach((param: any) => {
      transaction.set(param.key, param.value);
    });
    await transaction.exec();
    // レスポンス
    return res.status(200).json("OK");
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// 全keyの取得
app.get("/keys", async (_: Request, res: Response) => {
  try {
    // 全keyの取得
    const result = await redisClient.keys("*");
    // レスポンス
    return res.status(200).json(result);
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// 全キーの削除
app.delete("/keys", async (_: Request, res: Response) => {
  try {
    await redisClient.flushall();
    // レスポンス
    return res.status(200).json("OK");
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// List型の値の追加
app.post("/list/:key", async (req: Request, res: Response) => {
  try {
    // URLパラメータとBodyからのkey-value値の取得
    const key = req.params.key;
    const body = req.body;
    if (!("value" in body) || !Array.isArray(body.value)) {
      return res.status(400).json("Bad Request");
    }
    // key-valueの追加
    await redisClient.lpush(key, body.value);
    // レスポンス
    return res.status(200).json("OK");
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// List型の値の取得
app.get("/list/:key", async (req: Request, res: Response) => {
  try {
    // List型の値の取得
    const key = req.params.key;
    const all = await redisClient.lrange(key, 0, -1);
    // レスポンス
    return res.status(200).json(all);
  } catch (err) {
    // レスポンス
    return res.status(500).json(err);
  }
});

// Redisとの接続処理
if (dbHost === undefined || dbPort === undefined) {
  console.error("Host or port is none.");
  process.exit();
}
try {
  redisClient = new IORedis.Redis({
    port: parseInt(dbPort), // Redis port
    host: dbHost, // Redis host
    username: "default", // needs Redis >= 6
    password: undefined,
    db: 0, // Defaults to 0
  });
  console.log("Connect to Redis: http://" + dbHost + ":" + dbPort);
} catch (err) {
  console.error("Connect to Redis: http://" + dbHost + ":" + dbPort);
}

// APIサーバーの起動処理
try {
  // APIサーバー起動
  app.listen(apiPort, () => {
    console.log("API server: http://" + apiHost + ":" + apiPort);
  });
} catch (e) {
  if (e instanceof Error) {
    console.error(e.message);
  }
}
