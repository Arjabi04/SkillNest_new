import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const variablesCssPath = path.join(__dirname, 'frontend/src/styles/variables.css');
const srcDir = path.join(__dirname, 'frontend/src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
const textFiles = allFiles.filter(f => f.endsWith('.jsx') || f.endsWith('.css') || f.endsWith('.js'));

const variablesContent = fs.readFileSync(variablesCssPath, 'utf8');
const variableRegex = /--(color-[a-zA-Z0-9-]+):/g;

let match;
const variables = new Set();
while ((match = variableRegex.exec(variablesContent)) !== null) {
  variables.add('--' + match[1]);
}

const unusedVariables = new Set(variables);

for (const file of textFiles) {
  if (file === variablesCssPath) continue; // Skip the definitions themselves
  const content = fs.readFileSync(file, 'utf8');
  for (const variable of unusedVariables) {
    if (content.includes(variable)) {
      unusedVariables.delete(variable);
    }
  }
}

// Also check if some variables are used in variables.css itself (e.g. --color-primary: var(--color-blue-600))
const variablesCssContentWithoutDeclarations = variablesContent.replace(/--[a-zA-Z0-9-]+:/g, '');
for (const variable of unusedVariables) {
  if (variablesCssContentWithoutDeclarations.includes(variable)) {
    unusedVariables.delete(variable);
  }
}

console.log('Unused variables:', Array.from(unusedVariables));

// Now remove them from variables.css
let newVariablesContent = variablesContent;
for (const variable of unusedVariables) {
  const regex = new RegExp(`^\\s*${variable}:[^;]+;\\s*$`, 'gm');
  newVariablesContent = newVariablesContent.replace(regex, '');
}

fs.writeFileSync(variablesCssPath, newVariablesContent);
console.log('Removed unused variables from variables.css');
