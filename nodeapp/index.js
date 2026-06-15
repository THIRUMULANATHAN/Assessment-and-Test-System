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
// CORS (OPEN)
// ==========================

app.use(
  cors({
    origin: true,
    credentials: true,

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
  })
);


// ==========================
// Static Uploads
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


// New correct API routes
app.use(
  "/api/auth",
  require("./routes/authRoutes")
);


// Old frontend compatibility
// fixes /auth/register issue
app.use(
  "/auth",
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
  res
    .status(200)
    .send(
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

const PORT =
  process.env.PORT || 8080;


app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});