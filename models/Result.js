const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    marks: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

resultSchema.index({ student_id: 1, course_id: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);
