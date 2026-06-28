import { Schema, model } from 'mongoose'

const mensajeSchema = new Schema({
    rol:{
        type:String,
        enum:["usuario","asistente"],
        required:true
    },
    contenido:{
        type:String,
        required:true,
        trim:true
    },
    fecha:{
        type:Date,
        default:Date.now
    }
},{
    _id:false
})

const conversacionSchema = new Schema({
    usuario:{
        type: Schema.Types.ObjectId,
        required:true,
        refPath:'usuarioModelo'
    },
    usuarioModelo:{
        type:String,
        required:true,
        enum:["Usuario","Administrador"]
    },
    titulo:{
        type:String,
        default:"Nueva conversación",
        trim:true
    },
    ultimoTema:{
        type:String,
        default:"",
        trim:true
    },
    ideasGeneradas:{
        type:[String],
        default: []
    },
    mensajes:{
        type:[mensajeSchema],
        default: []
    }
},{
    timestamps:true
})


conversacionSchema.index({ usuario: 1, updatedAt: -1 })

export default model('Conversacion', conversacionSchema)