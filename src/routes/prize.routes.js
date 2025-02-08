// src/routes/prize.routes.js
import {
  createPrize,
  getPrizes,
  updatePrize,
  deletePrize,
  requestPrizeRedemption,
  getPendingPrizeRedemptions,
  approvePrizeRedemption,
  rejectPrizeRedemption,
  getUserPrizeRedemptions,
} from "../controllers/prize.controller.js";

export default async function prizeRoutes(app) {
  app.post("/prizes", createPrize);
  app.get("/prizes", getPrizes);
  app.put("/prizes/:id", updatePrize);
  app.delete("/prizes/:id", deletePrize);
  app.post("/prize-redemptions", requestPrizeRedemption);
  app.get("/prize-redemptions/pending", getPendingPrizeRedemptions);
  app.patch("/prize-redemptions/:id/approve", approvePrizeRedemption);
  app.patch("/prize-redemptions/:id/reject", rejectPrizeRedemption);
  app.get("/prize-redemptions/user/:userId", getUserPrizeRedemptions);
}
