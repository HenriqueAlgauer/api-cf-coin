// src/routes/user.routes.js
import {
  getUsers,
  getUserById,
  updateUserEmail,
  getUserCoins,
  getUserTransactions,
  createUser,
  deleteUser,
  updateUser,
} from "../controllers/user.controller.js";

export default async function userRoutes(app) {
  app.get("/users", getUsers);
  app.get("/users/:id", getUserById);
  app.patch("/users/:id/email", updateUserEmail);
  app.get("/users/:id/coins", getUserCoins);
  app.get("/users/:id/transactions", getUserTransactions);
  app.post("/users", createUser);
  app.delete("/users/:id", deleteUser);
  app.patch("/users/:id", updateUser);
}
