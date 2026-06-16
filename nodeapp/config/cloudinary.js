const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dv0jouxui',
  api_key: process.env.CLOUDINARY_API_KEY || '892264379247193',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'D6fMK_RBUKGuTfM1bNeJb410Fec',
});

module.exports = cloudinary;
