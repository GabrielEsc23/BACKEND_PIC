import Administrador from "../models/Administrador.js"
import Usuario from "../models/Usuario.js"
import {sendMailToRegister,sendMailToRecoveryPassword} from "../helpers/sendMail.js"
import { createTokenJWT } from "../middlewares/JWT.js"
import registrarActividad from "../helpers/RegistrarActividad.js"


const registroUsuario = async (req, res) => {
  try {

    let { nombre, apellido, email, password, carrera } = req.body

    // Eliminar espacios innecesarios
    nombre = nombre?.trim()
    apellido = apellido?.trim()
    email = email?.trim().toLowerCase()
    carrera = carrera?.trim()

    // Campos obligatorios
    if (!nombre || !apellido || !email || !password || !carrera) {
      return res.status(400).json({
        msg: "Todos los campos son obligatorios"
      })
    }

    // Nombre mínimo
    if (nombre.length < 3) {
      return res.status(400).json({
        msg: "El nombre debe tener al menos 3 caracteres"
      })
    }

    // Apellido mínimo
    if (apellido.length < 3) {
      return res.status(400).json({
        msg: "El apellido debe tener al menos 3 caracteres"
      })
    }

    // Solo letras en nombre
    if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(nombre)) {
      return res.status(400).json({
        msg: "El nombre solo puede contener letras"
      })
    }

    // Solo letras en apellido
    if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(apellido)) {
      return res.status(400).json({
        msg: "El apellido solo puede contener letras"
      })
    }

    // Correo institucional
    if (!email.endsWith("@epn.edu.ec")) {
      return res.status(400).json({
        msg: "Debe usar un correo institucional (@epn.edu.ec)"
      })
    }

    // Validar contraseña segura
    if (password.length < 8) {
      return res.status(400).json({
        msg: "La contraseña debe tener mínimo 8 caracteres"
      })
    }

    // Ejemplo contraseña fuerte
    const regexPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

    if (!regexPassword.test(password)) {
      return res.status(400).json({
        msg: "La contraseña debe contener mayúscula, minúscula y número"
      })
    }

    // Verificar duplicados
    const usuario = await Usuario.findOne({ email })
    const administrador = await Administrador.findOne({ email })

    if (usuario || administrador) {
      return res.status(400).json({
        msg: "El email ya está registrado"
      })
    }

    // Crear usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      password,
      carrera,
      rol: "usuario"
    })

    // Token
    const token = nuevoUsuario.createToken()
    nuevoUsuario.verifyToken = token

    await nuevoUsuario.save()

    // Correo
    await sendMailToRegister(email, token)

    // Log: registro de usuario exitoso
    await registrarActividad({
      usuario: nuevoUsuario._id,
      usuarioModelo: "Usuario",
      email,
      accion: "registro_usuario",
      resultado: "exito",
      entidadId: nuevoUsuario._id
    })

    res.status(201).json({
      msg: "Usuario registrado, revisa tu correo para confirmar la cuenta"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      msg: "Error en el servidor"
    })
  }
}


const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        msg: "Debes llenar todos los campos" 
      })
    }

    // 🔍 Buscar primero en usuarios
    let usuario = await Usuario.findOne({ email })

    let tipo = "usuario"

    // 🔍 Si no existe, buscar en administradores
    if (!usuario) {
      usuario = await Administrador.findOne({ email })
      tipo = "administrador"
    }

    // ❌ No existe en ninguno
    if (!usuario) {
      await registrarActividad({
        email,
        accion: "login_fallido",
        resultado: "fallo",
        detalles: { motivo: "credenciales incorrectas" }
      })

      return res.status(401).json({ 
        msg: "Credenciales incorrectas" 
      })
    }

    // 🔒 Verificación de email
    if (!usuario.confirmEmail) {
      await registrarActividad({
        usuario: usuario._id,
        usuarioModelo: tipo === "administrador" ? "Administrador" : "Usuario",
        email,
        accion: "login_fallido",
        resultado: "fallo",
        detalles: { motivo: "cuenta no verificada" }
      })

      return res.status(403).json({
        msg: "Debes verificar tu cuenta antes de iniciar sesión"
      })
    }

    // 🚫 Validar estado de la cuenta
    if (usuario.estado === "inactivo") {
      await registrarActividad({
        usuario: usuario._id,
        usuarioModelo: tipo === "administrador" ? "Administrador" : "Usuario",
        email,
        accion: "login_fallido",
        resultado: "fallo",
        detalles: { motivo: "cuenta desactivada" }
      })

      return res.status(403).json({
        msg: "Tu cuenta ha sido desactivada"
      })
    }

    // 🔐 Validar password
    const passwordValido = await usuario.matchPassword(password)

    if (!passwordValido) {
      await registrarActividad({
        usuario: usuario._id,
        usuarioModelo: tipo === "administrador" ? "Administrador" : "Usuario",
        email,
        accion: "login_fallido",
        resultado: "fallo",
        detalles: { motivo: "contraseña incorrecta" }
      })

      return res.status(401).json({ 
        msg: "Credenciales incorrectas" 
      })
    }

    // 🎯 Datos
    const { nombre, apellido, rol, _id } = usuario

    const token = createTokenJWT(_id, rol)

    
    await registrarActividad({
      usuario: _id,
      usuarioModelo: tipo === "administrador" ? "Administrador" : "Usuario",
      email,
      accion: "login_exitoso",
      resultado: "exito"
    })

    res.status(200).json({
      token,
      rol,
      nombre,
      apellido,
      _id,
      email: usuario.email,
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}



//Controlador para confirmar mail 
const confirmarEmail = async (req, res) => {
  try {
    const { token } = req.params

    // 🔍 Buscar en usuarios
    let usuario = await Usuario.findOne({ verifyToken: token })

    let tipo = "usuario"

    // 🔍 Si no existe, buscar en administradores
    if (!usuario) {
      usuario = await Administrador.findOne({ verifyToken: token })
      tipo = "administrador"
    }

    // ❌ No existe en ninguno
    if (!usuario) {
      return res.status(404).json({
        msg: "Token inválido o cuenta ya confirmada"
      })
    }

    // ✅ Confirmar cuenta
    usuario.verifyToken = null
    usuario.confirmEmail = true

    await usuario.save()

    res.status(200).json({
      msg: `Cuenta de ${tipo} confirmada, ya puedes iniciar sesión`
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}

//Controler para recibir correo de recuperación de contraseña
const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        msg: "Debes ingresar un correo electrónico"
      })
    }

    // 🔍 Buscar en ambas colecciones
    let usuario = await Usuario.findOne({ email })

    if (!usuario) {
      usuario = await Administrador.findOne({ email })
    }

    // 🔐 Siempre responder lo mismo (no revelar info)
    if (!usuario) {
      return res.status(200).json({
        msg: "Si el correo está registrado, recibirás instrucciones"
      })
    }

    // (Opcional) puedes decidir si bloquear no confirmados
    if (!usuario.confirmEmail) {
      return res.status(403).json({
        msg: "Debes verificar tu cuenta primero"
      })
    }

    // 🔑 Generar token
    const token = usuario.createToken()
    usuario.resetToken = token

    await usuario.save()

    await sendMailToRecoveryPassword(email, token)

    res.status(200).json({
      msg: "Revisa tu correo electrónico para restablecer tu contraseña"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}


const comprobarTokenPassword = async (req, res) => {
  try {
    const { token } = req.params

    let usuario = await Usuario.findOne({ resetToken: token })

    if (!usuario) {
      usuario = await Administrador.findOne({ resetToken: token })
    }

    if (!usuario || !usuario.confirmEmail) {
      return res.status(400).json({
        msg: "Token inválido o expirado"
      })
    }

    // 🔐 (Opcional) validar expiración
    if (usuario.resetTokenExpire < Date.now()) {
      return res.status(400).json({
        msg: "Token expirado"
      })
    }

    res.status(200).json({
      msg: "Token confirmado, ya puedes crear tu nueva contraseña"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}

const crearNuevoPassword = async (req, res) => {
  try {
    const { password, confirmpassword} = req.body
    const { token } = req.params

    if (!password || !confirmpassword) {
      return res.status(400).json({ msg: "Debes llenar todos los campos." })
    }

    if (password !== confirmpassword) {
      return res.status(400).json({ msg: "Las contraseñas no coinciden" })
    }

    if (password.length < 8) {
      return res.status(400).json({
        msg: "La contraseña debe tener al menos 8 caracteres"
      })
    }

    let usuario = await Usuario.findOne({ resetToken: token })

    if (!usuario) {
      usuario = await Administrador.findOne({ resetToken: token })
    }

    if (!usuario) {
      return res.status(404).json({
        msg: "Token inválido o expirado"
      })
    }

    if (!usuario.confirmEmail) {
      return res.status(403).json({
        msg: "Cuenta no verificada"
      })
    }

    // 🔐 Validar expiración
    if (usuario.resetTokenExpire < Date.now()) {
      return res.status(400).json({
        msg: "Token expirado"
      })
    }

    // 🔑 Actualizar password (SIN hash manual)
    usuario.password = password

    // 🧹 limpiar tokens
    usuario.resetToken = null
    usuario.resetTokenExpire = null

    await usuario.save()

    res.status(200).json({
      msg: "Ya puedes iniciar sesión con tu nueva contraseña"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}
export{ 
    registroUsuario,
    login, 
    confirmarEmail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevoPassword

}