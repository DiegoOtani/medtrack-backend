import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "Documentação da API com Swagger + JSDoc",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Autenticação via token JWT. Para usar, inclua o token no header Authorization no formato: `Authorization: Bearer {seu-token-jwt}`. O token pode ser obtido através do endpoint POST /api/users/login"
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ["./src/modules/**/*.ts", "./src/docs/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export function setupSwagger(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
