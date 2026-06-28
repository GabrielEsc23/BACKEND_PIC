// routes/proyecto_routes.js

import { Router } from "express"
import upload from "../middlewares/multer.js"
import { verificarTokenJWT,esAdministrador } from "../middlewares/JWT.js"
import { verificarTokenOpcional} from "../middlewares/verificarTokenOpcional.js"
import { crearProyecto,eliminarProyecto,actualizarProyecto,obtenerProyecto,cambiarVisibilidadProyecto } from "../controllers/proyecto_controller.js"

const router = Router()

router.post("/proyectos",verificarTokenJWT,esAdministrador,upload.fields([
   {name:"archivoPDF",maxCount:1},
   {name:"portada",maxCount:1}
]) ,crearProyecto)

router.delete("/proyectos/:id", verificarTokenJWT, esAdministrador, eliminarProyecto
);

router.put(
  "/proyectos/:id",
  verificarTokenJWT,esAdministrador,
  upload.single("archivoPDF"),
  actualizarProyecto
)


// Nueva ruta para ocultar/mostrar un proyecto
router.patch(
  "/proyectos/visibilidad/:id",
  verificarTokenJWT,
  esAdministrador,
  cambiarVisibilidadProyecto
)

router.get("/proyectos", verificarTokenOpcional, obtenerProyecto)

export default router