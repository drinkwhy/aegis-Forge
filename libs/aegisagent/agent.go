package aegisagent

type Config struct {
	WorkspaceID     string
	APIKey          string
	VaultAddr       string
	ControlPlaneURL string
	MaxTurns        int
}

type Agent struct {
	cfg Config
}

func New(config Config) *Agent {
	if config.MaxTurns == 0 {
		config.MaxTurns = 50
	}
	return &Agent{
		cfg: config,
	}
}
