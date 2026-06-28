import Usuario from "../models/Usuario.js"
import Administrador from "../models/Administrador.js"

const perfil = async (req, res) => {
  try {
    const {
      _id,
      nombre,
      apellido,
      email,
      avatar,
      rol,
      carrera,
      createdAt,
      updatedAt
    } = req.usuario

    const respuesta = {
      _id,
      nombre,
      apellido,
      email,
      avatar,
      rol,
      createdAt,
      updatedAt
    }

    if (rol === "usuario") {
      respuesta.carrera = carrera
    }

    res.status(200).json(respuesta)

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}


const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, apellido, avatar, carrera } = req.body

    // Obtener documento completo según el rol
    const modelo = req.usuario.rol === "administrador" ? Administrador : Usuario
    const usuario = await modelo.findById(req.usuario._id)

    // Validar nombre si viene en el body
    if (nombre !== undefined) {
      if (nombre.length < 3) {
        return res.status(400).json({ msg: "El nombre debe tener al menos 3 caracteres" })
      }
      if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(nombre)) {
        return res.status(400).json({ msg: "El nombre solo puede contener letras" })
      }
    }

    // Validar apellido si viene en el body
    if (apellido !== undefined) {
      if (apellido.length < 3) {
        return res.status(400).json({ msg: "El apellido debe tener al menos 3 caracteres" })
      }
      if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(apellido)) {
        return res.status(400).json({ msg: "El apellido solo puede contener letras" })
      }
    }

    usuario.nombre   = nombre   || usuario.nombre
    usuario.apellido = apellido || usuario.apellido
    usuario.avatar   = avatar   || usuario.avatar

    if (usuario.rol === "usuario") {
      usuario.carrera = carrera || usuario.carrera
    }

    await usuario.save()

    res.status(200).json({
      msg: "Perfil actualizado correctamente",
      usuario: {
        nombre:   usuario.nombre,
        apellido: usuario.apellido,
        avatar:   usuario.avatar,
        ...(usuario.rol === "usuario" && { carrera: usuario.carrera })
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}


const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva, confirmarPassword } = req.body

    // Obtener documento completo según el rol
    const modelo = req.usuario.rol === "administrador" ? Administrador : Usuario
    const usuario = await modelo.findById(req.usuario._id)

    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" })
    }

    if (passwordNueva.length < 8) {
      return res.status(400).json({ msg: "La contraseña debe tener mínimo 8 caracteres" })
    }

    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
    if (!regexPassword.test(passwordNueva)) {
      return res.status(400).json({ msg: "La contraseña debe contener mayúscula, minúscula y número" })
    }

    if (passwordNueva !== confirmarPassword) {
      return res.status(400).json({ msg: "Las contraseñas no coinciden" })
    }

    const passwordValida = await usuario.matchPassword(passwordActual)
    if (!passwordValida) {
      return res.status(400).json({ msg: "La contraseña actual es incorrecta" })
    }

    const mismaPassword = await usuario.matchPassword(passwordNueva)
    if (mismaPassword) {
      return res.status(400).json({ msg: "La nueva contraseña no puede ser igual a la actual" })
    }

    usuario.password = passwordNueva
    await usuario.save()

    res.status(200).json({ msg: "Contraseña actualizada correctamente" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}

export{
    perfil,
    actualizarPerfil,
    cambiarPassword
}