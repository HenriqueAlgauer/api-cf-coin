import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { prisma } from "./prisma/client.js";
import userRoutes from "./routes/user.routes.js";
import coinRoutes from "./routes/coin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import prizeRoutes from "./routes/prize.routes.js";

dotenv.config();

const app = Fastify();
app.register(cors);

// Rotas
app.register(userRoutes);
app.register(coinRoutes);
app.register(authRoutes);
app.register(taskRoutes);
app.register(prizeRoutes);

app.listen({ port: 3000 }, () => console.log("🚀 Server running on port 3000"));
