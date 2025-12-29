const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Replace email checks with tier checks
    content = content.replace(/user\?\.email !== 'admin@migistus\.com'/g, "user?.tier !== 'Admin'");
    content = content.replace(/user\?\.email !== "admin@migistus\.com"/g, 'user?.tier !== "Admin"');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
    return false;
  }
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

console.log('🔍 Searching for files with hardcoded admin email checks...\n');

let count = 0;
walkDir('./src', (filePath) => {
  if (replaceInFile(filePath)) {
    count++;
  }
});

console.log(`\n✨ Done! Updated ${count} files.`);
