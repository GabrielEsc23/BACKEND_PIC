import { describe, test, expect, jest } from '@jest/globals'

const mockSendMailToRecoveryPassword = jest.fn()

jest.unstable_mockModule('../../../helpers/sendMail.js', () => ({
    sendMailToRegister: jest.fn(),
    sendMailToRecoveryPassword: mockSendMailToRecoveryPassword
}))

const { recuperarPassword } = await import('../../auth_controllers.js')

const { default: Usuario } = await import('../../../models/Usuario.js')
const { default: Administrador } = await import('../../../models/Administrador.js')

describe("Recuperar pasword controller", ()=>{

test('Debe retornar 400 si no se envía un correo', async () => {

    const req = {
        body: {}
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await recuperarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Debes ingresar un correo electrónico'
    })

})

test('Debe retornar 200 si el correo no está registrado', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue(null)

    Administrador.findOne = jest.fn().mockResolvedValue(null)

    const req = {
        body: {
            email: 'noexiste@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await recuperarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Si el correo está registrado, recibirás instrucciones'
    })

})

test('Debe retornar 403 si la cuenta no está verificada', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: false
    })

    const req = {
        body: {
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await recuperarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Debes verificar tu cuenta primero'
    })

})

test('Debe generar un token de recuperación correctamente', async () => {

    const mockUsuario = {
        confirmEmail: true,
        createToken: jest.fn().mockReturnValue('token-recuperacion'),
        save: jest.fn().mockResolvedValue(true)
    }

    Usuario.findOne = jest.fn().mockResolvedValue(mockUsuario)

    const req = {
        body: {
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await recuperarPassword(req, res)

    expect(mockUsuario.createToken).toHaveBeenCalled()

    expect(mockUsuario.save).toHaveBeenCalled()

    expect(mockSendMailToRecoveryPassword).toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Revisa tu correo electrónico para restablecer tu contraseña'
    })

})

test('Debe retornar 500 si ocurre un error interno', async () => {

    Usuario.findOne = jest.fn().mockRejectedValue(new Error())

    const req = {
        body: {
            email: 'gabriel@epn.edu.ec'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await recuperarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error en el servidor'
    })

})

})