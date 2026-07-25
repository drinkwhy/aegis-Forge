output "artifact_bucket" {
  description = "Artifacts S3 bucket name"
  value       = aws_s3_bucket.artifacts.bucket
}

output "corpus_bucket" {
  description = "Corpus S3 bucket name"
  value       = aws_s3_bucket.corpus.bucket
}

output "reports_bucket" {
  description = "Reports S3 bucket name"
  value       = aws_s3_bucket.reports.bucket
}

output "ecr_repos" {
  description = "ECR repository URLs"
  value       = { for k, v in aws_ecr_repository.repos : k => v.repository_url }
}
