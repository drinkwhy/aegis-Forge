output "neo4j_endpoint" {
  description = "Neo4j HTTP endpoint"
  value       = "http://${aws_instance.neo4j.private_ip}:7474"
}

output "neo4j_bolt_endpoint" {
  description = "Neo4j Bolt endpoint"
  value       = "bolt://${aws_instance.neo4j.private_ip}:7687"
}

output "neo4j_instance_id" {
  description = "Neo4j EC2 instance ID"
  value       = aws_instance.neo4j.id
}
