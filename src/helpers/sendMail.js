import sendMail from "../config/nodemailer.js"
import dotenv from 'dotenv'
dotenv.config()


const sendMailToRegister = (userMail, token) => {
  return sendMail(
    userMail,
    "Verificación de cuenta - Sistema de Proyectos de Integración Curricular ESFOT",
    `
    <div style="max-width:600px;margin:auto;padding:20px;font-family:Arial,sans-serif;border:1px solid #ddd;border-radius:10px;">
      
      <h2 style="color:#003366;text-align:center;">
        Sistema de Proyectos de Integración Curricular ESFOT
      </h2>

      <p>Hola,</p>

      <p>
        Gracias por registrarte en la plataforma.
        Para activar tu cuenta, haz clic en el siguiente botón:
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="${process.env.URL_FRONTEND}/confirmar/${token}"
          style="
            background:#003366;
            color:white;
            padding:12px 24px;
            text-decoration:none;
            border-radius:5px;
            display:inline-block;
          ">
          Confirmar cuenta
        </a>
      </div>

      <p>
        Si no realizaste este registro, puedes ignorar este mensaje.
      </p>

      <hr>

      <p style="font-size:12px;color:gray;text-align:center;">
        Escuela de Formación de Tecnólogos - ESFOT
      </p>

    </div>
    `
  )
}

const sendMailToRecoveryPassword = (userMail, token) => {
  return sendMail(
    userMail,
    "Recuperación de contraseña - Sistema de Proyectos de Integración Curricular ESFOT",
    `
    <div style="max-width:600px;margin:auto;padding:20px;font-family:Arial,sans-serif;border:1px solid #ddd;border-radius:10px;">

      <h2 style="color:#003366;text-align:center;">
        Recuperación de contraseña
      </h2>

      <p>Hola,</p>

      <p>
        Se ha recibido una solicitud para restablecer la contraseña de tu cuenta.
      </p>

      <p>
        Para continuar con el proceso, haz clic en el siguiente botón:
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="${process.env.URL_FRONTEND}/recuperarpassword/${token}"
          style="
            background:#003366;
            color:white;
            padding:12px 24px;
            text-decoration:none;
            border-radius:5px;
            display:inline-block;
          ">
          Restablecer contraseña
        </a>
      </div>

      <p>
        Por motivos de seguridad, este enlace tiene una validez limitada.
      </p>

      <p>
        Si no realizaste esta solicitud, puedes ignorar este mensaje.
      </p>

      <hr>

      <p style="font-size:12px;color:gray;text-align:center;">
        Escuela de Formación de Tecnólogos - ESFOT
      </p>

    </div>
    `
  )
}
const sendMailToAdministrator = (userMail,token, password) => {
  return sendMail(
    userMail,
    "Bienvenido al Sistema de Proyectos de Integración Curricular ESFOT",
    `
    <div style="max-width:600px;margin:auto;padding:20px;font-family:Arial,sans-serif;border:1px solid #ddd;border-radius:10px;">

      <h2 style="color:#003366;text-align:center;">
        Bienvenido al sistema
      </h2>

      <p>
        Se ha creado una cuenta para acceder al Sistema de Proyectos de Integración Curricular de la ESFOT.
      </p>

      <p>
        Tus credenciales iniciales son:
      </p>

      <div style="background:#f5f5f5;padding:15px;border-radius:5px;">
        <p><strong>Correo:</strong> ${userMail}</p>
        <p><strong>Contraseña:</strong> ${password}</p>
      </div>

      <p>
        Por motivos de seguridad, se recomienda cambiar la contraseña después del primer inicio de sesión.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a href="${process.env.URL_FRONTEND}/confirmar/${token}"
          style="
            background:#003366;
            color:white;
            padding:12px 24px;
            text-decoration:none;
            border-radius:5px;
            display:inline-block;
          ">
          Confirmar Cuenta
        </a>
      </div>

      <hr>

      <p style="font-size:12px;color:gray;text-align:center;">
        Escuela de Formación de Tecnólogos - ESFOT
      </p>

    </div>
    `
  )
}

export {
    sendMailToRegister,
    sendMailToRecoveryPassword,
    sendMailToAdministrator
}