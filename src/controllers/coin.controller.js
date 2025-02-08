// src/controllers/coin.controller.js
import { approveCoinRequest } from "../services/coin.service.js";

export async function approveCoin(request, reply) {
  try {
    const { id } = request.params;
    // Aqui, após o middleware verifyAdmin, o admin já foi verificado.
    // Caso queira, você pode extrair o adminId do body (ou de request.user se usar token)
    const { adminId } = request.body;

    const updatedCoin = await approveCoinRequest(id, adminId);
    reply.send(updatedCoin);
  } catch (error) {
    console.error("Erro ao aprovar a coin:", error);
    reply.status(400).send({ error: error.message });
  }
}

// Outros controllers podem ser criados de forma similar, por exemplo:
export async function createCoin(request, reply) {
  try {
    const { userId, taskId, message } = request.body;
    // Validações iniciais podem ser feitas aqui ou delegadas para um service
    if (!userId || typeof userId !== "number") {
      return reply
        .status(400)
        .send({
          error: "O campo 'userId' é obrigatório e deve ser um número.",
        });
    }
    if (!taskId || typeof taskId !== "number") {
      return reply
        .status(400)
        .send({
          error: "O campo 'taskId' é obrigatório e deve ser um número.",
        });
    }

    // Aqui você pode chamar um service para criar a coin (separando a lógica)
    const coin =
      await /* service.createCoin({ userId, taskId, message }) */ null;

    // Por enquanto, vamos replicar a lógica que já está no coin.routes:
    // (aqui você pode incluir o código do prisma.coin.create se não houver um service)

    reply.status(201).send(coin);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: "Erro interno ao criar coin" });
  }
}
