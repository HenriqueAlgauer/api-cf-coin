// src/routes/coin.routes.js
import {
  createCoin,
  getCoins,
  getPendingCoins,
  getUserCoins,
  approveCoin,
  updateCoinMessage,
  rejectCoin,
  deleteCoin,
} from "../controllers/coin.controller.js";

export default async function coinRoutes(app) {
  app.post("/coins", createCoin);
  app.get("/coins", getCoins);
  app.get("/coins/pending", getPendingCoins);
  app.get("/coins/user/:userId", getUserCoins);
  app.patch("/coins/:id/approve", approveCoin);
  app.patch("/coins/:id", updateCoinMessage);
  app.patch("/coins/:id/reject", rejectCoin);
  app.delete("/coins/:id", deleteCoin);
}
