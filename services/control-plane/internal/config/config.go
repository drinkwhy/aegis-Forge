package config

import (
	"os"
	"strings"
)

type Config struct {
	Port           string
	DatabaseURL    string
	KafkaBrokers   []string
	Neo4jURI       string
	Neo4jUser      string
	Neo4jPassword  string
	Auth0Domain    string
	Auth0Audience  string
	VaultAddr      string
	VaultToken     string
	ClickHouseURL  string
	AegisForgeEnv  string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	brokersEnv := os.Getenv("KAFKA_BROKERS")
	var brokers []string
	if brokersEnv != "" {
		brokers = strings.Split(brokersEnv, ",")
	}

	return &Config{
		Port:          port,
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		KafkaBrokers:  brokers,
		Neo4jURI:      os.Getenv("NEO4J_URI"),
		Neo4jUser:     os.Getenv("NEO4J_USER"),
		Neo4jPassword: os.Getenv("NEO4J_PASSWORD"),
		Auth0Domain:   os.Getenv("AUTH0_DOMAIN"),
		Auth0Audience: os.Getenv("AUTH0_AUDIENCE"),
		VaultAddr:     os.Getenv("VAULT_ADDR"),
		VaultToken:    os.Getenv("VAULT_TOKEN"),
		ClickHouseURL: os.Getenv("CLICKHOUSE_URL"),
		AegisForgeEnv: os.Getenv("AEGIS_FORGE_ENV"),
	}
}
