const ADMIN = "administrador"

const filtrarProyecto = (proyecto, usuario) => {
  const esAdmin = usuario?.rol === ADMIN
  const obj = proyecto.toObject ? proyecto.toObject() : { ...proyecto }

  if (!esAdmin) {
    delete obj.registradoPor
    delete obj.createdAt
    delete obj.updatedAt
  }

  return obj
}

const filtrarProyectos = (proyectos, usuario) =>
  proyectos.map(p => filtrarProyecto(p, usuario))

export { filtrarProyecto, filtrarProyectos }