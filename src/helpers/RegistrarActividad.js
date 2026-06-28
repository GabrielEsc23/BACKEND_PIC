import LogActividad from "../models/LogActividad.js"

const registrarActividad = async ({
    usuario = null,
    usuarioModelo = null,
    email = null,
    accion,
    resultado,
    entidadId = null,
    detalles = null
}) => {
    try {
        await LogActividad.create({
            usuario,
            usuarioModelo,
            email,
            accion,
            resultado,
            entidadId,
            detalles
        })
    } catch (error) {
        console.error("Error al registrar actividad:", error)
    }
}

export default registrarActividad

