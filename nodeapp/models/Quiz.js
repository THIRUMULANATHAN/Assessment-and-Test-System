// nodeapp/models/Quiz.js
const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  op1: { type: String, required: true },
  op2: { type: String, required: true },
  op3: { type: String, required: true },
  op4: { type: String, required: true }
});

const questionItemSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: optionSchema, required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  imgUrl: { type: String, required: true },
  category: { type: String, default: 'Academic' },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  timeLimit: { type: Number, min: 1, default: 10 },
  questions: {
    type: [questionItemSchema],
    validate: {
      validator: (questions) => questions.length >= 1,
      message: 'A quiz must contain at least one question'
    }
  },
  isProtected: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const resultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  answers: [{ questionId: String, answer: String }],
  tabSwitches: { type: Number, default: 0 },
  cameraRecording: { type: String },
  screenRecording: { type: String },
  proctoringViolated: { type: Boolean, default: false }
});

const Quiz = mongoose.model('Quiz', quizSchema);
const Result = mongoose.model('Result', resultSchema);

module.exports = { Quiz, Result };
