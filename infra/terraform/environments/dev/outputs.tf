output "vpc_id" {
  value = module.networking.vpc_id
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "db_endpoint" {
  value = module.data.db_endpoint
}

output "kafka_brokers" {
  value = module.data.kafka_bootstrap_brokers
}

output "neo4j_endpoint" {
  value = module.graph.neo4j_endpoint
}

output "clickhouse_endpoint" {
  value = module.telemetry.clickhouse_endpoint
}
