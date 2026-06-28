import { describe, test, expect, jest } from '@jest/globals'

const { cambiarPassword } =
    await import('../../perfil_controller.js')

const { default: Usuario } =
    await import('../../../models/Usuario.js')

const { default: Administrador } =
    await import('../../../models/Administrador.js')

describe('Cambiar Password', ()=>{

    test('Debe retornar 400 si faltan campos', async () => {
        Usuario.findById = jest.fn()
        .mockResolvedValue({})

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        },
        body: {}
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await cambiarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Todos los campos son obligatorios'
    })

})
test('Debe retornar 400 si la contraseña tiene menos de 8 caracteres', async () => {

    Usuario.findById = jest.fn()
        .mockResolvedValue({})

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        },
        body: {
            passwordActual: 'Password123',
            passwordNueva: '123',
            confirmarPassword: '123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await cambiarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'La contraseña debe tener mínimo 8 caracteres'
    })

})
test('Debe retornar 400 si las contraseñas no coinciden', async () => {

    Usuario.findById = jest.fn()
        .mockResolvedValue({})

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        },
        body: {
            passwordActual: 'Password123',
            passwordNueva: 'NuevaPassword123',
            confirmarPassword: 'OtraPassword123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await cambiarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Las contraseñas no coinciden'
    })

})
test('Debe retornar 400 si la contraseña actual es incorrecta', async () => {

    Usuario.findById = jest.fn()
        .mockResolvedValue({

            matchPassword: jest.fn()
                .mockResolvedValue(false)

        })

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        },
        body: {
            passwordActual: 'Password123',
            passwordNueva: 'NuevaPassword123',
            confirmarPassword: 'NuevaPassword123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await cambiarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'La contraseña actual es incorrecta'
    })

})
test('Debe retornar 400 si la nueva contraseña es igual a la actual', async () => {

    const mockUsuario = {

        matchPassword: jest.fn()
            .mockResolvedValue(true)

    }

    Usuario.findById = jest.fn()
        .mockResolvedValue(mockUsuario)

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        },
        body: {
            passwordActual: 'Password123',
            passwordNueva: 'Password123',
            confirmarPassword: 'Password123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await cambiarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'La nueva contraseña no puede ser igual a la actual'
    })

})
test('Debe retornar 500 si ocurre un error interno', async () => {

    const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

    Usuario.findById = jest.fn()
        .mockRejectedValue(new Error())

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        },
        body: {
            passwordActual: 'Password123',
            passwordNueva: 'NuevaPassword123',
            confirmarPassword: 'NuevaPassword123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await cambiarPassword(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error en el servidor'
    })

    consoleSpy.mockRestore()

})
})