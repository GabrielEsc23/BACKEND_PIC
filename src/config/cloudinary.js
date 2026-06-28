import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

//Documento PDF
export const subirPDF = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "proyectos",
        public_id: "proyecto-" + Date.now()
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
// Portada
export const subirPortada = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "portadas",
        public_id: "portada-" + Date.now()
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )

    streamifier.createReadStream(buffer).pipe(stream)
  })
}

export default cloudinary;




