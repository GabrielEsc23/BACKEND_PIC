import {Router} from 'express'
import { verificarTokenJWT} from '../middlewares/JWT.js'
import {perfil,actualizarPerfil,cambiarPassword} from '../controllers/perfil_controller.js'

const router=Router()

router.get('/perfil', verificarTokenJWT, perfil)

router.put('/perfil', verificarTokenJWT, actualizarPerfil)

router.put(
  '/perfil/cambiar-password',
  verificarTokenJWT,
  cambiarPassword
)

export default router