import { Schema, model } from 'mongoose'

const logActividadSchema = new Schema({
    // Quién ejecutó la acción. Puede ser null en intentos de login fallidos,
    // donde todavía no hay un usuario autenticado.
    usuario:{
        type: Schema.Types.ObjectId,
        refPath:'usuarioModelo',
        default:null
    },
    usuarioModelo:{
        type:String,
        enum:["Usuario","Administrador",null],
        default:null
    },
    // Email usado en el intento, útil sobre todo para logins fallidos
    // donde no se puede vincular a un usuario real.
    email:{
        type:String,
        trim:true,
        lowercase:true,
        default:null
    },
    accion:{
        type:String,
        required:true,
        enum:[
            "registro_usuario",
            "login_exitoso",
            "login_fallido",
            "crear_proyecto",
            "actualizar_proyecto",
            "eliminar_proyecto",
            "cambiar_visibilidad_proyecto",
            "crear_administrador",
            "cambiar_estado_administrador",
            "cambiar_estado_usuario",
            "autodesactivar_cuenta"
        ]
    },
    // Resultado de la acción, para diferenciar éxitos de intentos fallidos
    resultado:{
        type:String,
        enum:["exito","fallo"],
        required:true
    },
    // Entidad afectada por la acción (ej. el proyecto editado, el usuario desactivado)
    entidadId:{
        type: Schema.Types.ObjectId,
        default:null
    },
    // Información adicional libre, ej. { motivo: "credenciales incorrectas" }
    detalles:{
        type: Schema.Types.Mixed,
        default:null
    }
},{
    timestamps:true
})

// Índice para listar/filtrar logs rápidamente por fecha y por tipo de acción
logActividadSchema.index({ createdAt: -1 })
logActividadSchema.index({ accion: 1, createdAt: -1 })

export default model('LogActividad', logActividadSchema)