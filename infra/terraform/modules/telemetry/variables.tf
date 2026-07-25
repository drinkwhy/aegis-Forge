variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs"
}

variable "kms_key_id" {
  type        = string
  description = "KMS key ID for EBS encryption"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type for ClickHouse"
}
