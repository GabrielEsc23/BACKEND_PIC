import { Schema, model } from 'mongoose'
import { generarTokenPassword } from './tokenMethods.js'
import bcrypt from "bcryptjs"
import crypto from "crypto"

const usuarioSchema = new Schema({
    nombre:{
        type:String,
        required:true,
        trim:true
    },
    apellido:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        lowercase:true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    password:{
        type:String,
        required:true
    },

    verifyToken:{
        type:String,
        default:null
    },

    resetToken:{
        type:String,
        default:null
    },
    estado:{
   type:String,
   enum:["activo","inactivo"],
   default:"activo"
    },

    confirmEmail:{
        type:Boolean,
        default:false
    },
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

   avatar:{
      type:String,
      default:"avatar1"
   },
    favoritos: [
  {
    type: Schema.Types.ObjectId,
    ref: "Proyecto"
  }
],
    rol:{
        type:String,
        enum: ['usuario'],
        default:'usuario'
    }

},{
    timestamps:true
})


//  Hash automático
usuarioSchema.pre('save', async function(){
    if(!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt)
})

//  Comparar contraseña
usuarioSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

//  Token seguro
usuarioSchema.methods.createToken = function(){
    return crypto.randomBytes(20).toString('hex')
}

usuarioSchema.methods.generarTokenPassword = generarTokenPassword


export default model('Usuario', usuarioSchema)

