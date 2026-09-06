#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const versionPropsPath = path.resolve('android/app/version.properties');
const pkgPath = path.resolve('package.json');

const bumpType = process.argv[2] || 'build'; // 'build' | 'patch' | 'minor' | 'major'

// 1. Read version.properties
let versionCode = 1;
let versionName = '1.0.0';

if (fs.existsSync(versionPropsPath)) {
  const content = fs.readFileSync(versionPropsPath, 'utf-8');
  const codeMatch = content.match(/VERSION_CODE=(\d+)/);
  const nameMatch = content.match(/VERSION_NAME=([\d.]+)/);
  if (codeMatch) versionCode = parseInt(codeMatch[1], 10);
  if (nameMatch) versionName = nameMatch[1];
}

// 2. Increment Version Code
versionCode += 1;

// 3. Increment Version Name if requested
if (bumpType !== 'build') {
  const parts = versionName.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);

  if (bumpType === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (bumpType === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  } else if (bumpType === 'patch') {
    parts[2] += 1;
  }
  versionName = parts.join('.');
}

// 4. Save version.properties
const updatedProperties = `# Khata Android App Version Properties\nVERSION_CODE=${versionCode}\nVERSION_NAME=${versionName}\n`;
fs.writeFileSync(versionPropsPath, updatedProperties, 'utf-8');

// 5. Update package.json version
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.version = versionName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}

console.log(`\x1b[32m✔ [Khata Version Bump] New Version Code: ${versionCode}, Version Name: ${versionName}\x1b[0m`);
