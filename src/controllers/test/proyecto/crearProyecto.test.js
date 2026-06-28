import { describe, test, expect, jest } from '@jest/globals'
const mockRegistrarActividad = jest.fn()

jest.unstable_mockModule('../../../helpers/RegistrarActividad.js', () => ({
    default: mockRegistrarActividad
}))
const mockSubirPDF = jest.fn()

jest.unstable_mockModule('../../../config/cloudinary.js', () => ({
    subirPDF: mockSubirPDF,
    subirPortada: jest.fn()
}))

const { crearProyecto } = await import('../../proyecto_controller.js')

const { default: Proyecto } = await import('../../../models/Proyecto.js')

describe('Crear Proyecto', () => {

    test('Debe retornar 400 si no se envía archivo PDF', async () => {

        const req = {
            files: {},
            body: {}
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await crearProyecto(req, res)

        expect(res.status).toHaveBeenCalledWith(400)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'El archivo PDF es obligatorio'
        })

    })

    test('Debe retornar 400 si el período académico es inválido', async () => {

    mockSubirPDF.mockResolvedValue({
        secure_url: 'pdf-falso'
    })

    const req = {
        files: {
            archivoPDF: [
                {
                    buffer: Buffer.from('pdf')
                }
            ]
        },
        body: {
            periodoAcademico: 'ABC'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearProyecto(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Formato de periodo inválido. Ejemplo: 25-A'
    })

})

test('Debe crear un proyecto correctamente', async () => {

    mockSubirPDF.mockResolvedValue({
        secure_url: 'https://cloudinary.com/proyecto.pdf'
    })

    const proyectoGuardado = {
        _id: '123'
    }

    Proyecto.prototype.save = jest.fn()
        .mockResolvedValue(proyectoGuardado)

    Proyecto.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
            _id: '123',
            titulo: 'Proyecto Test',
            portada: {
                url: 'https://cloudinary.com/portada.png'
            },
            toObject() {
                return {
                    _id: '123',
                    titulo: 'Proyecto Test',
                    portada: {
                        url: 'https://cloudinary.com/portada.png'
                    }
                }
            }
        })
    })

    const req = {
        usuario: {
            _id: 'admin123'
        },
        files: {
            archivoPDF: [
                {
                    buffer: Buffer.from('pdf')
                }
            ]
        },
        body: {
            titulo: 'Proyecto Test',
            descripcion: 'Descripción',
            autor: 'Gabriel Escobar',
            fecha: '2025-01-01',
            tutor: 'Tutor Test',
            palabrasClave: 'nodejs,mongodb',
            tecnologias: 'express,mongoose',
            periodoAcademico: '25-A',
            carrera: 'Tecnología Superior en Desarrollo de Software'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearProyecto(req, res)
    expect(mockRegistrarActividad).toHaveBeenCalled()

    expect(res.status)
        .toHaveBeenCalledWith(201)

})

test('Debe retornar 500 si ocurre un error al crear el proyecto', async () => {

    mockSubirPDF.mockRejectedValue(
        new Error('Error Cloudinary')
    )

    const req = {
        files: {
            archivoPDF: [
                {
                    buffer: Buffer.from('pdf')
                }
            ]
        },
        body: {
            periodoAcademico: '25-A'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await crearProyecto(req, res)

    expect(res.status)
        .toHaveBeenCalledWith(500)

    expect(res.json)
        .toHaveBeenCalledWith({
            msg: 'Error al crear proyecto'
        })

})

})
