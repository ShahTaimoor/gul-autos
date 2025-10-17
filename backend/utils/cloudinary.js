const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImageOnCloudinary = async (buffer, folderName, options = {}) => {
  try {
    // Convert to WebP with optimization
    const { convertToWebP } = require('./imageProcessor');
    const webpBuffer = await convertToWebP(buffer, {
      quality: 80,
      width: 1200,
      height: 1200,
      fit: 'inside',
      ...options
    });
    
    console.log(`🔄 Converting image to WebP: ${(buffer.length / 1024).toFixed(2)}KB → ${(webpBuffer.length / 1024).toFixed(2)}KB`);
    
    const base64String = `data:image/webp;base64,${webpBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64String, {
      folder: folderName,
      format: 'webp',
      quality: 'auto:good',
      fetch_format: 'auto',
      flags: 'lossy'
    });

    console.log(`✅ WebP upload successful: ${result.secure_url}`);

    return {
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('Cloudinary upload failed');
  }
};

const uploadResponsiveWebP = async (buffer, folderName, options = {}) => {
  try {
    const { generateResponsiveWebP } = require('./imageProcessor');
    const responsiveImages = await generateResponsiveWebP(buffer);
    
    const uploadResults = {};
    
    for (const [size, webpBuffer] of Object.entries(responsiveImages)) {
      const base64String = `data:image/webp;base64,${webpBuffer.toString('base64')}`;
      
      const result = await cloudinary.uploader.upload(base64String, {
        folder: `${folderName}/${size}`,
        format: 'webp',
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'lossy'
      });
      
      uploadResults[size] = {
        secure_url: result.secure_url,
        public_id: result.public_id
      };
    }
    
    console.log('✅ Responsive WebP images uploaded successfully');
    return uploadResults;
  } catch (error) {
    console.error('❌ Responsive WebP upload error:', error);
    throw new Error('Responsive WebP upload failed');
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
  uploadResponsiveWebP,
  deleteImageOnCloudinary
};
