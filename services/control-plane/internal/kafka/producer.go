package kafka

import (
	"context"
	"encoding/json"

	kafka "github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafka.Writer
}

func NewProducer(brokers []string) *Producer {
	if len(brokers) == 0 {
		return &Producer{}
	}
	w := &kafka.Writer{
		Addr:     kafka.TCP(brokers...),
		Balancer: &kafka.LeastBytes{},
	}
	return &Producer{writer: w}
}

func (p *Producer) Publish(ctx context.Context, topic, key string, value interface{}) error {
	if p.writer == nil {
		return nil // skip if not configured
	}

	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}

	msg := kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: bytes,
	}

	return p.writer.WriteMessages(ctx, msg)
}

func (p *Producer) Close() error {
	if p.writer != nil {
		return p.writer.Close()
	}
	return nil
}
