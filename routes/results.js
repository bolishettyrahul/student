const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Result = require("../models/Result");

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.post("/", async (req, res) => {
  const { student_id, course_id, marks } = req.body;

  if (!student_id || !course_id || marks === undefined) {
    return res.status(400).json({ message: "student_id, course_id, and marks are required." });
  }

  if (!isValidObjectId(student_id) || !isValidObjectId(course_id)) {
    return res.status(400).json({ message: "Invalid student_id or course_id." });
  }

  const marksNumber = Number(marks);
  if (Number.isNaN(marksNumber)) {
    return res.status(400).json({ message: "marks must be numeric." });
  }

  const [studentExists, courseExists, isEnrolled] = await Promise.all([
    Student.exists({ _id: student_id }),
    Course.exists({ _id: course_id }),
    Enrollment.exists({ student_id, course_id })
  ]);

  if (!studentExists || !courseExists) {
    return res.status(404).json({ message: "Student or course not found." });
  }

  if (!isEnrolled) {
    return res.status(400).json({ message: "Student must be enrolled in the course before entering marks." });
  }

  const result = await Result.findOneAndUpdate(
    { student_id, course_id },
    { $set: { marks: marksNumber } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(result);
});

router.get("/", async (req, res) => {
  const { student, course } = req.query;

  if (student && !isValidObjectId(student)) {
    return res.status(400).json({ message: "Invalid student query id." });
  }
  if (course && !isValidObjectId(course)) {
    return res.status(400).json({ message: "Invalid course query id." });
  }

  try {
    const matchObj = {};
    if (student) matchObj.student_id = new mongoose.Types.ObjectId(student);
    if (course) matchObj.course_id = new mongoose.Types.ObjectId(course);

    const pipeline = [
      ...(Object.keys(matchObj).length > 0 ? [{ $match: matchObj }] : []),
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
          marks: 1,
          student_name: "$student.name",
          course_name: "$course.course_name"
        }
      },
      { $sort: { _id: -1 } }
    ];

    const results = await Result.aggregate(pipeline);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch results." });
  }
});

module.exports = router;
