const cloudinary = require('cloudinary').v2
const fs = require('fs')
require('dotenv').config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAMES,
    api_key: process.env.CLOUDINARY_API_KEYS,
    api_secret: process.env.CLOUDINARY_API_SECRETS
})


const uploadImageOnCloudinary = async (filePath, folderName) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, { folder: folderName })

        try {
            fs.unlinkSync(filePath)
            return {
                secure_url: result.secure_url,
                public_id: result.public_id
            }
        } catch (error) {
            console.log('failed to delete server');

        }

    } catch (error) {
        throw new Error(error)
    }
}

const deleteImageOnCloudinary = async (public_id) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id)
        return result
    } catch (error) {
        throw new Error(error)
    }
}

module.exports = {
    uploadImageOnCloudinary,
    deleteImageOnCloudinary,
};