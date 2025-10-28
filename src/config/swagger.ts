import swaggerJsdoc, { SwaggerDefinition } from "swagger-jsdoc";
import dotenv from "dotenv";
import { SwaggerOptions } from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
dotenv.config();

const swaggerDefinition: SwaggerDefinition = {
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
  externalDocs: {
    url: `${process.env.API_PREFIX || ""}/swagger.json`,
  }
};

const options: swaggerJSDoc.Options = {

  definition: swaggerDefinition,
  apis: ["src/routes/**/*.ts", "src/controllers/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
