import multer from "multer"

const storage = multer.memoryStorage()
const fileFilter=(req,file,cb)=>{

   // Se establcen los formatos permitidos
   const tiposPermitidos=[

      "application/pdf",

      "image/png",

      "image/jpeg",

      "image/jpg"

   ]

   if(tiposPermitidos.includes(file.mimetype)){

      cb(null,true)

   }else{

      cb(
        new Error(
         "Solo PDF, JPG, JPEG o PNG"
        ),
        false
      )

   }

}


const upload=multer({

storage,

fileFilter,

limits:{
   fileSize:10*1024*1024
}

})

export default upload
