const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DATABASE_NAME = "SMARTMOVE";

app.use(cors());
app.use(express.json());

const client = new MongoClient(MONGO_URL);

async function startServer() {
    try {
        await client.connect();

        const database = client.db(DATABASE_NAME);

        console.log("MongoDB connected successfully");

        app.get("/api/reviews", async (req, res) => {
            try {
                const reviews = await database
                    .collection("reviews")
                    .find({})
                    .toArray();

                res.json(reviews);
            } catch (error) {
                console.error("Error loading reviews:", error);
                res.status(500).json({
                    error: "Unable to load reviews"
                });
            }
        });

        app.get("/api/announcements", async (req, res) => {
            try {
                const announcements = await database
                    .collection("announcements")
                    .find({})
                    .toArray();

                res.json(announcements);
            } catch (error) {
                console.error("Error loading announcements:", error);
                res.status(500).json({
                    error: "Unable to load announcements"
                });
            }
        });

        app.get("/api/vehicle-media", async (req, res) => {
            try {
                const media = await database
                    .collection("vehicle_media")
                    .find({})
                    .toArray();

                res.json(media);
            } catch (error) {
                console.error("Error loading vehicle media:", error);
                res.status(500).json({
                    error: "Unable to load vehicle media"
                });
            }
        });

        app.get("/api/trip-media", async (req, res) => {
            try {
                const media = await database
                    .collection("trip_media")
                    .find({})
                    .toArray();

                res.json(media);
            } catch (error) {
                console.error("Error loading trip media:", error);
                res.status(500).json({
                    error: "Unable to load trip media"
                });
            }
        });

        app.get("/", (req, res) => {
            res.json({
                message: "SmartMove API is running"
            });
        });

        app.listen(PORT, () => {
            console.log(`SmartMove backend running on port ${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

startServer();