const sendMail = async (to, subject, html) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_PASS, // API Key de Brevo
      },
      body: JSON.stringify({
        sender: { 
          name: "Sistema de Proyectos de Integración Curricular", 
          email: process.env.BREVO_USER 
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    console.log("Correo enviado por API correctamente");
  } catch (error) {
    console.error("Error crítico al enviar el correo vía API:");
    throw error;
  }
};

export default sendMail;



