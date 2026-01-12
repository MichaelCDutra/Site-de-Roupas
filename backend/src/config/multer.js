const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

// Garante que as variáveis de ambiente sejam lidas, caso ainda não tenham sido
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// 1. Configura as chaves do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configura o Storage para salvar direto na nuvem
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "site_roupas", // Nome da pasta que será criada no seu Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    // Opcional: transformar imagem para tamanho padrão
    // transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const upload = multer({ storage: storage });

module.exports = upload;