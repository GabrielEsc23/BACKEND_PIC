import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

const connection = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI_LOCAL)

        console.log(`Base de datos conectada en ${db.connection.host}:${db.connection.port}`)
        
    } catch (error) {
        console.error('Error al conectar la base de datos:', error.message)
        
        
    }
}

export default connection