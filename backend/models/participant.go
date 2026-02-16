package models

import (
	"time"

	"gorm.io/gorm"
)

type Participant struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	GroupID   uint           `json:"group_id" gorm:"not null;index"`
	Group     Group          `json:"group,omitempty" gorm:"foreignKey:GroupID"`
	Name      string         `json:"name" gorm:"not null"`
}

func (Participant) TableName() string {
	return "participants"
}
