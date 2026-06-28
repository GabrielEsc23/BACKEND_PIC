import { describe, test, expect, jest } from '@jest/globals'

const { confirmarEmail } = await import('../../auth_controllers.js')

const { default: Usuario } = await import('../../../models/Usuario.js')
const { default: Administrador } = await import('../../../models/Administrador.js')

describe('Confirmar Email Controller', () => {

    test('Debe retornar 404 si el token es inválido', async () => {

        Usuario.findOne = jest.fn().mockResolvedValue(null)
        Administrador.findOne = jest.fn().mockResolvedValue(null)

        const req = {
            params: {
                token: 'token-invalido'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await confirmarEmail(req, res)

        expect(res.status).toHaveBeenCalledWith(404)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Token inválido o cuenta ya confirmada'
        })

    })

    test('Debe confirmar correctamente una cuenta de usuario', async () => {

        const mockUsuario = {
            verifyToken: 'token123',
            confirmEmail: false,
            save: jest.fn().mockResolvedValue(true)
        }

        Usuario.findOne = jest.fn().mockResolvedValue(mockUsuario)

        const req = {
            params: {
                token: 'token123'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await confirmarEmail(req, res)

        expect(mockUsuario.verifyToken).toBeNull()

        expect(mockUsuario.confirmEmail).toBe(true)

        expect(mockUsuario.save).toHaveBeenCalled()

        expect(res.status).toHaveBeenCalledWith(200)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Cuenta de usuario confirmada, ya puedes iniciar sesión'
        })

    })

    test('Debe confirmar correctamente una cuenta de administrador', async () => {

        Usuario.findOne = jest.fn().mockResolvedValue(null)

        const mockAdmin = {
            verifyToken: 'token123',
            confirmEmail: false,
            save: jest.fn().mockResolvedValue(true)
        }

        Administrador.findOne = jest.fn().mockResolvedValue(mockAdmin)

        const req = {
            params: {
                token: 'token123'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await confirmarEmail(req, res)

        expect(mockAdmin.verifyToken).toBeNull()

        expect(mockAdmin.confirmEmail).toBe(true)

        expect(mockAdmin.save).toHaveBeenCalled()

        expect(res.status).toHaveBeenCalledWith(200)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Cuenta de administrador confirmada, ya puedes iniciar sesión'
        })

    })

    test('Debe retornar 500 si ocurre un error interno', async () => {

        Usuario.findOne = jest.fn().mockRejectedValue(new Error('Error'))

        const req = {
            params: {
                token: 'token123'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await confirmarEmail(req, res)

        expect(res.status).toHaveBeenCalledWith(500)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Error en el servidor'
        })

    })

})