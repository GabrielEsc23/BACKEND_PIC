import Proyecto from "../models/Proyecto.js";
import Conversacion from "../models/Conversacion.js";
import {
  interpretarConsulta,
  generarRespuestaNatural,
  generarIdeasProyecto
} from "../services/chatbot.service.js";

// Campos válidos del modelo Proyecto que se pueden listar o agrupar.
// Sirve como whitelist para que la IA no pueda inventar un campo que no existe.
const CAMPOS_VALIDOS = {
  tutor: "Tutores",
  autor: "Autores",
  periodoAcademico: "Períodos académicos",
  carrera: "Carreras",
  tecnologias: "Tecnologías",
  titulo: "Títulos"
};

// Cuántos mensajes previos (usuario + asistente) se mandan como contexto al LLM
const MENSAJES_DE_CONTEXTO = 10;

// Mapea el campo "rol" del usuario autenticado al nombre del modelo de Mongoose
// req.usuario.rol === "administrador" -> colección Administrador
// cualquier otro valor (ej. "usuario") -> colección Usuario
const obtenerModeloUsuario = (rol) => {
  return rol === "administrador" ? "Administrador" : "Usuario";
};

const chat = async (req, res) => {
  try {
    const { mensaje, conversacionId } = req.body;
    const usuarioId = req.usuario._id;
    const usuarioModelo = obtenerModeloUsuario(req.usuario.rol);

    if (!mensaje || mensaje.trim() === "") {
      return res.json({
        respuesta: "Escribe tu consulta, por ejemplo: \"proyectos de software del 25-A\" o \"dame ideas sobre ciberseguridad\".",
        proyectos: []
      });
    }

    // ==========================================
    // OBTENER O CREAR LA CONVERSACIÓN
    // ==========================================
    let conversacion;

    if (conversacionId) {
      conversacion = await Conversacion.findOne({
        _id: conversacionId,
        usuario: usuarioId
      });

      if (!conversacion) {
        return res.status(404).json({
          error: "No se encontró esa conversación."
        });
      }
    } else {
      conversacion = await Conversacion.create({
        usuario: usuarioId,
        usuarioModelo,
        titulo: mensaje.slice(0, 60),
        mensajes: []
      });
    }

    // Toma los últimos N mensajes YA guardados como contexto (antes de agregar el mensaje actual)
    const historial = conversacion.mensajes.slice(-MENSAJES_DE_CONTEXTO);

    const respuestaIA = await interpretarConsulta(mensaje, historial);
    const datos = JSON.parse(respuestaIA.trim());

    console.log("DATOS IA:", JSON.stringify(datos, null, 2));

    // ==========================================
    // LIMPIEZA DE FILTROS
    // ==========================================
    const filtrosLimpios = {};
    if (datos.filtros) {
      Object.keys(datos.filtros).forEach(key => {
        if (key === "busquedaGeneral") return;
        const valor = datos.filtros[key];
        if (valor && typeof valor === "object" && Object.keys(valor).length > 0) {
          filtrosLimpios[key] = valor;
        } else if (typeof valor !== "object" && valor !== "") {
          filtrosLimpios[key] = valor;
        }
      });
    }

    if (datos.busquedaGeneral && datos.busquedaGeneral.trim() !== "") {
      filtrosLimpios.$text = { $search: datos.busquedaGeneral };
    }

    // Guarda el mensaje del usuario en la conversación y devuelve la respuesta final.
    // Centraliza el guardado para no repetirlo en cada bloque de tipo.
    const responderYGuardar = async (respuestaTexto, proyectosResultado = []) => {
      conversacion.mensajes.push({ rol: "usuario", contenido: mensaje });
      conversacion.mensajes.push({ rol: "asistente", contenido: respuestaTexto });
      await conversacion.save();

      return res.json({
        respuesta: respuestaTexto,
        proyectos: proyectosResultado,
        conversacionId: conversacion._id
      });
    };

    // ==========================================
    // TIPO: CONTAR
    // ==========================================
    if (datos.tipo === "contar") {
      const total = await Proyecto.countDocuments(filtrosLimpios);
      return await responderYGuardar(
        `Encontré **${total} proyecto(s)** que coinciden con tu búsqueda.`
      );
    }

    // ==========================================
    // TIPO: AGRUPAR
    // ==========================================
    if (datos.tipo === "agrupar") {
      const campo = datos.campo_solicitado;

      if (!campo || !CAMPOS_VALIDOS[campo]) {
        return await responderYGuardar(
          "No puedo agrupar por ese campo. Puedo agruparte por: " +
            Object.values(CAMPOS_VALIDOS).join(", ") + "."
        );
      }

      const resultado = await Proyecto.aggregate([
        { $match: filtrosLimpios },
        { $group: { _id: `$${campo}`, total: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]);

      if (resultado.length === 0) {
        return await responderYGuardar("No encontré datos para agrupar.");
      }

      const lista = resultado
        .map((r, i) => `${i + 1}. ${r._id || "Sin especificar"}: ${r.total} proyecto(s)`)
        .join("\n");

      return await responderYGuardar(
        `**Proyectos por ${CAMPOS_VALIDOS[campo]}:**\n\n${lista}`,
        resultado
      );
    }

    // ==========================================
    // TIPO: LISTAR UN CAMPO ESPECÍFICO
    // ==========================================
    if (datos.tipo === "listar_campo") {
      const campo = datos.campo_solicitado;

      if (!campo || !CAMPOS_VALIDOS[campo]) {
        return await responderYGuardar(
          "No puedo mostrar ese campo. Puedo mostrarte: " +
            Object.values(CAMPOS_VALIDOS).join(", ") + "."
        );
      }

      const resultado = await Proyecto.find(filtrosLimpios)
        .select(campo)
        .lean();

      const valores = [...new Set(
        resultado
          .flatMap(p => Array.isArray(p[campo]) ? p[campo] : [p[campo]])
          .filter(Boolean)
      )];

      if (valores.length === 0) {
        return await responderYGuardar("No encontré datos para ese campo con los filtros indicados.");
      }

      const etiqueta = CAMPOS_VALIDOS[campo];
      const lista = valores.map((v, i) => `${i + 1}. ${v}`).join("\n");

      return await responderYGuardar(
        `**${etiqueta} encontrados (${valores.length}):**\n\n${lista}`,
        valores
      );
    }

    // ==========================================
    // TIPO: IDEA_PROYECTO (GENERADO POR IA)
    // ==========================================
    if (datos.tipo === "idea_proyecto") {

      // Respaldo: si el LLM no devolvió un tema (debería haberlo heredado del
      // historial pero puede fallar), intenta usar el último tema guardado
      // en la conversación antes de pedir aclaración al usuario.
      let tema = datos.tema && datos.tema.trim() !== ""
        ? datos.tema.trim()
        : conversacion.ultimoTema;

      if (!tema || tema.trim() === "") {
        return await responderYGuardar(
          "¿Sobre qué tema o tecnología te gustaría ideas de proyecto? Por ejemplo: salud, turismo, react, flutter..."
        );
      }

      const ideas = await generarIdeasProyecto(
        tema,
        datos.carreraRelacionada || "",
        conversacion.ideasGeneradas || []
      );

      if (!ideas || ideas.length === 0) {
        return await responderYGuardar(
          "No pude generar ideas en este momento. Inténtalo de nuevo en unos segundos."
        );
      }

      // Guarda el tema usado y los títulos generados para evitar repetirlos en el futuro
      conversacion.ultimoTema = tema;
      conversacion.ideasGeneradas.push(...ideas.map(idea => idea.titulo));

      const introCarrera = datos.carreraRelacionada
        ? ` pensadas para ${datos.carreraRelacionada}`
        : "";

      const lista = ideas.map((idea, i) => `
**${i + 1}. ${idea.titulo}**
${idea.descripcion}
*Tecnologías sugeridas: ${idea.tecnologias?.join(", ") || "No especificadas"}*
`).join("\n");

      return await responderYGuardar(
        `Aquí tienes 3 ideas de proyecto sobre "${tema}"${introCarrera}:\n${lista}`
      );
    }

    // ==========================================
    // TIPO: BUSCAR (default — proyectos del sistema PIC)
    // ==========================================
    if (Object.keys(filtrosLimpios).length === 0 && !datos.limite) {
      return await responderYGuardar(
        "Por favor dime qué tipo de proyectos buscas. Puedes filtrar por tecnología, carrera, autor, período académico o tutor."
      );
    }

    const proyectos = await Proyecto.find(filtrosLimpios)
      .sort(datos.orden || { createdAt: -1 })
      .limit(datos.limite || 10)
      .lean();

    const respuestaNatural = await generarRespuestaNatural(mensaje, proyectos);

    return await responderYGuardar(respuestaNatural, proyectos);

  } catch (error) {
    console.error("Error en Chat Controller:", error);

    if (error.tipoError === "RATE_LIMIT") {
      return res.status(429).json({
        respuesta: "El asistente alcanzó su límite de uso por hoy. Por favor, inténtalo de nuevo más tarde.",
        proyectos: []
      });
    }

    res.status(500).json({
      error: "Hubo un error al procesar tu mensaje. Inténtalo de nuevo."
    });
  }

};


// =============================
// LISTAR CONVERSACIONES DEL USUARIO
// =============================
const listarConversaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    const conversaciones = await Conversacion.find({ usuario: usuarioId })
      .select("titulo createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ conversaciones });

  } catch (error) {
    console.error("Error al listar conversaciones:", error);

    if (error.tipoError === "RATE_LIMIT") {
      return res.status(429).json({
        error: "El asistente alcanzó su límite de uso por hoy. Por favor, inténtalo de nuevo más tarde."
      });
    }

    res.status(500).json({ error: "No se pudieron obtener las conversaciones." });
  }
};


// =============================
// OBTENER UNA CONVERSACIÓN (HISTORIAL COMPLETO)
// =============================
const obtenerConversacion = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { id } = req.params;

    const conversacion = await Conversacion.findOne({
      _id: id,
      usuario: usuarioId
    }).lean();

    if (!conversacion) {
      return res.status(404).json({ error: "No se encontró esa conversación." });
    }

    res.json({ conversacion });

  } catch (error) {
    console.error("Error al obtener conversación:", error);

    if (error.tipoError === "RATE_LIMIT") {
      return res.status(429).json({
        error: "El asistente alcanzó su límite de uso por hoy. Por favor, inténtalo de nuevo más tarde."
      });
    }

    res.status(500).json({ error: "No se pudo obtener la conversación." });
  }
};


// =============================
// ELIMINAR UNA CONVERSACIÓN
// =============================
const eliminarConversacion = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;
    const { id } = req.params;

    const conversacion = await Conversacion.findOneAndDelete({
      _id: id,
      usuario: usuarioId
    });

    if (!conversacion) {
      return res.status(404).json({ error: "No se encontró esa conversación." });
    }

    res.json({ msg: "Conversación eliminada correctamente." });

  } catch (error) {
    console.error("Error al eliminar conversación:", error);

    if (error.tipoError === "RATE_LIMIT") {
      return res.status(429).json({
        error: "El asistente alcanzó su límite de uso por hoy. Por favor, inténtalo de nuevo más tarde."
      });
    }

    res.status(500).json({ error: "No se pudo eliminar la conversación." });
  }
};

export { chat, listarConversaciones, obtenerConversacion, eliminarConversacion };