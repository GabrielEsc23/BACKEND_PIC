import { describe, test, expect, jest } from '@jest/globals'

const { eliminarVariosFavoritos } =
    await import('../../favoritos_controller.js')

const { default: Usuario } =
    await import('../../../models/Usuario.js')

const { default: Administrador } =
    await import('../../../models/Administrador.js')


describe('Eliminar Varios Favoritos', ()=>{
    test('Debe retornar 400 si no se envía una lista válida', async () => {

    const req = {
        body: {
            proyectos: []
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await eliminarVariosFavoritos(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Debe enviar una lista de proyectos'
    })

})
test('Debe retornar 404 si el usuario no existe', async () => {

    Usuario.findById = jest.fn()
        .mockResolvedValue(null)

    Administrador.findById = jest.fn()
        .mockResolvedValue(null)

    const req = {
        usuario: {
            _id: '123'
        },
        body: {
            proyectos: ['p1', 'p2']
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await eliminarVariosFavoritos(req, res)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Usuario no encontrado'
    })

})
test('Debe eliminar varios favoritos correctamente', async () => {

    const mockUsuario = {

        favoritos: ['p1', 'p2', 'p3'],

        save: jest.fn()
            .mockResolvedValue(true)

    }

    Usuario.findById = jest.fn()
        .mockResolvedValue(mockUsuario)

    const req = {
        usuario: {
            _id: '123'
        },
        body: {
            proyectos: ['p1', 'p3']
        }
    }

    const res = {
        json: jest.fn()
    }

    await eliminarVariosFavoritos(req, res)

    expect(mockUsuario.favoritos)
        .toEqual(['p2'])

    expect(mockUsuario.save)
        .toHaveBeenCalled()

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Favoritos eliminados correctamente'
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
            _id: '123'
        },
        body: {
            proyectos: ['p1']
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await eliminarVariosFavoritos(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error en el servidor'
    })

    consoleSpy.mockRestore()

})

})