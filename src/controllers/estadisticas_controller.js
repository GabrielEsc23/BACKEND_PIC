import Proyecto from "../models/Proyecto.js";
import Administrador from "../models/Administrador.js"
import Usuario from "../models/Usuario.js"

const obtenerEstadisticas=async(req,res)=>{
    try{
        // Mostrar el número total de proyectos realizados
        const totalProyectos=await Proyecto.countDocuments()

        //Número de tesis por carrera 
        const proyecto_carrera = await Proyecto.aggregate([
        { $group: {_id: "$carrera", total: { $sum: 1 } }}])

        //Proytectos por perido por periodo
        const proyecto_periodo= await Proyecto.aggregate([{$group:{_id:"$periodoAcademico",total:{$sum:1}}}])

        //Proyectos por tutor
        const proyecto_tutor= await Proyecto.aggregate([{$group:{_id:"$tutor",total:{$sum:1}}}])

        const usuario_carrera = await Usuario.aggregate([{$group:{_id:"$carrera",total:{$sum:1}}}])

        //Usuarios registrados por rol
        const totalAdministradores = await Administrador.countDocuments()
        const totalUsuarios = await Usuario.countDocuments()

        res.status(200).json({
        totalProyectos,
        proyecto_carrera,
        proyecto_tutor,
        proyecto_periodo,
        totalAdministradores,
        totalUsuarios,
        usuario_carrera
    })

    }catch(error){
        console.log(error)
      res.status(500).json({
      msg: "Error en el servidor"
    })
    }
}
export  {
    obtenerEstadisticas
}