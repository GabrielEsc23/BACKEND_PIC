import { describe, test, expect, jest } from '@jest/globals'

const mockRegistrarActividad = jest.fn()

jest.unstable_mockModule(
    '../../../helpers/RegistrarActividad.js',
    () => ({
        default: mockRegistrarActividad
    })
)

const mockSendMailToRegister = jest.fn()

jest.unstable_mockModule('../../../helpers/sendMail.js', () => ({
    sendMailToRegister: mockSendMailToRegister,
    sendMailToRecoveryPassword: jest.fn()
}))

const { registroUsuario } = await import('../../auth_controllers.js')

const { default: Usuario } = await import('../../../models/Usuario.js')
const { default: Administrador } = await import('../../../models/Administrador.js')

describe('Registro Usuario Controller', () => {

    test('Debe retornar 400 si faltan campos obligatorios', async () => {

        const req = {
            body: {}
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await registroUsuario(req, res)

        expect(res.status).toHaveBeenCalledWith(400)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Todos los campos son obligatorios'
        })

    })

    test('Debe validar longitud mínima del nombre', async () => {

    const req = {
        body: {
            nombre: 'Ga',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec',
            password: 'Password123',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El nombre debe tener al menos 3 caracteres'
    })

})

test('Debe validar longitud mínima del apellido', async () => {

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Es',
            email: 'gabriel@epn.edu.ec',
            password: 'Password123',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El apellido debe tener al menos 3 caracteres'
    })

})
test('Debe rechazar correos no institucionales', async () => {

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@gmail.com',
            password: 'Password123',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Debe usar un correo institucional (@epn.edu.ec)'
    })

})

test('Debe rechazar nombres con caracteres inválidos', async () => {

    const req = {
        body: {
            nombre: 'Gabriel123',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec',
            password: 'Password123',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El nombre solo puede contener letras'
    })

})

test('Debe rechazar apellidos con caracteres inválidos', async () => {

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar123',
            email: 'gabriel@epn.edu.ec',
            password: 'Password123',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El apellido solo puede contener letras'
    })

})

test('Debe validar longitud mínima de la contraseña', async () => {

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec',
            password: 'Pass12',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'La contraseña debe tener mínimo 8 caracteres'
    })

})

test('Debe rechazar contraseñas inseguras', async () => {

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec',
            password: '12345678',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'La contraseña debe contener mayúscula, minúscula y número'
    })

})


test('Debe rechazar un email ya registrado', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        _id: '123'
    })

    Administrador.findOne = jest.fn().mockResolvedValue(null)

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec',
            password: 'Password123',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El email ya está registrado'
    })

})

Usuario.findOne = jest.fn().mockResolvedValue(null)
Administrador.findOne = jest.fn().mockResolvedValue(null)
const mockSave = jest.fn().mockResolvedValue(true)

Usuario.prototype.save = mockSave


test('Debe registrar un usuario correctamente', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue(null)

    Administrador.findOne = jest.fn().mockResolvedValue(null)

    const mockSave = jest.fn().mockResolvedValue(true)

    Usuario.prototype.save = mockSave

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec',
            password: 'Password123',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroUsuario(req, res)

    expect(mockSave).toHaveBeenCalled()

    expect(mockSendMailToRegister).toHaveBeenCalled()

    expect(mockRegistrarActividad).toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(201)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Usuario registrado, revisa tu correo para confirmar la cuenta'
    })

})
})