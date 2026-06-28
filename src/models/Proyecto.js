import { Schema, model } from "mongoose"

const proyectoSchema = new Schema({
  titulo: {
    type: String,
    required: true,
    trim:true
  },
  descripcion: {
    type: String,
    required: true
  },
  autor: {
    type: String,
    required: true
  },
  fecha:{
    type:Date,
    required:true
    
  },
  tutor: {
    type: String,
    required:true,
    trim: true
  },
  palabrasClave: [{
    type: String,
    required:true
  }],
  tecnologias: [{
    type: String,
    required:true
  }],
  carrera: {
    type: String,
    enum:["Tecnología Superior en Desarrollo de Software",
      "Tecnología Superior en Redes y Telecomunicaciones",
      "Tecnología Superior en Electromecánica",
      "Tecnología Superior en Agua y Saniamiento Ambiental",
      "Tecnología Superior en Procesamiento Industrial de la Madera",
      "Tecnología Superior en Procesamiento de Alimentos",

    ],
    required:true
  },

  repositorio: {
    type: String,
    
  },
  video: {
    type: String
  },

  periodoAcademico: [{
  type: String,
  match:/^\d{2}-[AB]$/,
  
}],
  archivoPDF: {
    type: String,
    required:true
  },
  portada:{
   url:{
      type:String,
      default:"https://res.cloudinary.com/dlya09ut7/image/upload/v1778961329/PORTADA_PIC_tc0ywj.png"
   },
   public_id:{
      type:String,
      default:null
   }
},

  // Permite ocultar un proyecto de los usuarios sin eliminarlo de la BD.
  // Los administradores siguen viendo proyectos en estado "oculto".
  estado:{
    type:String,
    enum:["visible","oculto"],
    default:"visible"
  },

  registradoPor: {
    type: Schema.Types.ObjectId,
    ref: "Administrador"
  }

}, {
  timestamps: true
  
})

// Al final de proyectoSchema, antes del export
proyectoSchema.index({
  titulo: "text",
  descripcion: "text",
  palabrasClave: "text",
  tecnologias: "text",
  autor: "text",
  tutor: "text",
   periodoAcademico: "text"
}, { default_language: "spanish" })


export default model("Proyecto", proyectoSchema)