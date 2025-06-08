const fs = require('fs');
const path = require('path');

// Copy package.json and package-lock.json
fs.copyFileSync('../package.json', './package.json');
fs.copyFileSync('../package-lock.json', './package-lock.json');

// Create lib directory if it doesn't exist
const libDir = path.join(__dirname, 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// Copy build artifacts
const buildDir = path.join(__dirname, '../lib');
const files = fs.readdirSync(buildDir);

files.forEach(file => {
  const src = path.join(buildDir, file);
  const dest = path.join(libDir, file);
  fs.copyFileSync(src, dest);
});

console.log('Setup completed successfully');
