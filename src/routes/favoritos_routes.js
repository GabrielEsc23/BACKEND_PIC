import {Router} from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js';
import { agregarFavorito,eliminarFavorito,obtenerFavoritos,eliminarTodosFavoritos,eliminarVariosFavoritos } from '../controllers/favoritos_controller.js';

const router=Router()

router.post("/favoritos/:id", verificarTokenJWT, agregarFavorito)

router.delete("/favoritos/seleccionados",verificarTokenJWT,eliminarVariosFavoritos)

//eliminar 1 proyecto favorito

router.delete("/favoritos/:id", verificarTokenJWT, eliminarFavorito)


//ELiminar todos los proyectos de faforitos
router.delete("/favoritos",verificarTokenJWT,eliminarTodosFavoritos)

router.get("/favoritos", verificarTokenJWT, obtenerFavoritos)



export default router