const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const studentRoutes = require("./routes/students");
const courseRoutes = require("./routes/courses");
const enrollmentRoutes = require("./routes/enrollments");
const resultRoutes = require("./routes/results");
const uiRoutes = require("./routes/ui");

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;
let dbReady = false;
let dbPromise = null;

async function connectToDatabase() {
  if (dbReady) {
    return;
  }

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment variables.");
  }

  if (!dbPromise) {
    dbPromise = mongoose
      .connect(mongoUri)
      .then(() => {
        dbReady = true;
        console.log("MongoDB connected successfully.");
      })
      .catch((error) => {
        dbPromise = null;
        throw error;
      });
  }

  await dbPromise;
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

if (process.env.VERCEL === "1") {
  app.use(async (req, res, next) => {
    try {
      await connectToDatabase();
      next();
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error.message);
      res.status(500).json({ message: "Database connection failed." });
    }
  });
}

app.use("/students", studentRoutes);
app.use("/courses", courseRoutes);
app.use("/enrollments", enrollmentRoutes);
app.use("/results", resultRoutes);
app.use("/", uiRoutes);

app.use((err, req, res, next) => {
  console.error("Unexpected error:", err);
  res.status(500).json({ message: "Internal server error" });
});

async function startServer() {
  try {
    await connectToDatabase();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

if (process.env.VERCEL !== "1") {
  startServer();
}

module.exports = app;
