// helpers/formatearPeriodo.js

const formatearPeriodo = (periodo = "") => {

  periodo = periodo.trim().toUpperCase()

  const match = periodo.match(/^(\d{2}|\d{4})[- ]?([AB])$/)

  if (!match) return null

  let [, anio, ciclo] = match

  if (anio.length === 4) {
    anio = anio.slice(-2)
  }

  return `${anio}-${ciclo}`
}

export default formatearPeriodo