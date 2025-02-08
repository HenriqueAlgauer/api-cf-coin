// src/controllers/prize.controller.js
import { redeemPrize } from "../services/prize.service.js";

export async function requestPrizeRedemption(request, reply) {
  try {
    const { userId, prizeId } = request.body;

    if (!userId || !prizeId) {
      return reply
        .status(400)
        .send({ error: "Usuário e Prêmio são obrigatórios." });
    }

    const redemption = await redeemPrize(userId, prizeId);
    reply.status(201).send(redemption);
  } catch (error) {
    console.error("Erro ao solicitar resgate de prêmio:", error);
    reply.status(500).send({ error: error.message });
  }
}

// Outros controllers para listar, atualizar, aprovar e rejeitar resgates podem ser criados aqui.
