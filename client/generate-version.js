import fs from 'fs';
import path from 'path';
import packageJson from './package.json' assert { type: 'json' };

// Extract version parts
let [major, minor, patch] = packageJson.version.split('.').map(Number);

// Always bump minor version & reset patch
minor += 1;
patch = 0;

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
