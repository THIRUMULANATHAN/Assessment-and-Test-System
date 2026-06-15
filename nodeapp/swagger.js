// nodeapp/swagger.js
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Assessment & Test System API",
      version: "1.0.0",
      description: "API documentation for Quiz Management System (Admin, Teacher, Student)",
      contact: {
        name: "Thiru.V",
        email: "thiru2005v@gmail.com"
      },
    },
    servers: [
      {
        url: "http://localhost:8080/api",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // scan all route files for swagger comments
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📘 Swagger Docs available at: http://localhost:8080/api-docs");
}

module.exports = swaggerDocs;
