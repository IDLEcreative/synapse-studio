#!/usr/bin/env node

/**
 * This script updates deprecated Tailwind CSS v3 classes to their v4 equivalents
 * Run with: node scripts/update-tailwind-classes.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Class mappings from v3 to v4
const CLASS_MAPPINGS = {
  'flex-shrink-0': 'shrink-0',
  // Add more mappings as needed
};

// File extensions to process
const FILE_EXTENSIONS = ['.tsx', '.jsx', '.js', '.ts'];

// Directories to exclude
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', 'out', 'build', 'dist'];

// Get the project root directory
const ROOT_DIR = path.resolve(process.cwd());

// Function to recursively find files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip excluded directories
      if (!EXCLUDE_DIRS.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (FILE_EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to update classes in a file
function updateClassesInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Check for each deprecated class
  Object.entries(CLASS_MAPPINGS).forEach(([oldClass, newClass]) => {
    if (content.includes(oldClass)) {
      console.log(`Updating ${oldClass} to ${newClass} in ${filePath}`);
      content = content.replace(new RegExp(oldClass, 'g'), newClass);
      updated = true;
    }
  });

  // Save the file if changes were made
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main function
function main() {
  console.log('Searching for files with deprecated Tailwind CSS classes...');
  const files = findFiles(ROOT_DIR);
  console.log(`Found ${files.length} files to check.`);

  let updatedCount = 0;

  files.forEach(file => {
    if (updateClassesInFile(file)) {
      updatedCount++;
    }
  });

  console.log(`Updated ${updatedCount} files.`);

  if (updatedCount > 0) {
    console.log('Running formatter...');
    try {
      execSync('npm run format', { stdio: 'inherit' });
    } catch (error) {
      console.error('Error running formatter:', error.message);
    }
  }
}

// Run the script
main();
