import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import userRoutes from "./src/routes/user.routes.js";
import coinRoutes from "./src/routes/coin.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import taskRoutes from "./src/routes/task.routes.js";
import prizeRoutes from "./src/routes/prize.routes.js";

dotenv.config();

const app = Fastify();
app.register(cors);

// Rotas
app.register(userRoutes);
app.register(coinRoutes);
app.register(authRoutes);
app.register(taskRoutes);
app.register(prizeRoutes);

app.listen({ host: "127.0.0.1", port: 3001 }, () =>
  console.log("🚀 Server running on port 3001 and accessible internally")
);
