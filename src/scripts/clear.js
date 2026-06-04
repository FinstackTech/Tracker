const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/tracker_db';

async function clear() {
  console.log("Connecting to database to purge mock data:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Database connected successfully.");

  const db = mongoose.connection.db;
  const colList = await db.listCollections().toArray();
  
  for (const col of colList) {
    // Avoid clearing system collections if any
    if (col.name.startsWith('system.')) continue;
    console.log(`Purging collection: ${col.name}`);
    await db.collection(col.name).deleteMany({});
  }

  console.log("All collections have been successfully cleared!");
  process.exit(0);
}

clear().catch(err => {
  console.error("Purge failed:", err);
  process.exit(1);
});
