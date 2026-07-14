const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Garante que o diretório de uploads exista
const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'cargas');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Nome único para evitar sobrescritas
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB por foto
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens (JPEG, PNG, WEBP) são permitidas!'), false);
        }
    }
});

module.exports = upload;
