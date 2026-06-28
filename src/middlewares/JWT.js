import jwt from "jsonwebtoken"
import Administrador from "../models/Administrador.js"
import Usuario from "../models/Usuario.js"

const createTokenJWT = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "1d" })
}

const verificarTokenJWT = async (req, res, next) => {
  try {
    const { authorization } = req.headers

    if (!authorization) {
      return res.status(401).json({ msg: "Token no proporcionado" })
    }

    const parts = authorization.split(" ")
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ msg: "Formato de token inválido" })
    }

    const token = parts[1]

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const { id } = payload

    let usuario = await Usuario.findById(id).select("-password").lean()

     if (!usuario) {
        usuario = await Administrador.findById(id).select("-password").lean()

    }
    if (!usuario) {
      return res.status(401).json({ msg: "Usuario no encontrado" })
    }

    if (!usuario.confirmEmail) {
      return res.status(403).json({ msg: "Cuenta no verificada" })
    }

    req.usuario = usuario

    next()

  } catch (error) {
    console.error(error)
    return res.status(401).json({ msg: "Token inválido o expirado" })
  }
}

//  Middleware para rol
const esAdministrador = (req, res, next) => {
  if (req.usuario.rol !== "administrador") {
    return res.status(403).json({ msg: "Acceso denegado: requiere rol administrador" })
  }
  next()
}
export {
  createTokenJWT,
  verificarTokenJWT,
  esAdministrador
}