import {Router} from 'express'
import { verificarTokenJWT,esAdministrador } from '../middlewares/JWT.js'
import { registroAdministrador,listarAdministradores,cambiarEstadoCuenta,listarUsuarios } from '../controllers/administrador_controller.js'

const router=Router()


// RUTA: registrar nuevo administrador
router.post('/administradores',registroAdministrador)



//Ruta para visualizar todos los administradores
router.get('/administradores',verificarTokenJWT,esAdministrador,listarAdministradores)




//Ruta: Para cambiar el estado de los usuarios o administradores
router.put('/usuarios/estado/:id',verificarTokenJWT,esAdministrador,cambiarEstadoCuenta)

router.get('/usuarios',verificarTokenJWT,esAdministrador,listarUsuarios)





export default router