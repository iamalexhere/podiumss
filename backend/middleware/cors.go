package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/config"
)

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		frontendURL := config.AppConfig.FrontendURL

		c.Header("Access-Control-Allow-Origin", frontendURL)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
