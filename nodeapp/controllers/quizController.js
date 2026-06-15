// nodeapp/controllers/quizController.js
const fs = require('fs');
const path = require('path');
const { Quiz, Result } = require('../models/Quiz');
const User = require('../models/User');

// ------------------ QUIZ CRUD ------------------

exports.addQuiz = async (req, res) => {
  try {
    const { title, subject, imgUrl, questions, category, difficulty, timeLimit } = req.body;

    if (!title || !subject || !imgUrl || !questions?.length) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newQuiz = await Quiz.create({
      title,
      subject,
      imgUrl,
      questions,
      category,
      difficulty,
      timeLimit,
      createdBy: req.user.id,
    });

    res.status(201).json(newQuiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('createdBy', 'username role');
    res.status(200).json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'username');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.status(200).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { title, subject, questions, imgUrl, category, difficulty } = req.body;
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title, subject, questions, imgUrl, category, difficulty },
      { new: true, runValidators: true }
    );
    if (!updatedQuiz) return res.status(404).json({ message: 'Quiz not found' });
    res.status(200).json(updatedQuiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const deletedQuiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!deletedQuiz) return res.status(404).json({ message: 'Quiz not found' });
    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper to send proctoring emails via SMTP or log locally
const sendProctoringEmail = async (studentEmail, teacherEmail, quizTitle, score, totalMarks, violations, camRec, screenRec) => {
  const nodemailer = require('nodemailer');
  const fs = require('fs');
  const path = require('path');

  const isViolated = violations >= 3;
  const status = isViolated ? "🔴 FLAGGED - EXCEEDED TAB SWITCH LIMIT" : "🟢 PASS - NO MAJOR VIOLATIONS";
  
  const mailOptions = {
    from: '"ATS Proctoring Service" <proctor@ats.local>',
    to: teacherEmail,
    subject: `[ATS PROCTOR ALERT] ${studentEmail} - ${quizTitle} (${status})`,
    text: `
Dear Instructor,

A student has completed a protected test in your assessment workspace.

Assessment Details:
- Student: ${studentEmail}
- Quiz: ${quizTitle}
- Score: ${score} / ${totalMarks}
- Tab Switch Violations: ${violations} / 3
- Proctoring Status: ${status}

Attached you will find the recorded video feeds (Webcam and Screen recording) captured during the test.

Regards,
ATS Automated Proctoring System
    `,
    html: `
<h3>Assessment Proctoring Report</h3>
<p>Dear Instructor,</p>
<p>A student has completed a protected test in your assessment workspace.</p>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; max-width: 500px;">
  <tr bgcolor="#f8fafc"><td><b>Student:</b></td><td>${studentEmail}</td></tr>
  <tr><td><b>Quiz Title:</b></td><td>${quizTitle}</td></tr>
  <tr bgcolor="#f8fafc"><td><b>Score:</b></td><td>${score} / ${totalMarks}</td></tr>
  <tr><td><b>Tab Switch Violations:</b></td><td><span style="color: ${isViolated ? 'red' : 'green'}; font-weight: bold;">${violations} / 3</span></td></tr>
  <tr bgcolor="#f8fafc"><td><b>Status:</b></td><td><span style="color: ${isViolated ? 'red' : 'green'}; font-weight: bold;">${status}</span></td></tr>
</table>
<p>Attached you will find the recorded video feeds (Webcam and Screen recording) captured during the test.</p>
<br/>
<p>Regards,<br/><b>ATS Automated Proctoring System</b></p>
    `,
    attachments: []
  };

  // If camera recording is present in base64 data URL format
  if (camRec && camRec.startsWith('data:video/') && camRec.includes(';base64,')) {
    const mimeType = camRec.substring(5, camRec.indexOf(';')); // e.g., "video/webm"
    const extension = mimeType.split('/')[1] || 'webm';        // e.g., "webm"
    const base64Data = camRec.split(';base64,').pop();
    
    mailOptions.attachments.push({
      filename: `webcam_${studentEmail}.${extension}`,
      content: Buffer.from(base64Data, 'base64'),
      contentType: mimeType
    });
  }

  // If screen recording is present in base64 data URL format
  if (screenRec && screenRec.startsWith('data:video/') && screenRec.includes(';base64,')) {
    const mimeType = screenRec.substring(5, screenRec.indexOf(';'));
    const extension = mimeType.split('/')[1] || 'webm';
    const base64Data = screenRec.split(';base64,').pop();
    
    mailOptions.attachments.push({
      filename: `screen_${studentEmail}.${extension}`,
      content: Buffer.from(base64Data, 'base64'),
      contentType: mimeType
    });
  }

  // Set up Nodemailer transport
  let transporter;

  const hasSMTPConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;


  if (hasSMTPConfig) {

    transporter = nodemailer.createTransport({

      host: process.env.SMTP_HOST,

      port: Number(process.env.SMTP_PORT),

      secure: process.env.SMTP_SECURE === 'true',


      // FIX FOR RENDER SMTP IPV6 ERROR
      // connect ENETUNREACH 2607:f8b0...
      family: 4,


      auth: {

        user: process.env.SMTP_USER,

        pass: process.env.SMTP_PASS.replace(/\s/g, "")

      },


      tls: {

        rejectUnauthorized: false

      }

    });
  }else {
    // Write to local proctoring email log file
    const logPath = path.join(__dirname, '../proctor_emails.log');
    const emailLog = `
========================================
[EMAIL SEND EVENT] - ${new Date().toISOString()}
TO: ${mailOptions.to}
SUBJECT: ${mailOptions.subject}
BODY:
${mailOptions.text}
ATTACHMENTS ATTACHED: ${mailOptions.attachments.length} files (Cam: ${camRec ? 'Yes' : 'No'}, Screen: ${screenRec ? 'Yes' : 'No'})
========================================
\n`;
    fs.appendFileSync(logPath, emailLog);
    console.log(`[MOCK EMAIL] Proctoring report logged locally at ${logPath}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Proctor email sent successfully to ${teacherEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send SMTP email: ${error.message}`);
    // Fallback to log file
    const logPath = path.join(__dirname, '../proctor_emails.log');
    fs.appendFileSync(logPath, `\n[SMTP ERROR - LOGGED BACKUP]: ${error.message}\n` + mailOptions.text);
  }
};

// ------------------ QUIZ SUBMISSION ------------------

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers, tabSwitches, cameraRecording, screenRecording } = req.body;
    const userId = req.user.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    quiz.questions.forEach((q) => {
      const userAnswer = answers.find((a) => a.questionId === q._id.toString());
      if (userAnswer && userAnswer.answer === q.correctAnswer) score++;
    });

    const totalMarks = quiz.questions.length;

    let cameraSavePath = null;
    let screenSavePath = null;
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (cameraRecording && cameraRecording.includes(';base64,')) {
      try {
        const mimeType = cameraRecording.substring(5, cameraRecording.indexOf(';'));
        const extension = mimeType.split('/')[1] || 'webm';
        const base64Data = cameraRecording.split(';base64,').pop();
        const fileName = `webcam_${userId}_${quizId}_${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        cameraSavePath = `/uploads/${fileName}`;
      } catch (err) {
        console.error("Error writing camera recording file:", err);
        cameraSavePath = "[Error saving camera recording]";
      }
    } else if (cameraRecording) {
      cameraSavePath = "[Recording Available - Sent via Email]";
    }

    if (screenRecording && screenRecording.includes(';base64,')) {
      try {
        const mimeType = screenRecording.substring(5, screenRecording.indexOf(';'));
        const extension = mimeType.split('/')[1] || 'webm';
        const base64Data = screenRecording.split(';base64,').pop();
        const fileName = `screen_${userId}_${quizId}_${Date.now()}.${extension}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        screenSavePath = `/uploads/${fileName}`;
      } catch (err) {
        console.error("Error writing screen recording file:", err);
        screenSavePath = "[Error saving screen recording]";
      }
    } else if (screenRecording) {
      screenSavePath = "[Recording Available - Sent via Email]";
    }

    const result = await Result.create({
      user: userId,
      quiz: quizId,
      score,
      totalMarks,
      answers,
      tabSwitches: tabSwitches || 0,
      cameraRecording: cameraSavePath,
      screenRecording: screenSavePath,
      proctoringViolated: (tabSwitches || 0) >= 3
    });

    // Send proctor alert email asynchronously
    const student = await User.findById(userId);
    const teacher = await User.findById(quiz.createdBy);
    if (student && teacher) {
      sendProctoringEmail(
        student.username,
        teacher.username,
        quiz.title,
        score,
        totalMarks,
        tabSwitches || 0,
        cameraRecording,
        screenRecording
      ).catch((err) => console.error("Email send background error:", err));
    }

    res.status(200).json({
      message: "Quiz submitted successfully",
      score,
      totalMarks,
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------ REPORTS ------------------

exports.getReports = async (req, res) => {
  try {
    const { studentName } = req.params;
    const user = await User.findOne({ username: studentName });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reports = await Result.find({ user: user._id }).populate('quiz', 'title subject');
    const formatted = reports.map(r => ({
      id: r._id,
      quizTitle: r.quiz?.title || 'Deleted Quiz',
      subject: r.quiz?.subject || 'N/A',
      score: r.score,
      totalMarks: r.totalMarks,
      date: r.date
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Result.find()
      .populate('user', 'username')
      .populate('quiz', 'title subject');

    const formatted = {};
    reports.forEach(r => {
      if (!r.user) return;
      const student = r.user.username;
      if (!formatted[student]) formatted[student] = [];
      formatted[student].push({
        id: r._id,
        quizTitle: r.quiz?.title || 'Deleted Quiz',
        subject: r.quiz?.subject || 'N/A',
        score: r.score,
        totalMarks: r.totalMarks,
        date: r.date
      });
    });

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const deletedReport = await Result.findByIdAndDelete(reportId);
    if (!deletedReport) return res.status(404).json({ message: 'Report not found' });
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------ FILTER + SEARCH ------------------

exports.filterQuizzes = async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const quizzes = await Quiz.find(filter);
    res.status(200).json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------ SEARCH QUIZZES ------------------
exports.searchQuizzes = async (req, res) => {
  try {
    const { keyword } = req.query;

    // if keyword missing, return all quizzes
    if (!keyword || keyword.trim() === "") {
      const quizzes = await Quiz.find();
      return res.status(200).json(quizzes);
    }

    // proper regex search
    const quizzes = await Quiz.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { subject: { $regex: keyword, $options: "i" } }
      ]
    });

    res.status(200).json(quizzes);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------ USER STATS ------------------

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId;

    const totalQuizzes = await Quiz.countDocuments();
    const totalAttempts = await Result.countDocuments({ user: userId });

    const results = await Result.find({ user: userId });
    const avgScore =
      results.length > 0
        ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2)
        : 0;

    res.status(200).json({
      totalQuizzes,
      totalAttempts,
      averageScore: avgScore,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
