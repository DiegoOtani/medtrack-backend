import express from "express";
import routes from "./routes";
import cors from 'cors';
import { setupSwagger } from "./swagger/swaggerConfig";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);

app.use(express.json());
setupSwagger(app);

app.use("/api", routes);


export default app;
