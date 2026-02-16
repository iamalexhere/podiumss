package utils

import (
	"github.com/gin-gonic/gin"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func SuccessResponse(c *gin.Context, status int, data interface{}) {
	c.JSON(status, Response{
		Success: true,
		Data:    data,
	})
}

func ErrorResponse(c *gin.Context, status int, message string) {
	c.JSON(status, Response{
		Success: false,
		Error:   message,
	})
}

func BadRequest(c *gin.Context, message string) {
	ErrorResponse(c, 400, message)
}

func Unauthorized(c *gin.Context, message string) {
	ErrorResponse(c, 401, message)
}

func Forbidden(c *gin.Context, message string) {
	ErrorResponse(c, 403, message)
}

func NotFound(c *gin.Context, message string) {
	ErrorResponse(c, 404, message)
}

func InternalError(c *gin.Context, message string) {
	ErrorResponse(c, 500, message)
}
