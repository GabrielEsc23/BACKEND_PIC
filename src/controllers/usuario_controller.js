import Usuario from "../models/Usuario.js";
import Proyecto from "../models/Proyecto.js";
import registrarActividad from "../helpers/RegistrarActividad.js"



const desactivarCuentaUsuario = async (req, res) => {
  try {

    await Usuario.findByIdAndUpdate(
      req.usuario._id,
      { estado: "inactivo" }
    )

    // Log: el propio usuario desactivó su cuenta
    await registrarActividad({
      usuario: req.usuario._id,
      usuarioModelo: "Usuario",
      email: req.usuario.email,
      accion: "autodesactivar_cuenta",
      resultado: "exito",
      entidadId: req.usuario._id
    })

    res.status(200).json({
      msg: "Cuenta desactivada correctamente. Si deseas reactivarla, comunícate con el administrador del sistema."
    })

  } catch (error) {
    console.error(error)

    res.status(500).json({
      msg: "Error en el servidor"
    })
  }
}

export{
    
    desactivarCuentaUsuario
}