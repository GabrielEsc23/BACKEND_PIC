import { describe, test, expect, jest } from '@jest/globals'

const { comprobarTokenPassword } = await import('../../auth_controllers.js')

const { default: Usuario } = await import('../../../models/Usuario.js')
const { default: Administrador } = await import('../../../models/Administrador.js')

describe('Comprobar token  password', ()=>{

    test('Debe retornar 400 si el token es inválido', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue(null)

    Administrador.findOne = jest.fn().mockResolvedValue(null)

    const req = {
        params: {
            token: 'token-invalido'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await comprobarTokenPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Token inválido o expirado'
    })

})

test('Debe retornar 400 si la cuenta no está verificada', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: false
    })

    const req = {
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await comprobarTokenPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Token inválido o expirado'
    })

})

test('Debe retornar 400 si el token ha expirado', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: true,
        resetTokenExpire: Date.now() - 1000
    })

    const req = {
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await comprobarTokenPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Token expirado'
    })

})

test('Debe confirmar correctamente un token válido', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: true,
        resetTokenExpire: Date.now() + 60000
    })

    const req = {
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await comprobarTokenPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Token confirmado, ya puedes crear tu nueva contraseña'
    })

})

test('Debe retornar 500 si ocurre un error interno', async () => {

    const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

    Usuario.findOne = jest.fn()
        .mockRejectedValue(new Error())

    const req = {
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await comprobarTokenPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error en el servidor'
    })

    consoleSpy.mockRestore()

})
})