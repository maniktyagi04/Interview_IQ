const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads');
const profilesDir = path.join(uploadDir, 'profiles');
const resumesDir = path.join(uploadDir, 'resumes');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profileImage') {
      cb(null, profilesDir);
    } else if (file.fieldname === 'resume') {
      cb(null, resumesDir);
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profileImage') {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    return cb(new Error('Only JPEG, JPG, PNG, and WEBP images are allowed!'));
  } else if (file.fieldname === 'resume') {
    const allowedTypes = /pdf|docx|doc/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (ext) {
      return cb(null, true);
    }
    return cb(new Error('Only PDF, DOC, and DOCX resumes are allowed!'));
  }
  cb(new Error('Unexpected field name'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
