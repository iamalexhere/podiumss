package utils

import (
	"regexp"
	"strings"

	"github.com/google/uuid"
)

func GenerateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = regexp.MustCompile(`[^a-z0-9\s-]`).ReplaceAllString(slug, "")
	slug = regexp.MustCompile(`[\s_]+`).ReplaceAllString(slug, "-")
	slug = regexp.MustCompile(`-+`).ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")

	if slug == "" {
		slug = "event"
	}

	slug = slug + "-" + uuid.New().String()[:8]

	return slug
}
