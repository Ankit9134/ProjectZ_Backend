// require("dotenv").config();
// const fs = require("fs");
// const { MongoClient } = require("mongodb");

// const url = "mongodb+srv://techolcademy:m32gdIOIjbETl5q2@cluster0.iuwuq.mongodb.net/project-z" || "your-mongo-uri-here";
// const dbName = "project-z";
// const collectionName = "firms";
// const filePath = "./final_with_latlong.json";

// async function uploadData() {
//   if (!fs.existsSync(filePath)) {
//     console.error(`File not found: ${filePath}`);
//     return;
//   }

//   const client = new MongoClient(url);

//   try {
//     await client.connect();
//     console.log("Connected to MongoDB");

//     const db = client.db(dbName);
//     const collection = db.collection(collectionName);
//     const fileContent = fs.readFileSync(filePath, "utf8");
//     const data = JSON.parse(fileContent);

//     const operations = data.map((record) => {
//       return {
//         updateOne: {
//           filter: { "restaurantInfo.name": record.restaurantInfo.name }, // Match based on a unique field
//           update: { $set: record }, // Update with the new data
//           upsert: true, // Insert if no match is found
//         },
//       };
//     });

//     const result = await collection.bulkWrite(operations);
//     console.log(
//       `Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Inserted: ${result.upsertedCount}`
//     );
//   } catch (error) {
//     console.error("Error uploading data:", error);
//   } finally {
//     await client.close();
//     console.log("Connection closed");
//   }
// }

// uploadData();
