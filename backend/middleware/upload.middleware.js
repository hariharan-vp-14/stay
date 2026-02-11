const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'properties');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedExt = /\.(jpe?g|png|webp)$/i;
  const allowedMime = /^image\/(jpeg|jpg|pjpeg|png|webp)$/i;
  const extOk = allowedExt.test(path.extname(file.originalname));
  const mimeOk = allowedMime.test(file.mimetype);
  if (extOk || mimeOk) return cb(null, true);
  cb(new Error('Only .jpg, .jpeg, .png and .webp images are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

module.exports = upload;
