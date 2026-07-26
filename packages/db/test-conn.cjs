const { Client } = require('pg');
require('dotenv').config({ path: '../../.env' });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log("Connected successfully!");
    await client.end();
  } catch (err) {
    console.error("Connection error:", err.message);
  }
}

testConnection();
