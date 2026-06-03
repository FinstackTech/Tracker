const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/tracker_db';

async function clear() {
  console.log("Connecting to database to purge mock data:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Database connected successfully.");

  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    console.log(`Purging collection: ${key}`);
    await collections[key].deleteMany({});
  }

  console.log("All collections have been successfully cleared!");
  process.exit(0);
}

clear().catch(err => {
  console.error("Purge failed:", err);
  process.exit(1);
});
