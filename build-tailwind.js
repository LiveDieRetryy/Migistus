const execSync = require('child_process').execSync;

// Build Tailwind CSS from src/styles/globals.css to public/tailwind.css
execSync('npx tailwindcss -i ./src/styles/globals.css -o ./public/tailwind.css --minify', { stdio: 'inherit' });
