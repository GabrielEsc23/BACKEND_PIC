import { test, expect, jest, describe } from '@jest/globals'

const mockRegistrarActividad = jest.fn().mockResolvedValue()

jest.unstable_mockModule('../../../helpers/RegistrarActividad.js', () => ({
    default: mockRegistrarActividad
}))

const { eliminarProyecto } =
    await import('../../proyecto_controller.js')

const { default: Proyecto } =
    await import('../../../models/Proyecto.js')

import { v2 as cloudinary } from 'cloudinary'

describe('Eliminar Proyectos',()=>{

    test('Debe retornar 404 si el proyecto no existe', async () => {

    Proyecto.findById = jest.fn()
        .mockResolvedValue(null)

    const req = {
    params: {
        id: '123'
    },
    usuario: {
        _id: 'admin1',
        email: 'admin@test.com'
    }
}
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await eliminarProyecto(req, res)
    
    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Proyecto no encontrado'
    })

})
test('Debe eliminar correctamente un proyecto', async () => {

    const mockProyecto = {

        archivoPDF:
            'https://res.cloudinary.com/demo/proyectos/archivo.pdf',

        deleteOne: jest.fn()
            .mockResolvedValue(true)

    }

    Proyecto.findById = jest.fn()
        .mockResolvedValue(mockProyecto)

    cloudinary.uploader = {
        destroy: jest.fn()
            .mockResolvedValue({})
    }

    const req = {
        params: {
            id: '123'
        },
         usuario: {
        _id: 'admin1',
        email: 'admin@test.com'
    }
    }

    const res = {
        json: jest.fn()
    }

    await eliminarProyecto(req, res)

expect(mockProyecto.deleteOne).toHaveBeenCalled()
expect(mockRegistrarActividad).toHaveBeenCalled()

expect(res.json).toHaveBeenCalledWith({
    msg: 'Proyecto y archivo eliminados correctamente'
})

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
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@test.com'
    }
}

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await eliminarProyecto(req, res)

    expect(res.status).toHaveBeenCalledWith(500)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Error al eliminar el proyecto',
        error: expect.any(String)
    })

    consoleSpy.mockRestore()

})
})