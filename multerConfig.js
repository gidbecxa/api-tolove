const multer = require('multer');

// Create a storage engine to specify the destination and filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Destination folder where the uploaded files will be stored
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.originalname.split('.').pop();
        cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`); // Filename for the uploaded file
    },
});

// Create the Multer instance with the configured storage engine
const upload = multer({ storage: storage });

module.exports = { upload };