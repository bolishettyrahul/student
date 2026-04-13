const express = require("express");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Result = require("../models/Result");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { course_name, credits } = req.body;

    if (!course_name || credits === undefined) {
      return res.status(400).json({ message: "course_name and credits are required." });
    }

    const creditsNumber = Number(credits);
    if (Number.isNaN(creditsNumber) || creditsNumber < 1) {
      return res.status(400).json({ message: "credits must be a positive number." });
    }

    const course = await Course.create({
      course_name,
      credits: creditsNumber
    });

    return res.status(201).json(course);
  } catch (error) {
    return res.status(400).json({ message: "Unable to create course." });
  }
});

router.get("/", async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.json(courses);
});

router.delete("/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const deletedCourse = await Course.findByIdAndDelete(courseId);
    
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Cascade delete enrollments and results
    await Enrollment.deleteMany({ course_id: courseId });
    await Result.deleteMany({ course_id: courseId });

    return res.json({ message: "Course and associated records deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting course." });
  }
});

module.exports = router;
