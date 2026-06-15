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

app.use(
  express.json({
    limit: "200mb",
  })
);

app.use(
  express.urlencoded({
    limit: "200mb",
    extended: true,
  })
);

app.use(morgan("dev"));


// ==========================
// CORS Configuration
// ==========================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://assessment-and-test-system.vercel.app",
];


app.use(
  cors({
    origin: function (origin, callback) {

      // Postman/mobile apps
      if (!origin) {
        return callback(null, true);
      }

      // allow production + preview vercel urls
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `Blocked by CORS: ${origin}`
        )
      );
    },


    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);


// handle browser preflight
app.options("*", cors());


// ==========================
// Static uploads
// ==========================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// ==========================
// MongoDB
// ==========================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "✅ MongoDB Connected"
    );
  })
  .catch((err) => {
    console.log(
      "❌ MongoDB Error:",
      err.message
    );
  });


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
// Health Check
// ==========================

app.get("/", (req, res) => {
  res.status(200).send(
    "Assessment & Test System API running 🚀"
  );
});


// swaggerDocs(app);


// ==========================
// 404
// ==========================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});


// ==========================
// Server
// ==========================

const PORT =
  process.env.PORT || 8080;


app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});