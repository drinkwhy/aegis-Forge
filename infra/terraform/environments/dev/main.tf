module "networking" {
  source             = "../../modules/networking"
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  az_count           = 3
  single_nat_gateway = true
}

module "secrets" {
  source                = "../../modules/secrets"
  environment           = var.environment
  eks_cluster_name      = module.eks.cluster_name
  eks_oidc_provider_arn = module.eks.oidc_provider_arn
}

module "storage" {
  source      = "../../modules/storage"
  environment = var.environment
  kms_key_arn = module.secrets.kms_key_arn
}

module "eks" {
  source             = "../../modules/eks"
  environment        = var.environment
  cluster_name       = "aegis-forge-${var.environment}-cluster"
  kubernetes_version = "1.30"
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  node_instance_type = "t3.large"
}

module "data" {
  source             = "../../modules/data"
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  db_instance_class  = "db.t3.medium"
  db_name            = "aegisforge"
  db_username        = "postgres"
  kms_key_id         = module.secrets.kms_key_arn
}

module "graph" {
  source             = "../../modules/graph"
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  kms_key_id         = module.secrets.kms_key_id
  instance_type      = "t3.large"
}

module "telemetry" {
  source             = "../../modules/telemetry"
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  kms_key_id         = module.secrets.kms_key_id
  instance_type      = "t3.xlarge"
}
