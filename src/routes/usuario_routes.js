
import {Router} from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js';
import { desactivarCuentaUsuario } from "../controllers/usuario_controller.js";

const router=Router()


router.put("/usuarios/desactivar",verificarTokenJWT,desactivarCuentaUsuario)






export default router