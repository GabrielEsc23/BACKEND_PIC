import LogActividad from "../models/LogActividad.js"

// Lista los logs de actividad con filtros opcionales por query string:
// ?accion=login_fallido&resultado=fallo&desde=2026-06-01&hasta=2026-06-23&page=1&limit=20
const listarLogs = async (req, res) => {
  try {

    const { accion, resultado, desde, hasta, page, limit } = req.query

    const pagina = Math.max(1, parseInt(page) || 1)
    const limite = Math.min(100, Math.max(1, parseInt(limit) || 20))

    const filtro = {}

    if (accion) filtro.accion = accion
    if (resultado) filtro.resultado = resultado

    if (desde || hasta) {
      filtro.createdAt = {}
      if (desde) filtro.createdAt.$gte = new Date(desde)
      if (hasta) filtro.createdAt.$lte = new Date(hasta)
    }

    const [total, logs] = await Promise.all([
      LogActividad.countDocuments(filtro),
      LogActividad.find(filtro)
        .sort({ createdAt: -1 })
        .skip((pagina - 1) * limite)
        .limit(limite)
        .lean()
    ])

    res.status(200).json({
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      logs
    })

  } catch (error) {
    console.error("Error al listar logs:", error)
    res.status(500).json({ msg: "Error en el servidor" })
  }
}

export { listarLogs }