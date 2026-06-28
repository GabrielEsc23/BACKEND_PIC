import { describe, test, expect, jest } from '@jest/globals'

const { obtenerFavoritos } =
    await import('../../favoritos_controller.js')

const { default: Usuario } =
    await import('../../../models/Usuario.js')

const { default: Administrador } =
    await import('../../../models/Administrador.js')



describe('Obtener Favoritos',()=>{
    test('Debe retornar 401 si no hay usuario autenticado', async () => {

    const req = {}

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await obtenerFavoritos(req, res)

    expect(res.status).toHaveBeenCalledWith(401)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'No autenticado'
    })

})
test('Debe retornar 404 si el usuario no existe', async () => {

    Usuario.findById = jest.fn()
        .mockReturnValue({
            populate: jest.fn()
                .mockResolvedValue(null)
        })

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await obtenerFavoritos(req, res)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Usuario no encontrado'
    })

})
test('Debe retornar los favoritos correctamente', async () => {

    const favoritos = [
        { titulo: 'Proyecto 1' },
        { titulo: 'Proyecto 2' }
    ]

    Usuario.findById = jest.fn()
        .mockReturnValue({
            populate: jest.fn()
                .mockResolvedValue({
                    favoritos
                })
        })

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        }
    }

    const res = {
        json: jest.fn()
    }

    await obtenerFavoritos(req, res)

    expect(res.json).toHaveBeenCalledWith(favoritos)

})
test('Debe retornar 500 si ocurre un error interno', async () => {

    const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

    Usuario.findById = jest.fn()
        .mockImplementation(() => {
            throw new Error()
        })

    const req = {
        usuario: {
            _id: '123',
            rol: 'usuario'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await obtenerFavoritos(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error en el servidor'
    })

    consoleSpy.mockRestore()

})

})