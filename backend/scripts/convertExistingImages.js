const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Convert existing images to WebP format
 * This script converts all JPEG, JPG, and PNG images to WebP
 */

const convertImageToWebP = async (inputPath, outputPath) => {
  try {
    
    
    await sharp(inputPath)
      .webp({
        quality: 80,
        effort: 6
      })
      .toFile(outputPath);
    
  
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath}:`, error.message);
    return false;
  }
};

const findImages = (dir, extensions = ['.jpg', '.jpeg', '.png']) => {
  const images = [];
  
  const scanDirectory = (currentDir) => {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          images.push(fullPath);
        }
      }
    }
  };
  
  scanDirectory(dir);
  return images;
};

const convertExistingImages = async () => {
  try {
 
    
    // Find all images in the project
    const projectRoot = path.join(__dirname, '..');
    const images = findImages(projectRoot);
    
    if (images.length === 0) {
     
      return;
    }
    
   
    
    let converted = 0;
    let failed = 0;
    
    for (const imagePath of images) {
      const ext = path.extname(imagePath);
      const webpPath = imagePath.replace(ext, '.webp');
      
      // Skip if WebP already exists
      if (fs.existsSync(webpPath)) {
      
        continue;
      }
      
      const success = await convertImageToWebP(imagePath, webpPath);
      
      if (success) {
        converted++;
        
        // Optionally delete original file (uncomment if desired)
        // fs.unlinkSync(imagePath);
       
      } else {
        failed++;
      }
    }
    
  
    
  } catch (error) {
    console.error('❌ Error during conversion process:', error);
  }
};

// Run the conversion
if (require.main === module) {
  convertExistingImages();
}

module.exports = { convertExistingImages, convertImageToWebP };
