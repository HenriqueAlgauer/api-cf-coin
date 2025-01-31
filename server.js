import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { prisma } from "./prisma/client.js";
import userRoutes from "./routes/user.routes.js";
import coinRoutes from "./routes/coin.routes.js";

dotenv.config();

const app = Fastify();
app.register(cors);

// Rotas
app.register(userRoutes);
app.register(coinRoutes);

app.listen({ port: 3000 }, () => console.log("🚀 Server running on port 3000"));
