const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { Quiz } = require('../models/Quiz');
const User = require('../models/User');
const quizData = require('./quizData');

dotenv.config();

const SEED_TEACHER_USERNAME = 'seed.teacher@ats.local';
const SEED_TEACHER_PASSWORD = process.env.SEED_TEACHER_PASSWORD || 'ChangeMe123!';

const validateQuizData = () => {
  const errors = [];
  const subjects = new Set();

  quizData.forEach((quiz) => {
    if (subjects.has(quiz.subject)) {
      errors.push(`Duplicate subject: ${quiz.subject}`);
    }
    subjects.add(quiz.subject);

    const requiredQuestionCount = quiz.requiredQuestionCount || 10;
    if (quiz.questions.length !== requiredQuestionCount) {
      errors.push(
        `${quiz.subject} must contain exactly ${requiredQuestionCount} questions`
      );
    }

    quiz.questions.forEach((question, index) => {
      const options = Object.values(question.options);
      if (options.some((option) => !option.trim())) {
        errors.push(`${quiz.subject} question ${index + 1} has an empty option`);
      }
      if (!options.includes(question.correctAnswer)) {
        errors.push(`${quiz.subject} question ${index + 1} has an invalid correct answer`);
      }
    });
  });

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  return {
    subjects: quizData.length,
    questions: quizData.reduce((total, quiz) => total + quiz.questions.length, 0),
  };
};

const getSeedTeacher = async () => {
  const existingTeacher = await User.findOne({
    role: { $in: ['Admin', 'Teacher'] },
  }).sort({ role: 1 });

  if (existingTeacher) {
    return existingTeacher;
  }

  const password = await bcrypt.hash(SEED_TEACHER_PASSWORD, 10);
  return User.findOneAndUpdate(
    { username: SEED_TEACHER_USERNAME },
    {
      $set: { role: 'Teacher' },
      $setOnInsert: { password },
    },
    { new: true, upsert: true, runValidators: true }
  );
};

const seed = async () => {
  const summary = validateQuizData();

  if (process.argv.includes('--validate')) {
    console.log(`Seed data is valid: ${summary.subjects} subjects, ${summary.questions} questions.`);
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const teacher = await getSeedTeacher();

  for (const quiz of quizData) {
    const { requiredQuestionCount, ...quizDocument } = quiz;
    await Quiz.findOneAndUpdate(
      { title: quiz.title },
      { $set: { ...quizDocument, createdBy: teacher._id } },
      { upsert: true, new: true, runValidators: true }
    );
  }

  console.log(
    `Seeded ${summary.subjects} quizzes with ${summary.questions} questions using ${teacher.username}.`
  );
};

seed()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
