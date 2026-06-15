const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { Quiz, Result } = require('../models/Quiz');
const User = require('../models/User');

dotenv.config();

const SEED_STUDENTS = [
  { username: 'alex@nexus3d.com', password: 'password123' },
  { username: 'emma@nexus3d.com', password: 'password123' }
];

const ensureSeedStudents = async () => {
  const students = [];
  for (const studentData of SEED_STUDENTS) {
    let student = await User.findOne({ username: studentData.username });
    if (!student) {
      console.log(`Creating seed student: ${studentData.username}`);
      const hashedPassword = await bcrypt.hash(studentData.password, 10);
      student = await User.create({
        username: studentData.username,
        password: hashedPassword,
        role: 'Student'
      });
    }
    students.push(student);
  }
  return students;
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in .env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const quizzes = await Quiz.find({});
  if (!quizzes || quizzes.length === 0) {
    throw new Error('No quizzes found. Please run "npm run seed" first to seed quizzes.');
  }
  console.log(`Found ${quizzes.length} quizzes.`);

  const studentList = await ensureSeedStudents();
  console.log(`Seeding reports for ${studentList.length} student(s)...`);

  for (const student of studentList) {
    console.log(`\nProcessing student: ${student.username}`);
    
    // Clear existing results/reports for this student to make the seeding process idempotent
    await Result.deleteMany({ user: student._id });
    console.log(`Deleted existing reports for user: ${student.username}`);

    const reportsToInsert = [];

    for (const quiz of quizzes) {
      const questions = quiz.questions;
      if (!questions || questions.length === 0) continue;

      // Define different accuracy targets for realistic grades
      const accuracyOptions = [0.6, 0.7, 0.8, 0.9, 1.0];
      const targetAccuracy = accuracyOptions[Math.floor(Math.random() * accuracyOptions.length)];

      let score = 0;
      const answers = [];

      for (const q of questions) {
        const isCorrect = Math.random() < targetAccuracy;
        let selectedAnswer = q.correctAnswer;

        if (!isCorrect) {
          // Get all available options
          const optionsList = [q.options.op1, q.options.op2, q.options.op3, q.options.op4].filter(Boolean);
          // Pick a wrong option
          const incorrectOptions = optionsList.filter(opt => opt !== q.correctAnswer);
          if (incorrectOptions.length > 0) {
            selectedAnswer = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
          } else {
            selectedAnswer = q.options.op1;
          }
        } else {
          score++;
        }

        answers.push({
          questionId: q._id.toString(),
          answer: selectedAnswer
        });
      }

      // Generate a date within the last 10 days
      const daysAgo = Math.floor(Math.random() * 10);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      reportsToInsert.push({
        user: student._id,
        quiz: quiz._id,
        score,
        totalMarks: questions.length,
        answers,
        date
      });
    }

    if (reportsToInsert.length > 0) {
      const createdReports = await Result.insertMany(reportsToInsert);
      console.log(`✅ Successfully seeded ${createdReports.length} reports for student: ${student.username}`);
    } else {
      console.log(`⚠️ No reports were generated for student: ${student.username}`);
    }
  }
};

seed()
  .catch((error) => {
    console.error(`❌ Seed reports failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  });
