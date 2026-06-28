import { Schema, model } from 'mongoose'
import { generarTokenPassword } from './tokenMethods.js'
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { type } from 'os'


const administradorSchema = new Schema({
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
    // Estado de la cuenta
    estado:{
        type:String,
        enum:["activo","inactivo"],
        default:"activo"
    },

    //  Token para verificación de cuenta
    verifyToken:{
        type:String,
        default:null
    },

    // Token para recuperación de contraseña
    resetToken:{
        type:String,
        default:null
    },
    resetTokenExpire:{
        type:Date
    },

    confirmEmail:{
        type:Boolean,
        default:false
    },
    favoritos: [
  {
    type: Schema.Types.ObjectId,
    ref: "Proyecto"
  }
],
    avatar:{
        type:String,
        default: "avatar1"

    },

    rol:{
        type:String,
        enum: ['administrador'],
        default: 'administrador'
    }

},{
    timestamps:true
})



// 🔐 Hash automático
administradorSchema.pre('save', async function(){
    if(!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt)
    
})

//  Comparar contraseña
administradorSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password,this.password)
}


//  Generar Token seguro
administradorSchema.methods.createToken = function(){
    return crypto.randomBytes(20).toString('hex')
}
administradorSchema.methods.generarTokenPassword = generarTokenPassword

export default model('Administrador', administradorSchema)

