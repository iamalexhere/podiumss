package models

import (
	"time"

	"gorm.io/gorm"
)

type Event struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Name        string         `json:"name" gorm:"not null"`
	Slug        string         `json:"slug" gorm:"uniqueIndex;not null"`
	Description string         `json:"description"`
	Status      string         `json:"status" gorm:"default:'draft'"` // draft, active, completed
	CreatedBy   uint           `json:"created_by"`
	Groups      []Group        `json:"groups,omitempty"`
	Games       []Game         `json:"games,omitempty"`
}

func (Event) TableName() string {
	return "events"
}
