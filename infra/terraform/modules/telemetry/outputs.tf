output "clickhouse_endpoint" {
  description = "ClickHouse HTTP endpoint"
  value       = "http://${aws_instance.clickhouse.private_ip}:8123"
}

output "clickhouse_instance_id" {
  description = "ClickHouse EC2 instance ID"
  value       = aws_instance.clickhouse.id
}
