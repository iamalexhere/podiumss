package config

import (
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DatabaseURL  string
	JWTSecret    string
	FrontendURL  string
	FrontendDist string
}

var AppConfig Config

func Load() {
	godotenv.Load()

	execPath, _ := os.Executable()
	execDir := filepath.Dir(execPath)
	defaultDist := filepath.Join(execDir, "dist")

	AppConfig = Config{
		Port:         getEnv("PORT", "8080"),
		DatabaseURL:  getEnv("DATABASE_URL", "score.db"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		FrontendURL:  getEnv("FRONTEND_URL", "http://localhost:3000"),
		FrontendDist: getEnv("FRONTEND_DIST", defaultDist),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
