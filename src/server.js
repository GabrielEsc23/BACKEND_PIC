// Requerir módulos
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import multer from 'multer'
import cloudinary from 'cloudinary'

import routeAdministrador from './routes/administrador_routes.js'
import routeAuth from './routes/auth_routes.js'
import routeProyecto from './routes/proyecto_routes.js'
import routerUsuario from './routes/usuario_routes.js'
import routerEstadisticas from './routes/estadisticas_routes.js'
import routerChatbot from './routes/chatbot_routes.js'
import routerFavoritos from './routes/favoritos_routes.js'
import routerPerfil from './routes/perfil_routes.js'
import routerLogs from './routes/logs_routes.js'



// Inicializaciones
const app = express()
dotenv.config()




// Middlewares 
app.use(express.json());
app.use(cors())




// Ruta principal
app.get('/',(req,res)=>res.send("Server on"))



 app.use('/api',routeAdministrador)
 app.use('/api',routeAuth)
 app.use('/api',routeProyecto)
 app.use('/api',routerEstadisticas)
 app.use('/api',routerChatbot)
 app.use('/api',routerUsuario)
 app.use('/api',routerFavoritos)
 app.use('/api',routerPerfil)
 app.use('/api',routerLogs)



// Manejo de una ruta que no sea encontrada
app.use((req,res)=>res.status(404).send("Endpoint no encontrado - 404"))



// Configuraciones 


// Variables globales
app.set('port',process.env.PORT || 3000)





// Exportar la instancia de express por medio de app
export default  app