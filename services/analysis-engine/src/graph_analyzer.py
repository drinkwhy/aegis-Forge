from neo4j import AsyncGraphDatabase
from .config import settings

class GraphAnalyzer:
    def __init__(self):
        self.driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password)
        )
    
    async def get_blast_radius(self, agent_id: str) -> list[dict]:
        query = """
        MATCH path = (a:AI_Agent {id: $agent_id})-[:USES_TOOL|READS_FROM|HAS_ACCESS*1..5]->(target)
        WHERE target:Database OR target:API_Endpoint OR target:VectorDB OR target:MCP_Server
        RETURN DISTINCT 
            target.id as id,
            labels(target)[0] as type,
            target.name as name,
            target.sensitivity as sensitivity,
            target.contains_pii as contains_pii,
            length(path) as hop_count
        ORDER BY hop_count ASC
        """
        async with self.driver.session() as session:
            result = await session.run(query, agent_id=agent_id)
            return [dict(record) async for record in result]
    
    async def get_attack_path(self, agent_id: str, target_id: str) -> list[dict]:
        query = """
        MATCH path = shortestPath(
            (a:AI_Agent {id: $agent_id})-[:USES_TOOL|READS_FROM|HAS_ACCESS*1..10]->(t {id: $target_id})
        )
        RETURN [n in nodes(path) | {id: n.id, type: labels(n)[0], name: n.name}] as nodes,
               [r in relationships(path) | type(r)] as relationships
        """
        async with self.driver.session() as session:
            result = await session.run(query, agent_id=agent_id, target_id=target_id)
            record = await result.single()
            return dict(record) if record else {}
