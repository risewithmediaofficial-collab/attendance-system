import { MongoClient } from "mongodb";

const uri = "mongodb+srv://risewithmediaofficial_db_user:P277DQBijb68REH0@cluster0.zokphws.mongodb.net/member-tracker?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully!");
    const databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  } finally {
    await client.close();
  }
}

testConnection();