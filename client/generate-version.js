import fs from 'fs';
import path from 'path';
import packageJson from './package.json' assert { type: 'json' };

let [major, minor, patch] = packageJson.version.split('.').map(Number);

// Rule:
// If patch is 0 → bump patch
// If patch > 0 → bump minor and reset patch
if (patch === 0) {
  patch += 1;  // 2.1.0 → 2.1.1
} else {
  minor += 1;  // 2.0.10 → 2.1.0
  patch = 0;
}

const newVersion = `${major}.${minor}.${patch}`;

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

// Prepare version.json
const jsonData = {
  version: newVersion,
  buildDate: new Date().toISOString()
};

const outputDir = 'src';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const filePath = path.join(outputDir, 'version.json');
fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');

console.log("Updated to version:", newVersion);
