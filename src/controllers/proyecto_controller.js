import Proyecto from "../models/Proyecto.js"; // Importa tu modelo
import { subirPDF,subirPortada } from "../config/cloudinary.js";
 // Tu función de subida
import { v2 as cloudinary } from "cloudinary";

import streamifier from 'streamifier';

import formatearPeriodo from "../helpers/formatearPeriodo.js";

import { filtrarProyecto,filtrarProyectos } from "../helpers/filtrarProyectoPorRol.js";
import registrarActividad from "../helpers/RegistrarActividad.js";

const crearProyecto = async (req,res)=>{
try{

 // Validar PDF obligatorio
 if(!req.files?.archivoPDF){
    return res.status(400).json({
       msg:"El archivo PDF es obligatorio"
    })
 }

 // PDF
 const resultadoPDF = await subirPDF(
    req.files.archivoPDF[0].buffer
 )

 // objeto portada por defecto
 let portadaData={
    url:"https://res.cloudinary.com/dlya09ut7/image/upload/v1778961329/PORTADA_PIC_tc0ywj.png",
    public_id:null
 }

 // Si suben portada
 if(req.files?.portada){

    const resultadoPortada = await subirPortada(
       req.files.portada[0].buffer
    )

    portadaData={
       url:resultadoPortada.secure_url,
       public_id:resultadoPortada.public_id
    }

 }
 const periodos = Array.isArray(req.body.periodoAcademico)
 ? req.body.periodoAcademico
 : [req.body.periodoAcademico]

const periodosFormateados = periodos
  .map(formatearPeriodo)

if(periodosFormateados.includes(null)){
   return res.status(400).json({
      msg:"Formato de periodo inválido. Ejemplo: 25-A"
   })
}
 // Crear proyecto
 const nuevoProyecto = new Proyecto({

    titulo:req.body.titulo,

    descripcion:req.body.descripcion,

    autor:req.body.autor,

    fecha:req.body.fecha,

    tutor:req.body.tutor,

    palabrasClave:[
      ...new Set(
      req.body.palabrasClave
      ?.split(",")
      .map(t=>t.trim().toLowerCase())
      )
    ],

    tecnologias:[
      ...new Set(
      req.body.tecnologias
      ?.split(",")
      .map(t=>t.trim().toLowerCase())
      )
    ],

    periodoAcademico:[
      ...new Set(periodosFormateados)
    ],

    

   

    carrera:req.body.carrera,

    repositorio:req.body.repositorio,

    video:req.body.video,

    archivoPDF:resultadoPDF.secure_url,

    portada:portadaData,

    registradoPor:req.usuario._id

 })

 const proyectoGuardado = await nuevoProyecto.save()

 const proyectoCompleto=
 await Proyecto.findById(
      proyectoGuardado._id
 )
 .populate(
     "registradoPor",
     "nombre apellido email"
 )

const respuesta = {
   ...filtrarProyecto(proyectoCompleto,req.usuario),
   
   portadaUrl: proyectoCompleto.portada.url
}

// Log: proyecto creado exitosamente
await registrarActividad({
  usuario: req.usuario._id,
  usuarioModelo: req.usuario.rol === "administrador" ? "Administrador" : "Usuario",
  accion: "crear_proyecto",
  resultado: "exito",
  entidadId: proyectoGuardado._id,
  detalles: { titulo: proyectoGuardado.titulo }
})

res.status(201).json(respuesta)

}catch(error){

console.log(error)

res.status(500).json({
msg:"Error al crear proyecto"
})

}
}

 const eliminarProyecto = async (req, res) => {
  const { id } = req.params; // Obtenemos el ID del proyecto de la URL

  try {
    // 1. Buscar el proyecto en la base de datos
    const proyecto = await Proyecto.findById(id);

    if (!proyecto) {
      return res.status(404).json({ msg: "Proyecto no encontrado" });
    }

    // 2. Extraer el public_id de la URL de Cloudinary
    // Ejemplo URL: .../v12345/proyectos/p1jemisue.pdf -> public_id: proyectos/p1jemisue
    const urlParts = proyecto.archivoPDF.split("/");
    const fileName = urlParts[urlParts.length - 1]; // p1jemisue.pdf
    const publicId = `proyectos/${fileName.split(".")[0]}`; // proyectos/p1jemisue

    // 3. Eliminar archivo de Cloudinary
    // Usamos resource_type: "image" o "raw" dependiendo de cómo lo subiste
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });

    // Guardamos datos del proyecto antes de borrarlo, para el detalle del log
    const tituloEliminado = proyecto.titulo
    const idEliminado = proyecto._id

    // 4. Eliminar el registro de MongoDB
    await proyecto.deleteOne();

    // Log: proyecto eliminado exitosamente
    await registrarActividad({
      usuario: req.usuario._id,
      usuarioModelo: req.usuario.rol === "administrador" ? "Administrador" : "Usuario",
      email:req.usuario.email,
      accion: "eliminar_proyecto",
      resultado: "exito",
      entidadId: idEliminado,
      detalles: { titulo: tituloEliminado }
    })

    res.json({ msg: "Proyecto y archivo eliminados correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar el proyecto", error: error.message });
  }
};


// Oculta o vuelve a mostrar un proyecto sin eliminarlo de la base de datos.
// Solo administradores deberían poder usar este endpoint (verificar en la ruta).
const cambiarVisibilidadProyecto = async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    if (!["visible", "oculto"].includes(estado)) {
      return res.status(400).json({ msg: "Estado inválido" })
    }

    const proyecto = await Proyecto.findById(id)

    if (!proyecto) {
      return res.status(404).json({ msg: "Proyecto no encontrado" })
    }

    proyecto.estado = estado
    await proyecto.save()

    // Log: cambio de visibilidad de proyecto
    await registrarActividad({
      usuario: req.usuario._id,
      usuarioModelo: req.usuario.rol === "administrador" ? "Administrador" : "Usuario",
      accion: "cambiar_visibilidad_proyecto",
      resultado: "exito",
      entidadId: proyecto._id,
      detalles: { titulo: proyecto.titulo, nuevoEstado: estado }
    })

    res.status(200).json({
      msg: `Proyecto ${estado === "oculto" ? "ocultado" : "mostrado"} correctamente`
    })

  } catch (error) {
    console.error("Error en cambiarVisibilidadProyecto:", error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}





const actualizarProyecto = async (req, res) => {
  try {
    const { id } = req.params

    let proyecto = await Proyecto.findById(id)

    if (!proyecto) {
      return res.status(404).json({ msg: "Proyecto no encontrado" })
    }

    

    // 🟡 Si viene nuevo PDF → subirlo
    if (req.file) {
      const resultado = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "proyectos",
            public_id: "proyecto-" + Date.now()
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )

        streamifier.createReadStream(req.file.buffer).pipe(stream)
      })

      proyecto.archivoPDF = resultado.secure_url
    }

    // 🟢 Actualizar campos
    proyecto.titulo = req.body.titulo || proyecto.titulo
    proyecto.descripcion = req.body.descripcion || proyecto.descripcion
    proyecto.autor = req.body.autor || proyecto.autor
    proyecto.tutor = req.body.tutor || proyecto.tutor
    proyecto.periodoAcademico = req.body.periodoAcademico || proyecto.periodoAcademico
    proyecto.carrera = req.body.carrera || proyecto.carrera
    proyecto.repositorio = req.body.repositorio || proyecto.repositorio
    proyecto.video = req.body.video || proyecto.video

    // arrays
    if (req.body.palabrasClave) {
      palabrasClave: [...new Set(
      req.body.palabrasClave
      ?.split(",")
      .map(t => t.trim().toLowerCase())
     )]
    }

    if (req.body.tecnologias) {
      proyecto.tecnologias = [...new Set(
      req.body.tecnologias
      .split(",")
      .map(t => t.trim().toLowerCase())
)]
    }

    await proyecto.save()

    // Log: proyecto actualizado exitosamente
    await registrarActividad({
      usuario: req.usuario._id,
      usuarioModelo: req.usuario.rol === "administrador" ? "Administrador" : "Usuario",
      accion: "actualizar_proyecto",
      resultado: "exito",
      entidadId: proyecto._id,
      detalles: { titulo: proyecto.titulo }
    })

    res.status(200).json({
      msg: "Proyecto actualizado correctamente"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}



const obtenerProyecto = async (req, res) => {
  try {
    const {
      titulo,
      carrera,
      tecnologias,
      periodoAcademico,
      autor,
      tutor,
      page,
      limit
    } = req.query

    const pagina = Math.max(1, parseInt(page) || 1)
    const limite = Math.min(50, Math.max(1, parseInt(limit) || 10))

    const filtro = {}

    // Los usuarios normales solo ven proyectos visibles.
    // Los administradores pueden ver también los proyectos ocultos.
    if (!req.usuario || req.usuario.rol !== "administrador") {
    filtro.estado = "visible"
  }

    // String(text) evita que la función falle si el query param llega como
    // array (ej. ?titulo=a&titulo=b), caso en el que .replace() no existiría.
    const escapeRegex = (text) =>
      String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

    // búsqueda por título
    if (titulo) {
      filtro.titulo = {
        $regex: escapeRegex(titulo),
        $options: "i"
      }
    }

    if (carrera)
      filtro.carrera = {
        $regex: escapeRegex(carrera),
        $options: "i"
      }

    if (autor)
      filtro.autor = {
        $regex: escapeRegex(autor),
        $options: "i"
      }

    if (tutor)
      filtro.tutor = {
        $regex: escapeRegex(tutor),
        $options: "i"
      }



    if (tecnologias) {
      const lista = tecnologias
        .split(",")
        .map(t => t.trim())

      filtro.tecnologias = {
        $in: lista.map(
          t => new RegExp(escapeRegex(t), "i")
        )
      }
    }

    if (periodoAcademico) {

      const periodoNormalizado = periodoAcademico
        .toUpperCase()
        .replace(/\s+/g, "") // elimina espacios

      // convierte "25A" → "25-A" (2 dígitos) y "2025A" → "25-A" (4 dígitos,
      // se toman solo los últimos 2 para mantener el formato de la BD)
      const periodoConGuion = periodoNormalizado
        .replace(/^\d{2}(\d{2})([A-Z])$/, "$1-$2") // 4 dígitos -> usa los 2 últimos
        .replace(/^(\d{2})([A-Z])$/, "$1-$2")       // 2 dígitos -> agrega guión

      filtro.periodoAcademico = {
        $regex: `^${escapeRegex(periodoConGuion)}$`,
        $options: "i"
      }
    }

    const [total, proyectos] = await Promise.all([

      Proyecto.countDocuments(filtro),

      Proyecto.find(filtro)
        .populate("registradoPor", "nombre email")
        .skip((pagina - 1) * limite)
        .limit(limite)
        .sort({ createdAt: -1 })
        .lean()
    ])


    res.json({
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      resultados: filtrarProyectos(proyectos,req.usuario)
    })

  } catch(error){
    console.error("Error en obtenerProyecto:", error)
    res.status(500).json({
      msg:"Error del servidor"
    })
  }
}

export {
  crearProyecto,
  eliminarProyecto,
  actualizarProyecto,
  obtenerProyecto,
  cambiarVisibilidadProyecto

}