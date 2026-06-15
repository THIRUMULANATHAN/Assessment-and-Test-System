// nodeapp/index.js

const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
// const { swaggerDocs } = require("./swagger");

dotenv.config();

const app = express();


// ==========================
// Middlewares
// ==========================

app.use(express.json({ limit: "200mb" }));

app.use(
  express.urlencoded({
    limit: "200mb",
    extended: true,
  })
);

app.use(morgan("dev"));


// ==========================
// Static Upload Folder
// ==========================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


// ==========================
// CORS Configuration
// ==========================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",

  // Production frontend
  "https://assessment-and-test-system.vercel.app",
];


app.use(
  cors({
    origin: function (origin, callback) {

      // allow postman/server requests
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);


// ==========================
// MongoDB Connection
// ==========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    console.log("✅ MongoDB Connected")
  )
  .catch((err) =>
    console.error(
      "❌ MongoDB Error:",
      err.message
    )
  );


// ==========================
// Routes
// ==========================

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/quizzes",
  require("./routes/quizRoutes")
);

app.use(
  "/api/users",
  require("./routes/userRoutes")
);


// ==========================
// Root Test Route
// ==========================

app.get("/", (req, res) => {
  res.send(
    "Assessment & Test System API running 🚀"
  );
});


// ==========================
// Swagger
// ==========================

// swaggerDocs(app);


// ==========================
// 404 Handler
// ==========================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


// ==========================
// Server Start
// ==========================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});