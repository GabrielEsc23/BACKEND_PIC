import Groq from "groq-sdk";
import Proyecto from "../models/Proyecto.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Detecta si un error viene de un límite de cuota/rate limit de Groq (HTTP 429)
const esErrorDeLimite = (error) => {
  return error?.status === 429 || error?.error?.code === "rate_limit_exceeded";
};


// =============================
// INTERPRETAR CONSULTA
// =============================
// historial: array de mensajes previos [{rol: "usuario"|"asistente", contenido: "..."}]
// Se usa para resolver referencias incompletas como "y con ionic?" tras un mensaje anterior.

const interpretarConsulta = async (mensaje, historial = []) => {
  try {

    // Convierte el historial al formato de mensajes de Groq.
    // "asistente" -> "assistant", "usuario" -> "user"
    const mensajesHistorial = historial.map(m => ({
      role: m.rol === "asistente" ? "assistant" : "user",
      content: m.contenido
    }));

    const completion = await groq.chat.completions.create({

      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Eres un extractor de intención de búsqueda para MongoDB. Analiza el mensaje y devuelve un JSON válido.

IMPORTANTE SOBRE EL CONTEXTO:
Antes del mensaje actual puede haber mensajes previos de la conversación. Úsalos SOLO para
resolver referencias incompletas o ambiguas del mensaje actual (ej: "y con ionic?", "y del 2025?",
"y por tutor?"). El mensaje actual SIEMPRE tiene prioridad: interpreta principalmente lo que
pide AHORA, completando lo que falte con el contexto previo más reciente y relevante.
Si el mensaje actual ya es una consulta completa y autónoma, IGNORA el historial.

Ejemplo de uso del contexto:
Historial: Usuario: "dame ideas de aplicaciones móviles con react native"
Mensaje actual: "y con ionic?"
→ Interpretación correcta: el usuario quiere lo MISMO (ideas de apps móviles) pero con ionic.
→ {"tipo": "idea_proyecto", "tema": "aplicaciones móviles con ionic", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Ejemplo de uso del contexto:
Historial: Usuario: "proyectos de desarrollo de software"
Mensaje actual: "y del periodo 25-A?"
→ Interpretación correcta: el usuario quiere lo mismo pero filtrado también por período.
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Desarrollo de Software", "$options": "i"}, "periodoAcademico": {"$regex": "^25-A$", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

CAMPOS DISPONIBLES EN LA BD:
- titulo, autor, tutor, tecnologias, palabrasClave, periodoAcademico, carrera, archivoPDF, repositorio

CAMPOS DEL JSON DE SALIDA:

1. "tipo": qué quiere el usuario
   - "buscar": quiere ver proyectos completos (DEL SISTEMA PIC, ya registrados)
   - "contar": quiere saber cuántos hay ("cuántas tesis hay de...")
   - "listar_campo": quiere ver solo un campo específico ("dame los tutores", "qué períodos hay")
   - "agrupar": quiere un desglose por campo ("cuántas tesis hay POR carrera", "proyectos por período", "cuántos tiene CADA tutor")
   - "idea_proyecto": quiere ideas o sugerencias de proyectos NUEVOS (generadas por IA, no buscan nada existente en la BD). Aplica tanto si pide ideas sobre un TEMA (turismo, salud, ciberseguridad) como si pide ideas usando una TECNOLOGÍA (react, flutter, python, node).

2. "campo_solicitado": SOLO si tipo es "listar_campo" o "agrupar", qué campo quiere ver
   - Valores permitidos: "tutor", "autor", "periodoAcademico", "carrera", "titulo", "tecnologias"

3. "filtros": condiciones de búsqueda
   - Para strings: {"$regex": "valor", "$options": "i"}
   - Para arrays (tecnologias, palabrasClave): {"$elemMatch": {"$regex": "valor", "$options": "i"}}
   - Para carrera, mapea al valor más cercano:
       * "Tecnología Superior en Desarrollo de Software"
       * "Tecnología Superior en Redes y Telecomunicaciones"
       * "Tecnología Superior en Electromecánica"
       * "Tecnología Superior en Agua y Saniamiento Ambiental"
       * "Tecnología Superior en Procesamiento Industrial de la Madera"
       * "Tecnología Superior en Procesamiento de Alimentos"

4. "busquedaGeneral": texto libre si el usuario busca un tema sin campo claro, sino ""

5. "orden": {} en la mayoría de casos

6. "tema": SOLO si tipo es "idea_proyecto". Aquí va el tema, dominio O tecnología sobre la que el usuario quiere ideas (ej: "turismo", "react", "salud", "flutter"), sino ""

7. "carreraRelacionada": SOLO si tipo es "idea_proyecto". Identifica la carrera del PIC
   relacionada con el tema, ya sea porque el usuario la menciona EXPLÍCITAMENTE o porque
   el TEMA mismo corresponde claramente al área de una carrera. Si no hay ninguna pista
   razonable, déjalo en "".

   Usa estas palabras clave orientativas para inferir la carrera a partir del tema,
   aunque el usuario no nombre la carrera:
   - "Tecnología Superior en Redes y Telecomunicaciones": redes, telecomunicaciones, routers,
     switches, cableado estructurado, wifi, fibra óptica, VoIP, ciberseguridad de redes,
     antenas, infraestructura de red
   - "Tecnología Superior en Electromecánica": electromecánica, motores, PLC, automatización
     industrial, sistemas hidráulicos, sistemas neumáticos, mantenimiento industrial,
     robótica industrial, control de máquinas, sensores y actuadores
   - "Tecnología Superior en Agua y Saniamiento Ambiental": agua potable, tratamiento de agua,
     saneamiento, aguas residuales, calidad ambiental, gestión de residuos, contaminación,
     plantas de tratamiento
   - "Tecnología Superior en Procesamiento Industrial de la Madera": madera, carpintería
     industrial, aserradero, secado de madera, productos de madera, industria maderera
   - "Tecnología Superior en Procesamiento de Alimentos": alimentos, conservación de alimentos,
     seguridad alimentaria, industria alimentaria, agroindustria, nuevos productos alimenticios
   - "Tecnología Superior en Desarrollo de Software": aplicaciones, sistemas web, apps móviles,
     programación, bases de datos, IA (cuando no se asocia claramente a otra disciplina)

   IMPORTANTE: si el tema es una tecnología de software pura (react, flutter, python, etc.)
   y no hay ninguna pista de otra disciplina, NO asumas ninguna carrera (deja "" o usa
   "Tecnología Superior en Desarrollo de Software" solo si el usuario lo deja claro).
   Esta inferencia es para evitar forzar un enfoque de software en temas que claramente
   pertenecen a otra disciplina (ej. "automatización industrial" o "tratamiento de aguas").

8. "limite": número si el usuario pide una cantidad específica de resultados, sino null

═══════════════════════════════════════
REGLA DE DESAMBIGUACIÓN (aplícala SIEMPRE antes de elegir el tipo):
═══════════════════════════════════════

Existen DOS fuentes de información totalmente distintas y NO deben mezclarse:
- Sistema PIC (tu base de datos): proyectos/tesis YA REGISTRADOS, con autor, tutor, carrera, período.
- IA generativa: ideas de proyectos NUEVAS que no existen en ningún lado, generadas para un tema o tecnología.

PASO 1 — ¿El usuario pide explícitamente IDEAS, SUGERENCIAS, INSPIRACIÓN o
         EJEMPLOS DE QUÉ HACER (no busca resultados existentes con autor/tutor/título)?
   → tipo: "idea_proyecto", tema: <el tema o tecnología mencionada>

PASO 2 — Si no aplica el paso 1, es una consulta sobre DATOS REALES
         del sistema PIC (proyectos, tesis, autores, tutores, carreras,
         períodos académicos ya registrados):
   → tipo: "buscar" / "contar" / "listar_campo" / "agrupar" según corresponda

REGLA DE ORO (valor por defecto): Ante la duda, SIEMPRE elige "buscar".
El sistema PIC es la fuente principal de toda consulta. "idea_proyecto" es
la EXCEPCIÓN, no la regla, y solo aplica cuando el usuario EXPLÍCITAMENTE
pide ideas, sugerencias, inspiración o ejemplos nuevos. Mencionar una
tecnología NO implica "idea_proyecto" por sí sola; solo lo implica si
además pide ideas/ejemplos/inspiración/sugerencias (en el mensaje actual
o heredado claramente del contexto previo).

NUNCA confundas:
- "proyectos CON [tecnología]" (sin pedir ideas) → "buscar" (busca en el sistema PIC)
- "IDEAS de proyectos CON [tecnología]" → "idea_proyecto", tema: "[tecnología]"
- "IDEAS de proyectos SOBRE [tema]" → "idea_proyecto", tema: "[tema]"

═══════════════════════════════════════
REGLA DE CONTINUIDAD CONVERSACIONAL (aplícala ANTES que la regla de oro):
═══════════════════════════════════════

Si el mensaje anterior del asistente (en el historial) fue una respuesta de
"idea_proyecto" (ideas de proyecto generadas), y el mensaje ACTUAL del usuario:
  - Es corto, ambiguo, o usa frases de continuación como "qué más tienes",
    "dame más", "algo más sobre eso", "y sobre lo que hablábamos", "otra idea",
    "más opciones", "algo similar"
  - Y NO contiene palabras claras de búsqueda en base de datos (autor, tutor,
    carrera, período, "del sistema", "registrados")
→ ENTONCES mantén tipo: "idea_proyecto" y hereda el tema/tecnología del
  turno anterior más reciente sobre el que se generaron ideas, aunque el
  mensaje actual no lo repita explícitamente.

Esta regla tiene PRIORIDAD sobre la regla de oro de "buscar por defecto".
La regla de oro aplica cuando NO hay contexto previo de idea_proyecto: aquí
SÍ hay contexto, así que continúa en el mismo modo.

EJEMPLOS DE CONTINUIDAD (basados en errores reales que debes evitar):

Historial: Usuario pidió ideas con "react native" → asistente respondió con 3 ideas.
           Usuario pidió ideas con "ionic" → asistente respondió con 3 ideas.
Mensaje actual: "que mas tienes sobre ionic"
→ INCORRECTO: tipo "buscar" (esto buscaría en la BD del sistema, donde no hay nada de "ionic")
→ CORRECTO: {"tipo": "idea_proyecto", "tema": "ionic", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Historial: igual que arriba (último tema tratado: "ionic")
Mensaje actual: "dame mas ideas sobre lo que hablabamos"
→ INCORRECTO: dejar "tema": "" (esto obliga a pedir aclaración innecesaria)
→ CORRECTO: {"tipo": "idea_proyecto", "tema": "ionic", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Historial: Usuario pidió ideas sobre "turismo" → asistente respondió con 3 ideas.
Mensaje actual: "una idea más"
→ CORRECTO: {"tipo": "idea_proyecto", "tema": "turismo", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Si el mensaje actual SÍ trae un tema/tecnología nuevo y distinto, usa ese nuevo
valor en vez de heredar el anterior. Solo heredas cuando el mensaje actual no
aporta ningún tema propio.


El formato en la BD es de 2 dígitos: "25-A", "25-B", "26-A", "24-B".
Normaliza SIEMPRE así:
  - "2025-A" → "25-A"
  - "2026a"  → "26-A"
  - "25b"    → "25-B"
  - "2024"   → usa regex "24" para abarcar "24-A" y "24-B"
  - "2025"   → usa regex "25" para abarcar "25-A" y "25-B"
  - "2026"   → usa regex "26" para abarcar "26-A" y "26-B"
  - "todo del 25b" → "25-B"

═══════════════════════════════════════
REGLAS GENERALES
═══════════════════════════════════════
- NUNCA apliques el mismo valor a múltiples campos
- "dame los tutores" → tipo: "listar_campo", campo_solicitado: "tutor"
- "cuántas tesis hay" → tipo: "contar"
- "dame los proyectos de redes" → tipo: "buscar"
- Si el usuario dice "por carrera", "por tutor", "por período", "cada carrera", "cada tutor" → tipo: "agrupar"
- Si el usuario dice "cuántas hay" sin "por" o "cada" → tipo: "contar"
- "dirigidas por X", "tutoradas por X", "del tutor X" → el nombre va en "tutor" sin incluir la palabra "por"
- Cuando hay múltiples condiciones se combinan en "filtros" como campos separados
- Si el usuario pide un número específico de proyectos → tipo: "buscar", agrega campo "limite" con ese número
- "proyectos DE [nombre]", "tesis DE [nombre]", "realizadas por [nombre]" → el nombre va en "autor"
- "proyectos dirigidos por [nombre]", "tutoradas por [nombre]", "del tutor [nombre]" → el nombre va en "tutor"

EJEMPLOS JSON:

Usuario: "proyectos del 2024"
→ {"tipo": "buscar", "filtros": {"periodoAcademico": {"$regex": "24", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "proyectos del periodo 25b"
→ {"tipo": "buscar", "filtros": {"periodoAcademico": {"$regex": "^25-B$", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "solo dame los nombres de los tutores"
→ {"tipo": "listar_campo", "campo_solicitado": "tutor", "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "cuántas tesis hay de desarrollo de software"
→ {"tipo": "contar", "campo_solicitado": "", "filtros": {"carrera": {"$regex": "Desarrollo de Software", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "dame los períodos de las tesis"
→ {"tipo": "listar_campo", "campo_solicitado": "periodoAcademico", "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "proyectos con react"
→ {"tipo": "buscar", "filtros": {"tecnologias": {"$elemMatch": {"$regex": "react", "$options": "i"}}}, "busquedaGeneral": "", "orden": {}}

Usuario: "dame proyectos hechos con flutter"
→ {"tipo": "buscar", "filtros": {"tecnologias": {"$elemMatch": {"$regex": "flutter", "$options": "i"}}}, "busquedaGeneral": "", "orden": {}}

Usuario: "qué proyectos de software hay en el sistema"
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Desarrollo de Software", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "dame ideas para proyectos con flutter"
→ {"tipo": "idea_proyecto", "tema": "flutter", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "qué puedo hacer con angular"
→ {"tipo": "idea_proyecto", "tema": "angular", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "recomiéndame proyectos con react native"
→ {"tipo": "idea_proyecto", "tema": "react native", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "ejemplos de proyectos hechos con node"
→ {"tipo": "idea_proyecto", "tema": "node", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "ideas de aplicaciones con python"
→ {"tipo": "idea_proyecto", "tema": "python", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "dame inspiración para un proyecto con django"
→ {"tipo": "idea_proyecto", "tema": "django", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "Dame ideas de proyectos sobre turismo"
→ {"tipo": "idea_proyecto", "tema": "turismo", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "Quiero ideas de proyectos de ciberseguridad"
→ {"tipo": "idea_proyecto", "tema": "ciberseguridad", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "ideas de proyectos sobre medio ambiente para la carrera de software"
→ {"tipo": "idea_proyecto", "tema": "medio ambiente", "carreraRelacionada": "Tecnología Superior en Desarrollo de Software", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "ideas de proyectos de ciberseguridad para redes y telecomunicaciones"
→ {"tipo": "idea_proyecto", "tema": "ciberseguridad", "carreraRelacionada": "Tecnología Superior en Redes y Telecomunicaciones", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "dame ideas para un proyecto de automatización industrial"
→ Inferencia implícita: "automatización industrial" corresponde a Electromecánica, aunque no se mencione la carrera.
→ {"tipo": "idea_proyecto", "tema": "automatización industrial", "carreraRelacionada": "Tecnología Superior en Electromecánica", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "ideas de proyectos sobre tratamiento de aguas residuales"
→ Inferencia implícita: corresponde a Agua y Saneamiento Ambiental.
→ {"tipo": "idea_proyecto", "tema": "tratamiento de aguas residuales", "carreraRelacionada": "Tecnología Superior en Agua y Saniamiento Ambiental", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "quiero ideas de proyectos sobre redes inalámbricas"
→ Inferencia implícita: corresponde a Redes y Telecomunicaciones.
→ {"tipo": "idea_proyecto", "tema": "redes inalámbricas", "carreraRelacionada": "Tecnología Superior en Redes y Telecomunicaciones", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "dame ideas con react"
→ No hay pista de otra disciplina; el tema es una tecnología de software pura.
→ {"tipo": "idea_proyecto", "tema": "react", "carreraRelacionada": "", "campo_solicitado": "", "limite": null, "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "que proyectos hay del 2024"
→ {"tipo": "buscar", "filtros": {"periodoAcademico": {"$regex": "24", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "proyectos del periodo 26a"
→ {"tipo": "buscar", "filtros": {"periodoAcademico": {"$regex": "^26-A$", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "dame todo del 25b"
→ {"tipo": "buscar", "filtros": {"periodoAcademico": {"$regex": "^25-B$", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "proyectos de software"
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Desarrollo de Software", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "tesis de redes"
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Redes y Telecomunicaciones", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "proyectos de maderas"
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Procesamiento Industrial de la Madera", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "tesis de electromecánica"
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Electromecánica", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "proyectos de alimentos"
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Procesamiento de Alimentos", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "tesis de agua"
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Agua y Saniamiento", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "cuántas tesis hay por carrera"
→ {"tipo": "agrupar", "campo_solicitado": "carrera", "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "proyectos por período académico"
→ {"tipo": "agrupar", "campo_solicitado": "periodoAcademico", "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "cuántas tesis tiene cada tutor"
→ {"tipo": "agrupar", "campo_solicitado": "tutor", "filtros": {}, "busquedaGeneral": "", "orden": {}}

Usuario: "tesis dirigidas por Lorena Chulde en software"
→ {"tipo": "buscar", "filtros": {"tutor": {"$regex": "Lorena Chulde", "$options": "i"}, "carrera": {"$regex": "Desarrollo de Software", "$options": "i"}}, "busquedaGeneral": "", "orden": {}}

Usuario: "dame 5 tesis"
→ {"tipo": "buscar", "filtros": {}, "limite": 5, "busquedaGeneral": "", "orden": {}}

Usuario: "muéstrame 3 proyectos de software"
→ {"tipo": "buscar", "filtros": {"carrera": {"$regex": "Desarrollo de Software", "$options": "i"}}, "limite": 3, "busquedaGeneral": "", "orden": {}}

Usuario: "proyectos de Nicolás Chiguano"
→ {"tipo": "buscar", "filtros": {"autor": {"$regex": "Nicolás Chiguano", "$options": "i"}}, "limite": null, "busquedaGeneral": "", "orden": {}}

Usuario: "tesis realizadas por Gabriel Escobar"
→ {"tipo": "buscar", "filtros": {"autor": {"$regex": "Gabriel Escobar", "$options": "i"}}, "limite": null, "busquedaGeneral": "", "orden": {}}

Responde SIEMPRE con un JSON válido con este esquema exacto:
{
  "tipo": "buscar",
  "campo_solicitado": "",
  "limite": null,
  "tema": "",
  "carreraRelacionada": "",
  "filtros": {},
  "busquedaGeneral": "",
  "orden": {}
}`
        },
        ...mensajesHistorial,
        { role: "user", content: `Extrae los filtros en formato JSON para esta consulta: ${mensaje}` }
      ],
      response_format: { type: "json_object" }
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("Error en interpretarConsulta:", error);

    // Si es un límite de cuota de Groq, lo relanza para que el controller
    // pueda darle al usuario un mensaje específico (no uno genérico).
    if (esErrorDeLimite(error)) {
      const errorLimite = new Error("Se alcanzó el límite de uso de la IA por hoy.");
      errorLimite.tipoError = "RATE_LIMIT";
      throw errorLimite;
    }

    return JSON.stringify({ filtros: {}, orden: {} });
  }

};




// =============================
// RESPUESTA NATURAL (PROYECTOS DEL SISTEMA PIC)
// =============================

const generarRespuestaNatural = async (mensajeUsuario, proyectos) => {
  if (!proyectos || proyectos.length === 0) {
    return "No encontré proyectos que coincidan con tu búsqueda. Intenta con otros términos como la tecnología, carrera o período académico.";
  }

  const proyectosTexto = proyectos.map((p, i) => `
[${i + 1}] ${p.titulo}
    Autor: ${p.autor} | Tutor: ${p.tutor}
    Carrera: ${p.carrera}
    Período: ${p.periodoAcademico}
    Tecnologías: ${p.tecnologias?.join(", ") || "No especificadas"}
    PDF: ${p.archivoPDF}
    ${p.repositorio ? "Repositorio: " + p.repositorio : ""}
  `).join("\n");

  try {

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `Eres un asistente académico del sistema PIC. Respondes en español de forma clara y organizada.

REGLAS ESTRICTAS:
- Estos proyectos son SIEMPRE del sistema PIC (ya registrados, con autor y tutor real).
- Solo menciona proyectos de la lista proporcionada, nunca inventes.
- Presenta los proyectos numerados.
- Si hay PDF o repositorio asociado, mencionalo.
- Sé conciso. Máximo 3 oraciones de introducción.`
        },
        {
          role: "user",
          content: `El usuario preguntó: "${mensajeUsuario}"

Proyectos encontrados en el sistema PIC:
${proyectosTexto}

Presenta estos resultados al usuario.`
        }
      ]
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("Error en generarRespuestaNatural:", error);

    if (esErrorDeLimite(error)) {
      const errorLimite = new Error("Se alcanzó el límite de uso de la IA por hoy.");
      errorLimite.tipoError = "RATE_LIMIT";
      throw errorLimite;
    }

    throw error;
  }
};


// =============================
// GENERAR IDEAS DE PROYECTO (IA, SALIDA ESTRUCTURADA EN JSON)
// =============================

const generarIdeasProyecto = async (tema, carreraRelacionada = "", ideasPrevias = []) => {
  try {

    // Orienta al modelo sobre qué tipo de entregable es propio de cada carrera,
    // para evitar que todas las ideas se conviertan en "una app/plataforma web".
    const PERFIL_CARRERA = {
      "Tecnología Superior en Desarrollo de Software":
        "El proyecto debe ser principalmente de software: aplicaciones, sistemas web, móviles, APIs, bases de datos, IA, etc.",
      "Tecnología Superior en Redes y Telecomunicaciones":
        "El proyecto debe centrarse en infraestructura de red, telecomunicaciones, configuración de equipos (routers, switches, antenas), seguridad de redes, cableado estructurado, redes inalámbricas, VoIP o monitoreo de tráfico. Si incluye software, debe ser una herramienta de soporte menor (ej. un dashboard de monitoreo), nunca el componente principal.",
      "Tecnología Superior en Electromecánica":
        "El proyecto debe centrarse en diseño o mejora de sistemas mecánicos, eléctricos o de control físico: máquinas, motores, sistemas neumáticos/hidráulicos, automatización industrial con PLC, mantenimiento predictivo, diseño de mecanismos. El software (si aparece) debe ser solo el componente de control o monitoreo de un sistema físico real, NUNCA el proyecto completo.",
      "Tecnología Superior en Agua y Saniamiento Ambiental":
        "El proyecto debe centrarse en tratamiento de agua, gestión de residuos, saneamiento, calidad ambiental, sistemas de purificación o monitoreo de parámetros ambientales (físico-químicos). Si incluye software, debe ser solo una herramienta de registro o monitoreo de datos ambientales, no el centro del proyecto.",
      "Tecnología Superior en Procesamiento Industrial de la Madera":
        "El proyecto debe centrarse en procesos productivos de la madera: corte, secado, tratamiento, control de calidad, diseño de productos de madera, optimización de procesos industriales. El software, si aparece, debe ser una herramienta de apoyo (ej. registro de inventario o control de calidad), no el proyecto principal.",
      "Tecnología Superior en Procesamiento de Alimentos":
        "El proyecto debe centrarse en procesos de transformación de alimentos: conservación, control de calidad, diseño de procesos productivos, seguridad alimentaria, desarrollo de nuevos productos alimenticios. El software, si aparece, debe ser una herramienta de apoyo menor, no el proyecto principal."
    };

    const contextoCarrera = carreraRelacionada && PERFIL_CARRERA[carreraRelacionada]
      ? `La carrera del estudiante es: ${carreraRelacionada}.\n${PERFIL_CARRERA[carreraRelacionada]}\nNO conviertas el proyecto en "una aplicación/plataforma web" salvo que la carrera sea Desarrollo de Software. El software, si corresponde, debe ser un componente de apoyo secundario dentro de un proyecto cuyo núcleo es propio de la disciplina de la carrera.`
      : `Las ideas deben ser viables para estudiantes de carreras técnicas/tecnológicas en general.`;

    const contextoIdeasPrevias = ideasPrevias.length > 0
      ? `\nIMPORTANTE: Ya le diste estas ideas al usuario antes en esta misma conversación, NO las repitas ni generes variaciones muy similares a ellas:\n${ideasPrevias.map(t => `- ${t}`).join("\n")}\nGenera 3 ideas DIFERENTES a las anteriores.`
      : "";

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 1.1,
      messages: [
        {
          role: "system",
          content: `Eres un asesor académico experto en proyectos tecnológicos para estudiantes de carreras técnicas.

Tu tarea es generar exactamente 3 ideas de proyectos NUEVAS y ORIGINALES sobre el tema o tecnología que te dé el usuario.
${contextoCarrera}
${contextoIdeasPrevias}

REGLAS:
- Las ideas deben ser concretas y realizables en un proyecto académico (no genéricas ni vagas).
- No repitas la misma idea con distintas palabras entre las 3 propuestas; deben ser claramente diferentes entre sí.
- Varía el enfoque entre las ideas: no te limites siempre a las aplicaciones más obvias del tema (ej. para una tecnología no propongas solo "app de seguimiento de hábitos" como primera opción); explora ángulos menos comunes (logística, comunidad, accesibilidad, gestión de recursos, automatización, entretenimiento, sostenibilidad, etc.) según lo que tenga sentido para el tema.
- Si el usuario dio una tecnología específica, las 3 ideas deben usarla como tecnología principal.
- Si el usuario dio un tema/dominio, elige tecnologías adecuadas y realistas para ese dominio.
- Respeta estrictamente el perfil disciplinar de la carrera indicada arriba: las tecnologías sugeridas deben reflejar herramientas, equipos o métodos propios de esa disciplina, no únicamente lenguajes de programación o frameworks web, salvo que la carrera sea de software.
- No presentes estas ideas como si ya existieran como proyectos registrados en el sistema.

Responde ÚNICAMENTE con un JSON válido (nada de texto antes o después), con este esquema exacto en formato json:
{
  "ideas": [
    {
      "titulo": "string",
      "descripcion": "string (2-3 oraciones explicando qué hace el proyecto y qué problema resuelve)",
      "tecnologias": ["string", "string"]
    }
  ]
}`
        },
        {
          role: "user",
          content: `Genera 3 ideas de proyectos en formato json sobre: ${tema}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(completion.choices[0].message.content);
    return data.ideas || [];

  } catch (error) {
    console.error("Error generando ideas de proyecto:", error);

    if (esErrorDeLimite(error)) {
      const errorLimite = new Error("Se alcanzó el límite de uso de la IA por hoy.");
      errorLimite.tipoError = "RATE_LIMIT";
      throw errorLimite;
    }

    return [];
  }
};

export {
  interpretarConsulta,
  generarRespuestaNatural,
  generarIdeasProyecto
}
