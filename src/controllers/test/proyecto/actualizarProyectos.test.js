import { test, expect, jest, describe } from '@jest/globals'
const mockRegistrarActividad = jest.fn()

jest.unstable_mockModule('../../../helpers/RegistrarActividad.js', () => ({
    default: mockRegistrarActividad
}))
const { actualizarProyecto } =
    await import('../../proyecto_controller.js')

const { default: Proyecto } =
    await import('../../../models/Proyecto.js')

describe('Actualizar Proyectos',()=>{
    test('Debe retornar 404 si el proyecto no existe', async () => {

    Proyecto.findById = jest.fn()
        .mockResolvedValue(null)

    const req = {
        params: {
            id: '123'
        },
        usuario: {
            _id: 'admin1'
        },
        body: {}
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await actualizarProyecto(req, res)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Proyecto no encontrado'
    })

})

test('Debe actualizar el título correctamente', async () => {

    const mockProyecto = {

        registradoPor: {
            toString: () => 'admin1'
        },

        titulo: 'Titulo viejo',

        save: jest.fn()
            .mockResolvedValue(true)

    }

    Proyecto.findById = jest.fn()
        .mockResolvedValue(mockProyecto)

    const req = {

        params: {
            id: '123'
        },

        usuario: {
            _id: 'admin1'
        },

        body: {
            titulo: 'Titulo nuevo'
        }

    }
        const consoleSpy = jest
        .spyOn(console, 'error')
    .   mockImplementation(() => {})

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
        
    }

    await actualizarProyecto(req, res)

    expect(mockProyecto.titulo)
        .toBe('Titulo nuevo')

    expect(mockProyecto.save)
        .toHaveBeenCalled()
    expect(mockRegistrarActividad).toHaveBeenCalled()

    expect(res.status)
        .toHaveBeenCalledWith(200)

})
test('Debe actualizar las tecnologías correctamente', async () => {

    const mockProyecto = {

        registradoPor: {
            toString: () => 'admin1'
        },

        tecnologias: [],

        save: jest.fn()
            .mockResolvedValue(true)

    }

    Proyecto.findById = jest.fn()
        .mockResolvedValue(mockProyecto)

    const req = {

        params: {
            id: '123'
        },

        usuario: {
            _id: 'admin1'
        },

        body: {
            tecnologias: 'NodeJS, MongoDB'
        }

    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await actualizarProyecto(req, res)

    expect(mockProyecto.save)
        .toHaveBeenCalled()

    expect(res.status)
        .toHaveBeenCalledWith(200)
    
    expect(mockRegistrarActividad).toHaveBeenCalled()

})
test('Debe actualizar correctamente un proyecto', async () => {

    const mockProyecto = {

        registradoPor: {
            toString: () => 'admin1'
        },

        save: jest.fn()
            .mockResolvedValue(true)

    }

    Proyecto.findById = jest.fn()
        .mockResolvedValue(mockProyecto)

    const req = {

        params: {
            id: '123'
        },

        usuario: {
            _id: 'admin1'
        },

        body: {
            titulo: 'Nuevo titulo',
            descripcion: 'Nueva descripcion'
        }

    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await actualizarProyecto(req, res)

    expect(mockProyecto.save)
        .toHaveBeenCalled()

    expect(res.status)
        .toHaveBeenCalledWith(200)

    expect(res.json)
        .toHaveBeenCalledWith({
            msg: 'Proyecto actualizado correctamente'
        })
    expect(mockRegistrarActividad).toHaveBeenCalled()

})
test('Debe retornar 500 si ocurre un error interno', async () => {

    const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

    Proyecto.findById = jest.fn()
        .mockRejectedValue(new Error())

    const req = {

        params: {
            id: '123'
        },

        usuario: {
            _id: 'admin1'
        },

        body: {}

    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await actualizarProyecto(req, res)

    expect(res.status)
        .toHaveBeenCalledWith(500)

    expect(res.json)
        .toHaveBeenCalledWith({
            msg: 'Error en el servidor'
        })

    consoleSpy.mockRestore()

})

})