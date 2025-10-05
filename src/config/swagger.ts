import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";
dotenv.config();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Violet Shift API",
    version: "1.0.0",
    description: "API documentation for Violet Shift Backend",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  servers: [
    {
      url: process.env.API_PREFIX || "/",
      description: "Base API prefix",
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ["src/routes/**/*.ts", "src/controllers/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
