import * as IORedis from "ioredis";

// Publisher/Subscriberでそれぞれ通信を確立
const redisConfig = {
  port: 6379, // Redis port
  host: "localhost", // Redis host
  username: "default", // needs Redis >= 6
  password: undefined,
  db: 0, // Defaults to 0
};
const pubRedis = new IORedis.Redis(redisConfig);
const subRedis = new IORedis.Redis(redisConfig);

// 一定時間ごとにメッセージを送信する
setInterval(() => {
  const message = { message: Math.random() };
  const channel = `my-channel-${1 + Math.round(Math.random())}`;
  pubRedis.publish(channel, JSON.stringify(message));
  console.log("Published %s to %s", message, channel);
}, 5000);

// 指定したチャンネルのsubscribeを実施する
subRedis.subscribe("my-channel-1", "my-channel-2", (err, count) => {
  if (err) {
    console.error("Failed to subscribe: %s", err.message);
  } else {
    console.log(
      "Subscribed successfully! This client is currently subscribed to " +
        count +
        "channels."
    );
  }
});

// 設定したチャネルからsubscribeメッセージを受信したらコンソールに出力する
subRedis.on("message", (channel, message) => {
  console.log(`Received ${message} from ${channel}`);
});
