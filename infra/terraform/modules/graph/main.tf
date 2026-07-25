data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_security_group" "neo4j" {
  name        = "aegis-forge-${var.environment}-neo4j-sg"
  description = "Security group for Neo4j"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 7474
    to_port     = 7474
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  ingress {
    from_port   = 7687
    to_port     = 7687
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
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

resource "aws_instance" "neo4j" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  subnet_id     = var.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.neo4j.id]

  root_block_device {
    volume_size           = 100
    volume_type           = "gp3"
    encrypted             = true
    kms_key_id            = var.kms_key_id
  }

  user_data = <<-EOF
              #!/bin/bash
              sudo rpm --import https://debian.neo4j.com/neotechnology.gpg.key
              sudo cat << 'YUM' > /etc/yum.repos.d/neo4j.repo
              [neo4j]
              name=Neo4j RPM Repository
              baseurl=https://yum.neo4j.com/stable/5
              enabled=1
              gpgcheck=1
              YUM
              sudo yum install -y neo4j
              sudo systemctl enable neo4j
              sudo systemctl start neo4j
              EOF

  tags = {
    Name        = "aegis-forge-${var.environment}-neo4j"
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_eip" "neo4j" {
  instance = aws_instance.neo4j.id
  domain   = "vpc"

  tags = {
    Name        = "aegis-forge-${var.environment}-neo4j-eip"
    Project     = "aegis-forge"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
