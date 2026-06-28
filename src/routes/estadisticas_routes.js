import {Router} from 'express'
import { verificarTokenJWT,esAdministrador } from '../middlewares/JWT.js'
import {obtenerEstadisticas} from '../controllers/estadisticas_controller.js'

const router=Router()

//Ruta: Para mostrar estadisticas

router.get('/estadisticas',verificarTokenJWT,esAdministrador,obtenerEstadisticas)

export default router