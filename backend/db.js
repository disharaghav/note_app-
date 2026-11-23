const mongoose = require("mongoose");

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const memoryUsers = [];
let dbReady = false;

const mongoURL = (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.mongourl ||
    "mongodb://127.0.0.1:27017/notesapp"
).trim().replace(/^['"]|['"]$/g, "");

const connectToDatabase = async () => {
    try {
        await mongoose.connect(mongoURL, {
            serverSelectionTimeoutMS: 5000,
        });
        dbReady = true;
        console.log("DB Connected");
        return true;
    } catch (error) {
        dbReady = false;
        console.log("Mongo connection failed. Using in-memory fallback.");
        return false;
    }
};

module.exports = { connection: mongoose.connection, connectToDatabase, memoryUsers, dbReady, mongoURL };
