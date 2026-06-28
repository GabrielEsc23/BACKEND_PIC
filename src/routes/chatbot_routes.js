import { Router } from "express";
import {
  chat,
  listarConversaciones,
  obtenerConversacion,
  eliminarConversacion
} from '../controllers/chatbot_controller.js'
import {verificarTokenJWT} from "../middlewares/JWT.js";

const router = Router();

// Enviar un mensaje al chatbot. Si no se manda conversacionId, crea una nueva conversación.
router.post("/chatbot", verificarTokenJWT, chat);

// Listar las conversaciones del usuario autenticado (para mostrar el historial tipo ChatGPT)
router.get("/conversaciones", verificarTokenJWT, listarConversaciones);

// Obtener el historial completo de una conversación específica
router.get("/conversaciones/:id", verificarTokenJWT, obtenerConversacion);

// Eliminar una conversación
router.delete("/conversaciones/:id", verificarTokenJWT, eliminarConversacion);

export default router;