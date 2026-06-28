import Administrador from "../models/Administrador.js"
import Usuario from "../models/Usuario.js"
import Proyecto from "../models/Proyecto.js"
import {sendMailToRegister,sendMailToAdministrator} from "../helpers/sendMail.js"
import crypto  from "crypto"
import { json } from "express"
import registrarActividad from "../helpers/RegistrarActividad.js"


const registroAdministrador = async (req, res) => {
  try {

    let { nombre, apellido, email} = req.body

    // Limpiar espacios
    nombre = nombre?.trim()
    apellido = apellido?.trim()
    email = email?.trim().toLowerCase()

    const passwordTemporal = crypto.randomBytes(8).toString("hex")
    // Campos obligatorios
    if (!nombre || !apellido || !email) {
      return res.status(400).json({
        msg: "Todos los campos son obligatorios"
      })
    }
    if (nombre.length < 3) {
      return res.status(400).json({
        msg: "El nombre debe tener al menos 3 caracteres"
      })
    }
    if (apellido.length < 3) {
      return res.status(400).json({
        msg: "El apellido debe tener al menos 3 caracteres"
      })
    }

    const regexTexto = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/

    if (!regexTexto.test(nombre)) {
      return res.status(400).json({
        msg: "El nombre solo puede contener letras"
      })
    }

    if (!regexTexto.test(apellido)) {
      return res.status(400).json({
        msg: "El apellido solo puede contener letras"
      })
    }

    // Validar email
    const regexEmail = /^\S+@\S+\.\S+$/

    if (!regexEmail.test(email)) {
      return res.status(400).json({
        msg: "Correo electrónico inválido"
      })
    }

    // Verificar duplicados
    let existe = await Administrador.findOne({ email })

    if (!existe) {
      existe = await Usuario.findOne({ email })
    }

    if (existe) {
      return res.status(400).json({
        msg: "El correo ya se encuentra registrado"
      })
    }

    // Crear administrador
    const nuevoAdmin = new Administrador({
      nombre,
      apellido,
      email,
      password: passwordTemporal,
      
    })
    const token = nuevoAdmin.createToken()
    nuevoAdmin.verifyToken = token

    await nuevoAdmin.save()

    await sendMailToAdministrator(email, token,passwordTemporal)

    // Log: administrador creado exitosamente (acción realizada por otro administrador)
    await registrarActividad({
      usuario: req.usuario._id,
      usuarioModelo: "Administrador",
      email: req.usuario.email,
      accion: "crear_administrador",
      resultado: "exito",
      entidadId: nuevoAdmin._id,
      detalles: { emailCreado: email }
    })

    res.status(201).json({
      msg: "Administrador creado correctamente. Se ha enviado un correo con las instrucciones de activación y acceso."
    })

  } catch (error) {
    console.error(error)

    res.status(500).json({
      msg: "Error en el servidor"
    })
  }
}




const cambiarEstadoCuenta = async (req, res) => {
  try {

    const { id } = req.params
    const { estado } = req.body

    // Validar estado
    if (!["activo", "inactivo"].includes(estado)) {
      return res.status(400).json({
        msg: "Estado inválido"
      })
    }

    // 🔍 Buscar primero en usuarios
    let cuenta = await Usuario.findById(id)

    let tipo = "usuario"

    // 🔍 Si no existe, buscar en administradores
    if (!cuenta) {
      cuenta = await Administrador.findById(id)

      tipo = "administrador"
    }

    // ❌ No existe en ninguno
    if (!cuenta) {
      return res.status(404).json({
        msg: "Cuenta no encontrada"
      })
    }

    // Cambiar estado
    cuenta.estado = estado

    await cuenta.save()

    // Log: cambio de estado de cuenta (usuario o administrador)
    await registrarActividad({
      usuario: req.usuario._id,
      usuarioModelo: "Administrador",
      email: req.usuario.email,
      accion: tipo === "administrador" ? "cambiar_estado_administrador" : "cambiar_estado_usuario",
      resultado: "exito",
      entidadId: cuenta._id,
      detalles: { emailAfectado: cuenta.email, nuevoEstado: estado, tipo }
    })

    res.status(200).json({
      msg: `${tipo === "administrador" ? "Administrador" : "Usuario"} ${estado} correctamente`
    })

  } catch (error) {
    console.error(error)

    res.status(500).json({
      msg: "Error en el servidor"
    })
  }
}

const listarUsuarios = async (req, res) => {
  try {

    const { search, estado } = req.query

    const filtro = {}

    // Buscar por nombre, apellido o correo
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { apellido: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }

    // Filtrar por estado
    if (estado) {

      if (!["activo", "inactivo"].includes(estado)) {
        return res.status(400).json({
          msg: "Estado no válido"
        })
      }

      filtro.estado = estado
    }

    const usuarios = await Usuario.find(filtro)
      .select("nombre apellido email estado carrera rol createdAt")
      .sort({ createdAt: -1 })

    if (usuarios.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron usuarios"
      })
    }

    res.status(200).json(usuarios)

  } catch (error) {
    res.status(500).json({
      msg: "Error en el servidor"
    })
  }
}


const listarAdministradores = async (req, res) => {
  try {

    const { search, estado } = req.query

    const filtro = {}

    // Buscar por nombre, apellido o correo
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { apellido: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }

    // Filtrar por estado
    if (estado) {

      if (!["activo", "inactivo"].includes(estado)) {
        return res.status(400).json({
          msg: "Estado no válido"
        })
      }

      filtro.estado = estado
    }

    const administradores = await Administrador.find(filtro)
      .select("nombre apellido email estado rol createdAt")
      .sort({ createdAt: -1 })

    if (administradores.length === 0) {
      return res.status(404).json({
        msg: "No se encontraron administradores"
      })
    }

    res.status(200).json(administradores)

  } catch (error) {
    res.status(500).json({
      msg: "Error en el servidor"
    })
  }
}

export{
  registroAdministrador,
  cambiarEstadoCuenta,
  listarAdministradores,
  listarUsuarios
}