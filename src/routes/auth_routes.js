import { Router } from "express"
import {
  registroUsuario,
  login,
  confirmarEmail,
  recuperarPassword,
  comprobarTokenPassword,
  crearNuevoPassword
} from "../controllers/auth_controllers.js"

const router = Router()



// 🔐 Registro
router.post('/registro', registroUsuario)

// 🔐 Login
router.post('/login', login)

// 📧 Confirmar email
router.get('/confirmar-email/:token', confirmarEmail)

// 🔑 Recuperar contraseña
router.post('/recuperar-password', recuperarPassword)

// 🔍 Validar token recuperación
router.get('/recuperar-password/:token', comprobarTokenPassword)

// 🔒 Crear nueva contraseña
router.post('/nuevo-password/:token', crearNuevoPassword)

export default router