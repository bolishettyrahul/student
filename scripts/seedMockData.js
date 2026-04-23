const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Student = require("../models/Student");
const Course = require("../models/Course");

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical"
];

const studentNames = [
  "Aarav Sharma",
  "Vivaan Patel",
  "Aditya Verma",
  "Arjun Reddy",
  "Krishna Nair",
  "Rohan Gupta",
  "Siddharth Iyer",
  "Karthik Rao",
  "Ananya Singh",
  "Diya Kapoor",
  "Priya Menon",
  "Sneha Joshi",
  "Isha Kulkarni",
  "Meera Nambiar",
  "Kavya Ramesh",
  "Pooja Desai",
  "Rahul Choudhary",
  "Nikhil Bansal",
  "Harsh Vora",
  "Manish Yadav",
  "Aditi Mishra",
  "Neha Agarwal",
  "Ritika Jain",
  "Sana Khan",
  "Farhan Ali",
  "Imran Sheikh",
  "Yash Malhotra",
  "Tanvi Bhatt",
  "Nandini Prasad",
  "Gaurav Tiwari"
];

const courses = [
  { course_name: "Data Structures", credits: 4 },
  { course_name: "Database Management Systems", credits: 4 },
  { course_name: "Operating Systems", credits: 4 },
  { course_name: "Computer Networks", credits: 3 },
  { course_name: "Software Engineering", credits: 3 },
  { course_name: "Web Technologies", credits: 3 },
  { course_name: "Machine Learning Basics", credits: 4 },
  { course_name: "Cloud Computing", credits: 3 },
  { course_name: "Cyber Security Fundamentals", credits: 3 }
];

function buildStudents() {
  return studentNames.map((name, index) => {
    const emailHandle = name.toLowerCase().replace(/\s+/g, ".");
    return {
      name,
      email: `${emailHandle}${index + 1}@student.in`,
      department: departments[index % departments.length],
      year: (index % 4) + 1
    };
  });
}

async function seedData() {
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment variables.");
  }

  await mongoose.connect(mongoUri);

  const students = buildStudents();

  const studentOps = students.map((student) => ({
    updateOne: {
      filter: { email: student.email },
      update: { $set: student },
      upsert: true
    }
  }));

  const courseOps = courses.map((course) => ({
    updateOne: {
      filter: { course_name: course.course_name },
      update: { $set: course },
      upsert: true
    }
  }));

  const studentResult = await Student.bulkWrite(studentOps);
  const courseResult = await Course.bulkWrite(courseOps);

  const totalStudents = await Student.countDocuments();
  const totalCourses = await Course.countDocuments();

  console.log("Seed complete.");
  console.log(`Students upserted: ${studentResult.upsertedCount}, modified: ${studentResult.modifiedCount}`);
  console.log(`Courses upserted: ${courseResult.upsertedCount}, modified: ${courseResult.modifiedCount}`);
  console.log(`Total students in DB: ${totalStudents}`);
  console.log(`Total courses in DB: ${totalCourses}`);
}

seedData()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
