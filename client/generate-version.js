import fs from 'fs';
import path from 'path';
import packageJson from './package.json' assert { type: 'json' };

const appVersion = packageJson.version;

const jsonData = {
  version: appVersion
};
const outputDir = 'src';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
const filePath = path.join(outputDir, 'version.json');
fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
