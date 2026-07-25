package campaign

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CampaignService struct {
	db *pgxpool.Pool
	// kafka producer
}

func NewCampaignService(db *pgxpool.Pool) *CampaignService {
	return &CampaignService{db: db}
}

func (s *CampaignService) Create(ctx context.Context, req *Campaign) (*Campaign, error) {
	// Stub implementation
	// - Validates RoE is active
	// - Publishes to Kafka topic campaign.created
	return req, nil
}

func (s *CampaignService) Get(ctx context.Context, id string) (*Campaign, error) {
	// Stub implementation
	return &Campaign{ID: id}, nil
}

func (s *CampaignService) List(ctx context.Context, workspaceID string) ([]*Campaign, error) {
	// Stub implementation
	return []*Campaign{}, nil
}

func (s *CampaignService) UpdateStatus(ctx context.Context, id string, status CampaignStatus) error {
	// Stub implementation
	return nil
}
