const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Enrollment = require("../models/Enrollment");
const Result = require("../models/Result");

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseMongoError(error, fallbackMessage) {
  if (error && error.code === 11000) {
    return { status: 409, message: "Duplicate value violation." };
  }
  return { status: 400, message: fallbackMessage };
}

router.post("/", async (req, res) => {
  try {
    const { name, email, department, year } = req.body;

    if (!name || !email || !department || year === undefined) {
      return res.status(400).json({ message: "name, email, department, and year are required." });
    }

    const yearNumber = Number(year);
    if (Number.isNaN(yearNumber) || yearNumber < 1) {
      return res.status(400).json({ message: "year must be a positive number." });
    }

    const student = await Student.create({ name, email, department, year: yearNumber });
    return res.status(201).json(student);
  } catch (error) {
    const parsed = parseMongoError(error, "Unable to create student.");
    return res.status(parsed.status).json({ message: parsed.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch students." });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid student id." });
  }

  try {
    const updates = {};
    const allowedFields = ["name", "email", "department", "year"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.year !== undefined) {
      const yearNumber = Number(updates.year);
      if (Number.isNaN(yearNumber) || yearNumber < 1) {
        return res.status(400).json({ message: "year must be a positive number." });
      }
      updates.year = yearNumber;
    }

    const updated = await Student.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: "Student not found." });
    }

    return res.json(updated);
  } catch (error) {
    const parsed = parseMongoError(error, "Unable to update student.");
    return res.status(parsed.status).json({ message: parsed.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid student id." });
  }

  try {
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found." });
    }

    await Enrollment.deleteMany({ student_id: id });
    await Result.deleteMany({ student_id: id });

    return res.json({
      message: "Student deleted successfully.",
      cleanup: "Related enrollments and results were removed."
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete student." });
  }
});

module.exports = router;
