import { describe, test, expect, jest } from '@jest/globals'

const { crearNuevoPassword } = await import('../../auth_controllers.js')

const { default: Usuario } = await import('../../../models/Usuario.js')
const { default: Administrador } = await import('../../../models/Administrador.js')

describe('Crear nuevo password',()=>{

    test('Debe retornar 400 si faltan campos', async () => {

    const req = {
        body: {},
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearNuevoPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Debes llenar todos los campos.'
    })

})

test('Debe retornar 400 si las contraseñas no coinciden', async () => {

    const req = {
        body: {
            password: 'Password123',
            confirmpassword: 'Password456'
        },
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearNuevoPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Las contraseñas no coinciden'
    })

})

test('Debe retornar 400 si la contraseña es demasiado corta', async () => {

    const req = {
        body: {
            password: 'Pass12',
            confirmpassword: 'Pass12'
        },
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearNuevoPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'La contraseña debe tener al menos 8 caracteres'
    })

})

test('Debe retornar 404 si el token es inválido', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue(null)

    Administrador.findOne = jest.fn().mockResolvedValue(null)

    const req = {
        body: {
            password: 'Password123',
            confirmpassword: 'Password123'
        },
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearNuevoPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Token inválido o expirado'
    })

})

test('Debe retornar 403 si la cuenta no está verificada', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: false
    })

    const req = {
        body: {
            password: 'Password123',
            confirmpassword: 'Password123'
        },
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearNuevoPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Cuenta no verificada'
    })

})
test('Debe retornar 400 si el token ha expirado', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: true,
        resetTokenExpire: Date.now() - 1000
    })

    const req = {
        body: {
            password: 'Password123',
            confirmpassword: 'Password123'
        },
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearNuevoPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Token expirado'
    })

})
test('Debe actualizar correctamente la contraseña', async () => {

    const mockUsuario = {
        confirmEmail: true,
        resetTokenExpire: Date.now() + 60000,
        save: jest.fn().mockResolvedValue(true)
    }

    Usuario.findOne = jest.fn().mockResolvedValue(mockUsuario)

    const req = {
        body: {
            password: 'Password123',
            confirmpassword: 'Password123'
        },
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearNuevoPassword(req, res)

    expect(mockUsuario.save).toHaveBeenCalled()

    expect(mockUsuario.resetToken).toBeNull()

    expect(mockUsuario.resetTokenExpire).toBeNull()

    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Ya puedes iniciar sesión con tu nueva contraseña'
    })

})
test('Debe retornar 500 si ocurre un error interno', async () => {

    const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

    Usuario.findOne = jest.fn()
        .mockRejectedValue(new Error())

    const req = {
        body: {
            password: 'Password123',
            confirmpassword: 'Password123'
        },
        params: {
            token: 'token123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearNuevoPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error en el servidor'
    })

    consoleSpy.mockRestore()

})
})