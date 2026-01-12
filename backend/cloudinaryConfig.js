const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config(); // Para ler as variáveis do .env

// Configura com suas chaves (pegue no painel do Cloudinary)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configura o Storage (onde e como salvar)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'produtos_catalogo', // Nome da pasta no Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage: storage });

module.exports = upload;