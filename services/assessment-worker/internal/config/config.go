package config

import "os"

type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
	CorpusPath  string
	WorkerID    string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8010"
	}
	corpusPath := os.Getenv("CORPUS_PATH")
	if corpusPath == "" {
		corpusPath = "../../attack-corpus"
	}
	workerID := os.Getenv("WORKER_ID")
	if workerID == "" {
		workerID = "worker-" + os.Getenv("HOSTNAME")
	}
	return &Config{
		Port:        port,
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    os.Getenv("REDIS_URL"),
		CorpusPath:  corpusPath,
		WorkerID:    workerID,
	}
}
