import { Router } from "express";
import { listarLogs } from "../controllers/logs_controller.js";
import { verificarTokenJWT,esAdministrador } from "../middlewares/JWT.js";

const router = Router()

router.get("/logs",verificarTokenJWT,esAdministrador,listarLogs)

export default router