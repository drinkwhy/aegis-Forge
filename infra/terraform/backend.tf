terraform {
  backend "s3" {
    bucket         = "aegis-forge-terraform-state"
    key            = "aegis-forge/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "aegis-forge-terraform-locks"
    encrypt        = true
  }
}
