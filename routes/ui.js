const express = require("express");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Result = require("../models/Result");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [students, courses, enrollments, results] = await Promise.all([
      Student.find().sort({ createdAt: -1 }),
      Course.find().sort({ createdAt: -1 }),
      Enrollment.find()
        .populate("student_id", "name email")
        .populate("course_id", "course_name credits")
        .sort({ createdAt: -1 }),
      Result.find()
        .populate("student_id", "name")
        .populate("course_id", "course_name")
        .sort({ createdAt: -1 })
    ]);

    res.render("index", { students, courses, enrollments, results });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Failed to load dashboard. Please check the server logs.");
  }
});

module.exports = router;
