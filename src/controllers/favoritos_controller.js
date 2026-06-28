import Usuario from "../models/Usuario.js"
import Administrador from "../models/Administrador.js"

const agregarFavorito = async (req, res) => {
  try {
    const { id } = req.params

    let usuario = await Usuario.findById(req.usuario._id)

    if (!usuario) {
      usuario = await Administrador.findById(req.usuario._id)
    }

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" })
    }

    if (usuario.favoritos.includes(id)) {
      return res.status(400).json({ msg: "Ya está en favoritos" })
    }

    usuario.favoritos.push(id)

    await usuario.save()

    res.json({ msg: "Agregado a favoritos" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}

const eliminarFavorito= async(req,res)=>{
    try {
  const { id } = req.params

  let usuario = await Usuario.findById(req.usuario._id)

  if (!usuario) {
    usuario = await Administrador.findById(req.usuario._id)
  }

  if (!usuario) {
    return res.status(400).json({ msg: "Usuario no encontrado" })
  }

  usuario.favoritos = usuario.favoritos.filter(
    fav => fav.toString() !== id
  )

  await usuario.save()

  res.json({ msg: "Eliminado de favoritos" })

} catch (error) {
  console.log(error)
  res.status(500).json({ msg: "Error en el servidor" })
}
}
    

const obtenerFavoritos = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ msg: "No autenticado" });
    }

    console.log("Usuario:", req.usuario);

    let usuario;

    if (req.usuario.rol === "administrador") {
      usuario = await Administrador.findById(req.usuario._id).populate("favoritos");
    } else {
      usuario = await Usuario.findById(req.usuario._id).populate("favoritos");
    }

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    console.log("Favoritos:", usuario.favoritos);

    res.json(usuario.favoritos);

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

const eliminarTodosFavoritos = async (req, res) => {
  try {

    let usuario = await Usuario.findById(req.usuario._id)

    if (!usuario) {
      usuario = await Administrador.findById(req.usuario._id)
    }

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" })
    }

    usuario.favoritos = []

    await usuario.save()

    res.json({
      msg: "Todos los favoritos fueron eliminados"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      msg: "Error en el servidor"
    })
  }
}

const eliminarVariosFavoritos = async (req, res) => {
  try {

    const { proyectos } = req.body

    if (!Array.isArray(proyectos) || proyectos.length === 0) {
      return res.status(400).json({
        msg: "Debe enviar una lista de proyectos"
      })
    }

    let usuario = await Usuario.findById(req.usuario._id)

    if (!usuario) {
      usuario = await Administrador.findById(req.usuario._id)
    }

    if (!usuario) {
      return res.status(404).json({
        msg: "Usuario no encontrado"
      })
    }

    

    usuario.favoritos = usuario.favoritos.filter(
    fav => !proyectos.includes(fav.toString())
)



    await usuario.save()

    res.json({
      msg: "Favoritos eliminados correctamente"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      msg: "Error en el servidor"
    })
  }
}

export{
    agregarFavorito,
    eliminarFavorito,
    obtenerFavoritos,
    eliminarTodosFavoritos,
    eliminarVariosFavoritos
}