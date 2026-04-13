const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.post("/", async (req, res) => {
  try {
    const { student_id, course_id } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({ message: "student_id and course_id are required." });
    }

    if (!isValidObjectId(student_id) || !isValidObjectId(course_id)) {
      return res.status(400).json({ message: "Invalid student_id or course_id." });
    }

    const [studentExists, courseExists] = await Promise.all([
      Student.exists({ _id: student_id }),
      Course.exists({ _id: course_id })
    ]);

    if (!studentExists || !courseExists) {
      return res.status(404).json({ message: "Student or course not found." });
    }

    const enrollment = await Enrollment.create({ student_id, course_id });
    return res.status(201).json(enrollment);
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "This student is already assigned to this course." });
    }
    return res.status(400).json({ message: "Unable to assign student to course." });
  }
});

router.get("/", async (req, res) => {
  try {
    const enrollments = await Enrollment.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student_id",
          foreignField: "_id",
          as: "student"
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "course_id",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$student" },
      { $unwind: "$course" },
      {
        $project: {
          _id: 1,
          student_id: 1,
          course_id: 1,
          student_name: "$student.name",
          student_email: "$student.email",
          course_name: "$course.course_name",
          credits: "$course.credits"
        }
      },
      { $sort: { _id: -1 } }
    ]);

    return res.json(enrollments);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch enrollments." });
  }
});

module.exports = router;
