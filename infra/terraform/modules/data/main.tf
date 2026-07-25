resource "aws_security_group" "rds" {
  name        = "aegis-forge-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    cidr_blocks     = ["10.0.0.0/16"]
  }

  tags = {
    Name        = "aegis-forge-${var.environment}-rds-sg"
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "aegis-forge-${var.environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_db_instance" "main" {
  identifier             = "aegis-forge-${var.environment}-db"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  db_name                = var.db_name
  username               = var.db_username
  password               = "ChangeMe123!"
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  multi_az               = var.environment == "prod" ? true : false
  storage_encrypted      = true
  kms_key_id             = var.kms_key_id
  skip_final_snapshot    = true

  tags = {
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "msk" {
  name        = "aegis-forge-${var.environment}-msk-sg"
  description = "Security group for MSK Kafka"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 9092
    to_port         = 9094
    protocol        = "tcp"
    cidr_blocks     = ["10.0.0.0/16"]
  }

  tags = {
    Name        = "aegis-forge-${var.environment}-msk-sg"
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_msk_cluster" "main" {
  cluster_name           = "aegis-forge-${var.environment}-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = var.environment == "prod" ? 3 : 2

  broker_node_group_info {
    instance_type   = var.environment == "prod" ? "kafka.m5.large" : "kafka.t3.small"
    ebs_volume_size = 100
    client_subnets  = slice(var.private_subnet_ids, 0, var.environment == "prod" ? 3 : 2)
    security_groups = [aws_security_group.msk.id]
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = var.kms_key_id
  }

  tags = {
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
