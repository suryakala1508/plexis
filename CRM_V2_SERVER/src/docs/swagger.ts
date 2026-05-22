import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { ENV } from "../config/env";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PLEXIS CRM V2 API",
      version: "1.0.0",
      description: "API documentation for PLEXIS CRM V2",
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT || 5000}`,
        description: "Development server"
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
  },

  // ✅ ABSOLUTE path (this is the fix)
  apis: [
    path.join(__dirname, "../modules/**/*.ts"),
    path.join(__dirname, "../modules/**/*.js"), // For compiled JS files
  ],
};


// console.log("Swagger scanning:", options.apis);

export const swaggerSpec = swaggerJSDoc(options);
