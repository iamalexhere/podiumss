package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/scoresystem/backend/config"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/models"
	"github.com/scoresystem/backend/utils"
)

func main() {
	config.Load()

	if err := database.Connect(); err != nil {
		fmt.Printf("Failed to connect to database: %v\n", err)
		os.Exit(1)
	}

	email := getEnvOrPrompt("SEED_EMAIL", "Enter admin email: ")
	password := getEnvOrPrompt("SEED_PASSWORD", "Enter admin password: ")
	name := getEnvOrPrompt("SEED_NAME", "Enter admin name (optional): ")

	var existingUser models.User
	result := database.DB.Where("email = ?", email).First(&existingUser)
	if result.Error == nil {
		fmt.Printf("User with email %s already exists\n", email)
		os.Exit(0)
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		os.Exit(1)
	}

	user := models.User{
		Email:    email,
		Password: hashedPassword,
		Name:     name,
	}

	if result := database.DB.Create(&user); result.Error != nil {
		fmt.Printf("Failed to create user: %v\n", result.Error)
		os.Exit(1)
	}

	fmt.Printf("\nAdmin user created successfully!\n")
	fmt.Printf("Email: %s\n", user.Email)
	fmt.Printf("ID: %d\n", user.ID)
}

func getEnvOrPrompt(envKey, prompt string) string {
	if value := os.Getenv(envKey); value != "" {
		return value
	}

	reader := bufio.NewReader(os.Stdin)
	fmt.Print(prompt)
	input, _ := reader.ReadString('\n')
	return strings.TrimSpace(input)
}
