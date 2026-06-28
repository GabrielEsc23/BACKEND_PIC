import { describe, test, expect, jest } from '@jest/globals'

const { agregarFavorito } =
    await import('../../favoritos_controller.js')

const { default: Usuario } =
    await import('../../../models/Usuario.js')

const { default: Administrador } =
    await import('../../../models/Administrador.js')

describe('Agregar a Favoritos', ()=>{
test('Debe retornar 404 si el usuario no existe', async () => {

    Usuario.findById = jest.fn()
        .mockResolvedValue(null)

    Administrador.findById = jest.fn()
        .mockResolvedValue(null)

    const req = {
        usuario: {
            _id: '123'
        },
        params: {
            id: 'proyecto123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await agregarFavorito(req, res)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Usuario no encontrado'
    })

})

test('Debe retornar 400 si el proyecto ya está en favoritos', async () => {

    Usuario.findById = jest.fn()
        .mockResolvedValue({
            favoritos: ['proyecto123']
        })

    const req = {
        usuario: {
            _id: '123'
        },
        params: {
            id: 'proyecto123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await agregarFavorito(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Ya está en favoritos'
    })

})
test('Debe agregar un proyecto a favoritos correctamente', async () => {

    const mockUsuario = {

        favoritos: [],

        save: jest.fn()
            .mockResolvedValue(true)

    }

    Usuario.findById = jest.fn()
        .mockResolvedValue(mockUsuario)

    const req = {
        usuario: {
            _id: '123'
        },
        params: {
            id: 'proyecto123'
        }
    }

    const res = {
        json: jest.fn()
    }

    await agregarFavorito(req, res)

    expect(mockUsuario.favoritos)
        .toContain('proyecto123')

    expect(mockUsuario.save)
        .toHaveBeenCalled()

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Agregado a favoritos'
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
        params: {
            id: 'proyecto123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await agregarFavorito(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error en el servidor'
    })

    consoleSpy.mockRestore()

})
})