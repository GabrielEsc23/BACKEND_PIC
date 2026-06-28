import { describe, test, expect, jest } from '@jest/globals'


const mockRegistrarActividad = jest.fn()
jest.unstable_mockModule(
    '../../../helpers/RegistrarActividad.js',
    () => ({
        default: mockRegistrarActividad
    })
)

const mockCreateTokenJWT = jest.fn()

jest.unstable_mockModule('../../../middlewares/JWT.js', () => ({
    createTokenJWT: mockCreateTokenJWT
}))

const { login } = await import('./../../auth_controllers.js')

const { default: Administrador } = await import('../../../models/Administrador.js')
const { default: Usuario } = await import('../../../models/Usuario.js')


describe('Login Controller', () => {

    test('Debe existir la función login', () => {
        expect(login).toBeDefined()
    })

    test('Debe retornar 400 si faltan campos', async () => {

        const req = {
            body: {}
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await login(req, res)

        expect(res.status).toHaveBeenCalledWith(400)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Debes llenar todos los campos'
        })

    })

    test('Debe retornar 401 si el usuario no existe', async () => {

        Usuario.findOne = jest.fn().mockResolvedValue(null)
        Administrador.findOne = jest.fn().mockResolvedValue(null)

        const req = {
            body: {
                email: 'test@epn.edu.ec',
                password: 'Password123'
            }
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }

        await login(req, res)
        expect(mockRegistrarActividad).toHaveBeenCalled()

        expect(res.status).toHaveBeenCalledWith(401)

        expect(res.json).toHaveBeenCalledWith({
            msg: 'Credenciales incorrectas'
        })

    })
    test('Debe retornar 403 si la cuenta no está verificada', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: false
    })

    const req = {
        body: {
            email: 'test@epn.edu.ec',
            password: 'Password123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await login(req, res)
    expect(mockRegistrarActividad).toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Debes verificar tu cuenta antes de iniciar sesión'
    })

})

test('Debe retornar 403 si la cuenta está desactivada', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: true,
        estado: 'inactivo'
    })

    const req = {
        body: {
            email: 'test@epn.edu.ec',
            password: 'Password123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await login(req, res)
    expect(mockRegistrarActividad).toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Tu cuenta ha sido desactivada'
    })

})

test('Debe retornar 401 si la contraseña es incorrecta', async () => {

    Usuario.findOne = jest.fn().mockResolvedValue({
        confirmEmail: true,
        estado: 'activo',
        matchPassword: jest.fn().mockResolvedValue(false)
    })

    const req = {
        body: {
            email: 'test@epn.edu.ec',
            password: 'Password123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await login(req, res)
    expect(mockRegistrarActividad).toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(401)

    expect(res.json).toHaveBeenCalledWith({
        msg: 'Credenciales incorrectas'
    })

})

test('Debe retornar 200 y un token si el login es exitoso', async () => {

    mockCreateTokenJWT.mockReturnValue('token-falso')

    Usuario.findOne = jest.fn().mockResolvedValue({
        _id: '123',
        nombre: 'Gabriel',
        apellido: 'Escobar',
        email: 'gabriel@epn.edu.ec',
        rol: 'usuario',
        confirmEmail: true,
        estado: 'activo',
        matchPassword: jest.fn().mockResolvedValue(true)
    })

    const req = {
        body: {
            email: 'gabriel@epn.edu.ec',
            password: 'Password123'
        }
    }

    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    }

    await login(req, res)

    expect(mockCreateTokenJWT).toHaveBeenCalledWith('123', 'usuario')

    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({
        token: 'token-falso',
        rol: 'usuario',
        nombre: 'Gabriel',
        apellido: 'Escobar',
        _id: '123',
        email: 'gabriel@epn.edu.ec'
    })

})

})




