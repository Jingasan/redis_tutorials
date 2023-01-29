package main

// Ginとgo-redisのimport
import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// Redisサーバーとの接続を確立する関数
func connectRedis() *redis.Client {
	redisContainerIPv4 := os.Getenv("REDIS_CONTAINER_IPV4") // RedisコンテナIPv4
	redisContainerPort := os.Getenv("REDIS_CONTAINER_PORT") // Redisコンテナポート番号
	redisURL := redisContainerIPv4 + ":" + redisContainerPort
	return redis.NewClient(&redis.Options{
		Addr:     redisURL, // Redis URL
		Password: "",       // no password set
		DB:       0,        // use default DB
	})
}

// POSTメソッド用関数：key-valueの追加
func postFunction(ctx *gin.Context) {
	// リクエストボディのデータ型
	type RequestBodyDataType struct {
		Value string `json:"value"`
	}
	var reqJSON RequestBodyDataType
	// リクエストボディが規定の型を満たさない場合のエラー処理
	if err := ctx.ShouldBindJSON(&reqJSON); err != nil {
		ctx.JSON(http.StatusBadRequest,
			gin.H{"error": err.Error()})
		return
	}
	// URLパラメータの取得
	key := ctx.Param("key")
	// Redisサーバーとの接続を確立
	redisClient := connectRedis()
	// key-valueの追加
	err := redisClient.Set(ctx, key, reqJSON.Value, 0).Err()
	if err != nil {
		// レスポンス
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// レスポンス
	ctx.JSON(http.StatusOK, "OK")
}

// GETメソッド用関数：key-valueの取得
func getFunction(ctx *gin.Context) {
	// URLパラメータの取得
	key := ctx.Param("key")
	// Redisサーバーとの接続を確立
	redisClient := connectRedis()
	// key-valueの取得
	value, err := redisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		// レスポンス
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	} else if err != nil {
		// レスポンス
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// レスポンス
	ctx.JSON(http.StatusOK, gin.H{key: value})
}

// DELETEメソッド用関数：key-valueの削除
func deleteFunction(ctx *gin.Context) {
	// URLパラメータの取得
	key := ctx.Param("key")
	// Redisサーバーとの接続を確立
	redisClient := connectRedis()
	// key-valueの削除
	value, err := redisClient.Del(ctx, key).Result()
	if err == redis.Nil {
		// レスポンス
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	} else if err != nil {
		// レスポンス
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// レスポンス
	ctx.JSON(http.StatusOK, value)
}

func main() {
	// GinをReleaseモードに設定
	gin.SetMode(gin.ReleaseMode)
	// Engineインスタンスの作成
	engine := gin.Default()
	// POSTメソッド：：key-valueの追加
	engine.POST("/:key", postFunction)
	// GETメソッド：key-valueの取得
	engine.GET("/:key", getFunction)
	// PUTメソッド：key-valueの更新
	engine.PUT("/:key", postFunction)
	// DELETEメソッド：key-valueの削除
	engine.DELETE("/:key", deleteFunction)
	// ポート番号を指定
	apiHost := os.Getenv("API_CONTAINER_IPV4") // APIコンテナIPv4
	apiPort := os.Getenv("API_CONTAINER_PORT") // APIコンテナポート番号
	engine.Run(":" + apiPort)
	log.Print("server running at: http://" + apiHost + ":" + apiPort)
}
