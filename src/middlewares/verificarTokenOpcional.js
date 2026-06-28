import jwt from "jsonwebtoken"
import Usuario from "../models/Usuario.js"
import Administrador from "../models/Administrador.js"

// Igual que verificarTokenJWT, pero NO bloquea la petición si no hay token
// o si es inválido. Útil para endpoints públicos que quieren comportarse
// distinto si quien consulta está logueado (ej. un administrador viendo
// proyectos ocultos), sin exigir login a todo el mundo.
const verificarTokenOpcional = async (req, res, next) => {
  try {
    const { authorization } = req.headers

    // Sin header de autorización -> sigue como visitante anónimo
    if (!authorization) {
      return next()
    }

    const parts = authorization.split(" ")
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return next()
    }

    const token = parts[1]

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const { id } = payload

    let usuario = await Usuario.findById(id).select("-password").lean()

    if (!usuario) {
      usuario = await Administrador.findById(id).select("-password").lean()
    }

    // Si el usuario no existe, no está confirmado, o está inactivo,
    // simplemente sigue como visitante anónimo (no rechaza la petición).
    if (!usuario || !usuario.confirmEmail || usuario.estado === "inactivo") {
      return next()
    }

    req.usuario = usuario

    next()

  } catch (error) {
    // Token inválido o expirado -> sigue como visitante anónimo
    next()
  }
}

export { verificarTokenOpcional}