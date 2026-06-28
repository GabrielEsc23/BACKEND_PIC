import { describe, test, expect, jest } from '@jest/globals'

const mockSendMailToAdministrator = jest.fn()

jest.unstable_mockModule('../../../helpers/sendMail.js', () => ({
    sendMailToRegister: jest.fn(),
    sendMailToAdministrator: mockSendMailToAdministrator
}))

const { registroAdministrador } =
    await import('../../administrador_controller.js')

const { default: Administrador } =
    await import('../../../models/Administrador.js')

const { default: Usuario } =
    await import('../../../models/Usuario.js')


describe('Registro Administrador', () =>{
    test('Debe existir la función registroAdministrador', () => {

    expect(registroAdministrador).toBeDefined()

})
test('Debe retornar 400 si faltan campos', async () => {

    const req = {
        body: {}
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Todos los campos son obligatorios'
    })

})
test('Debe retornar 400 si el nombre es demasiado corto', async () => {

    const req = {
        body: {
            nombre: 'Ga',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El nombre debe tener al menos 3 caracteres'
    })

})
test('Debe retornar 400 si el apellido es demasiado corto', async () => {

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Es',
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El apellido debe tener al menos 3 caracteres'
    })

})
test('Debe retornar 400 si el nombre contiene caracteres inválidos', async () => {

    const req = {
        body: {
            nombre: 'Gabriel123',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El nombre solo puede contener letras'
    })

})
test('Debe retornar 400 si el apellido contiene caracteres inválidos', async () => {

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar123',
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El apellido solo puede contener letras'
    })

})
test('Debe retornar 400 si el correo es inválido', async () => {

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'correo-invalido'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Correo electrónico inválido'
    })

})
test('Debe retornar 400 si el correo ya existe en administradores', async () => {

    Administrador.findOne = jest.fn().mockResolvedValue({
        _id: '123'
    })

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El correo ya se encuentra registrado'
    })

})
test('Debe retornar 400 si el correo ya existe en usuarios', async () => {

    Administrador.findOne = jest.fn().mockResolvedValue(null)

    Usuario.findOne = jest.fn().mockResolvedValue({
        _id: '123'
    })

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'El correo ya se encuentra registrado'
    })

})
test('Debe retornar 500 si ocurre un error interno', async () => {

    const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

    Administrador.findOne = jest.fn()
        .mockRejectedValue(new Error())

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec'
        }
      

    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error en el servidor'
    })

    consoleSpy.mockRestore()

})
test('Debe registrar correctamente un administrador', async () => {

    Administrador.findOne = jest.fn().mockResolvedValue(null)

    Usuario.findOne = jest.fn().mockResolvedValue(null)

    const saveMock = jest.fn().mockResolvedValue(true)

    Administrador.prototype.createToken = jest.fn()
        .mockReturnValue('token-falso')

    Administrador.prototype.save = saveMock

    const req = {
        body: {
            nombre: 'Gabriel',
            apellido: 'Escobar',
            email: 'gabriel@epn.edu.ec'
        },
        usuario:{
            _id:'admin123',
            email:'admin@pn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await registroAdministrador(req, res)

    expect(saveMock).toHaveBeenCalled()

    expect(mockSendMailToAdministrator)
        .toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(201)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Administrador creado correctamente. Se ha enviado un correo con las instrucciones de activación y acceso.'
    })

})
})