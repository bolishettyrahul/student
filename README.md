# Student Management System

Simple Node.js + Express + MongoDB app with server-rendered HTML for students, courses, enrollments, and results.

## Stack

- Node.js
- Express
- MongoDB + Mongoose
- EJS templates + plain CSS + minimal client-side JS

## Setup

1. Install dependencies:

   npm install

2. Copy environment file and set MongoDB URI:

   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI`

3. Run development server:

   npm run dev

4. Open browser:

   http://localhost:3000

## Routes

### Students

- `POST /students`
- `GET /students`
- `PUT /students/:id`
- `DELETE /students/:id`

### Courses

- `POST /courses`
- `GET /courses`

### Enrollments

- `POST /enrollments`
- `GET /enrollments`

### Results

- `POST /results` (creates or overwrites marks for student-course pair)
- `GET /results` (supports optional query: `?student=<studentId>`)

### UI

- `GET /` dashboard page with all forms and tables

## Validation and Guards

- Required field checks for all forms/routes
- `Student.email` unique
- Enrollment unique compound index on `(student_id, course_id)`
- Result unique compound index on `(student_id, course_id)`
- Numeric checks for `year`, `credits`, and `marks`
- Valid ObjectId checks on relationship routes
- Deleting student removes related enrollment and result records
