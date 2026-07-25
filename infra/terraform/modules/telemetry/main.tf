data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_security_group" "clickhouse" {
  name        = "aegis-forge-${var.environment}-clickhouse-sg"
  description = "Security group for ClickHouse"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 8123
    to_port     = 8123
    protocol    = "tcp"
    cidr_blocks     = ["10.0.0.0/16"]
  }

  ingress {
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks     = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_instance" "clickhouse" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  subnet_id     = var.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.clickhouse.id]

  root_block_device {
    volume_size = 500
    volume_type = "gp3"
    encrypted   = true
    kms_key_id  = var.kms_key_id
  }

  user_data = <<-EOF
              #!/bin/bash
              sudo yum install -y yum-utils
              sudo yum-config-manager --add-repo https://packages.clickhouse.com/rpm/clickhouse.repo
              sudo yum install -y clickhouse-server clickhouse-client
              sudo systemctl enable clickhouse-server
              sudo systemctl start clickhouse-server
              EOF

  tags = {
    Name        = "aegis-forge-${var.environment}-clickhouse"
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
