const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, 'src-tauri', 'icons', 'icon.svg');
  const iconsDir = path.join(__dirname, 'src-tauri', 'icons');
  
  // Read SVG
  const svgBuffer = fs.readFileSync(svgPath);
  
  // Generate different sizes
  const sizes = [
    { size: 32, name: '32x32.png' },
    { size: 128, name: '128x128.png' },
    { size: 256, name: '128x128@2x.png' }
  ];
  
  for (const { size, name } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, name));
    
    console.log(`Generated ${name}`);
  }
  
  // Generate ICO file for Windows
  const toIco = require('to-ico');
  
  // Create multiple sizes for ICO
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoBuffers = [];
  
  for (const size of icoSizes) {
    const buffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    icoBuffers.push(buffer);
  }
  
  // Convert to ICO
  const icoBuffer = await toIco(icoBuffers);
  fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);
  
  console.log('Generated icon.ico');
  
  // Generate ICNS file for macOS (placeholder)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon.icns'));
  
  console.log('Generated icon.icns');
}

generateIcons().catch(console.error);
