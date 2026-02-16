package database

import (
	"github.com/scoresystem/backend/config"
	"github.com/scoresystem/backend/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() error {
	var err error
	DB, err = gorm.Open(sqlite.Open(config.AppConfig.DatabaseURL), &gorm.Config{})
	if err != nil {
		return err
	}

	return autoMigrate()
}

func autoMigrate() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.Event{},
		&models.Group{},
		&models.Participant{},
		&models.Game{},
		&models.Score{},
	)
}
