import { describe, test, expect, jest } from '@jest/globals'




const { obtenerProyecto } =
    await import('../../proyecto_controller.js')

const { default: Proyecto } =
    await import('../../../models/Proyecto.js')

describe('Obtener Proyectos', () => {

    test('Debe retornar una lista de proyectos', async () => {

        Proyecto.distinct = jest.fn()
            .mockResolvedValue(['25-A'])

        Proyecto.countDocuments = jest.fn()
            .mockResolvedValue(2)

        Proyecto.find = jest.fn()
            .mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([
            { titulo: 'Proyecto 1' },
            { titulo: 'Proyecto 2' }
                ])
            })

        const req = {
            query: {}
        }

        const res = {
           status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await obtenerProyecto(req, res)

        expect(res.json).toHaveBeenCalledWith({
            total: 2,
            pagina: 1,
            totalPaginas: 1,
            resultados: [
                { titulo: 'Proyecto 1' },
                { titulo: 'Proyecto 2' }
            ]
        })

    })

    test('Debe aplicar filtro por título', async () => {

        Proyecto.distinct = jest.fn()
            .mockResolvedValue(['25-A'])

        Proyecto.countDocuments = jest.fn()
            .mockResolvedValue(1)

        Proyecto.find = jest.fn()
            .mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([
                    { titulo: 'Sistema Web' }
                ])
            })

        const req = {
            query: {
                titulo: 'Sistema'
            },
  
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await obtenerProyecto(req, res)

        expect(Proyecto.countDocuments)
            .toHaveBeenCalled()

    })

    test('Debe retornar resultados paginados', async () => {

        Proyecto.distinct = jest.fn()
            .mockResolvedValue(['25-A'])

        Proyecto.countDocuments = jest.fn()
            .mockResolvedValue(20)

        Proyecto.find = jest.fn()
            .mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            })

        const req = {
            query: {
                page: '2',
                limit: '10'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await obtenerProyecto(req, res)

        expect(res.json).toHaveBeenCalledWith({
            total: 20,
            pagina: 2,
            totalPaginas: 2,
            resultados: []
        })

    })

    test('Debe retornar 500 si ocurre un error', async () => {

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        Proyecto.countDocuments = jest.fn()
            .mockRejectedValue(new Error())

        const req = {
            query: {},


            usuario: {
             _id: 'admin1',
            email: 'admin@test.com'
}
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        

        await obtenerProyecto(req, res)

        

        expect(res.status)
            .toHaveBeenCalledWith(500)

        expect(res.json)
            .toHaveBeenCalledWith({
                msg: 'Error del servidor'
            })

        consoleSpy.mockRestore()

    })

})