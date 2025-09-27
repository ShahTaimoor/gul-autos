const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImageOnCloudinary = async (buffer, folderName, options = {}) => {
  try {
    // Convert to WebP if not already
    const { convertToWebP } = require('./imageProcessor');
    const webpBuffer = await convertToWebP(buffer, options);
    
    const base64String = `data:image/webp;base64,${webpBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64String, {
      folder: folderName,
      format: 'webp',
      quality: 'auto',
      fetch_format: 'auto'
    });

    return {
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Cloudinary upload failed');
  }
};

const deleteImageOnCloudinary = async (public_id) => {
  try {
    return await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Cloudinary deletion failed');
  }
};

module.exports = {
  uploadImageOnCloudinary,
  deleteImageOnCloudinary
};
