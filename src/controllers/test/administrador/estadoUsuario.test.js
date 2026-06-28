import { describe, test, expect, jest } from '@jest/globals'


const mockRegistrarActividad = jest.fn()

jest.unstable_mockModule(
    '../../../helpers/RegistrarActividad.js',
    () => ({
        default: mockRegistrarActividad
    })
)
const { cambiarEstadoCuenta } =
    await import('../../administrador_controller.js')

const { default: Usuario } =
    await import('../../../models/Usuario.js')

const { default: Administrador } =
    await import('../../../models/Administrador.js')





describe('Estado Cuenta', () => {

    test('Debe retornar 400 si el estado es inválido', async () => {

        const req = {
            params: { id: '123' },
            body: { estado: 'bloqueado' }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await cambiarEstadoCuenta(req, res)

        expect(res.status).toHaveBeenCalledWith(400)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Estado inválido'
        })

    })

    test('Debe retornar 404 si la cuenta no existe', async () => {

        Usuario.findById = jest.fn().mockResolvedValue(null)
        Administrador.findById = jest.fn().mockResolvedValue(null)

        const req = {
            params: { id: '123' },
            body: { estado: 'activo' }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await cambiarEstadoCuenta(req, res)

        expect(res.status).toHaveBeenCalledWith(404)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Cuenta no encontrada'
        })

    })

    test('Debe activar correctamente un usuario', async () => {

        const mockUsuario = {
            _id: '1',
            email: 'usuario@test.com',
            estado: 'inactivo',
            save: jest.fn().mockResolvedValue(true)
        }

        Usuario.findById = jest.fn().mockResolvedValue(mockUsuario)
        Administrador.findById = jest.fn()

        const req = {
            params: { id: '123' },
            body: { estado: 'activo' },
            usuario: {
                _id: 'admin1',
                email: 'admin@test.com'
            },
            
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await cambiarEstadoCuenta(req, res)

        expect(mockUsuario.estado).toBe('activo')
        expect(mockUsuario.save).toHaveBeenCalled()
        expect(mockRegistrarActividad).toHaveBeenCalled()

        expect(res.status).toHaveBeenCalledWith(200)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Usuario activo correctamente'
        })

    })

    test('Debe desactivar correctamente un usuario', async () => {

        const mockUsuario = {
            _id: '1',
            email: 'usuario@test.com',
            estado: 'activo',
            save: jest.fn().mockResolvedValue(true)
        }

        Usuario.findById = jest.fn().mockResolvedValue(mockUsuario)
        Administrador.findById = jest.fn()

        const req = {
            params: { id: '123' },
            body: { estado: 'inactivo' },
            usuario: {
                _id: 'admin1',
                email: 'admin@test.com'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await cambiarEstadoCuenta(req, res)

        expect(mockUsuario.estado).toBe('inactivo')
        expect(mockUsuario.save).toHaveBeenCalled()
        expect(mockRegistrarActividad).toHaveBeenCalled()

        expect(res.status).toHaveBeenCalledWith(200)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Usuario inactivo correctamente'
        })

    })

    test('Debe activar correctamente un administrador', async () => {

        Usuario.findById = jest.fn().mockResolvedValue(null)

        const mockAdmin = {
            _id: '2',
            email: 'admin2@test.com',
            estado: 'inactivo',
            save: jest.fn().mockResolvedValue(true)
        }

        Administrador.findById = jest.fn().mockResolvedValue(mockAdmin)

        const req = {
            params: { id: '123' },
            body: { estado: 'activo' },
            usuario: {
                _id: 'admin1',
                email: 'admin@test.com'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await cambiarEstadoCuenta(req, res)

        expect(mockAdmin.estado).toBe('activo')
        expect(mockAdmin.save).toHaveBeenCalled()

        expect(res.status).toHaveBeenCalledWith(200)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Administrador activo correctamente'
        })

    })

    test('Debe desactivar correctamente un administrador', async () => {

        Usuario.findById = jest.fn().mockResolvedValue(null)

        const mockAdmin = {
            _id: '2',
            email: 'admin2@test.com',
            estado: 'activo',
            save: jest.fn().mockResolvedValue(true)
        }

        Administrador.findById = jest.fn().mockResolvedValue(mockAdmin)

        const req = {
            params: { id: '123' },
            body: { estado: 'inactivo' },
            usuario: {
                _id: 'admin1',
                email: 'admin@test.com'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await cambiarEstadoCuenta(req, res)

        expect(mockAdmin.estado).toBe('inactivo')
        expect(mockAdmin.save).toHaveBeenCalled()

        expect(res.status).toHaveBeenCalledWith(200)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Administrador inactivo correctamente'
        })

    })

    test('Debe retornar 500 si ocurre un error interno', async () => {

        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        Usuario.findById = jest.fn().mockRejectedValue(new Error())

        const req = {
            params: { id: '123' },
            body: { estado: 'activo' },
            usuario: {
                _id: 'admin1',
                email: 'admin@test.com'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await cambiarEstadoCuenta(req, res)

        expect(res.status).toHaveBeenCalledWith(500)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Error en el servidor'
        })

        consoleSpy.mockRestore()

    })

})