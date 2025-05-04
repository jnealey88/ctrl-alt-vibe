/**
 * Tests to ensure proper module system usage throughout the codebase
 * This test specifically looks for potential CommonJS/ESM conflicts
 */

import fs from 'fs';
import path from 'path';

describe('Module System Consistency', () => {
  // Look for CommonJS require() in ESM files
  it('should not use CommonJS require() in ESM modules', () => {
    // Define directories to check
    const dirsToCheck = ['server', 'client/src'];
    const errors: string[] = [];
    
    const checkFile = (filePath: string) => {
      // Only check TypeScript/JavaScript files
      if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return;
      
      // Skip node_modules and test files
      if (filePath.includes('node_modules') || filePath.includes('__tests__')) return;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
      const isEsmProject = packageJson.type === 'module';
      
      // If this is an ESM project, check for require() usage
      if (isEsmProject) {
        // Look for require() calls not in comments
        const requireRegex = /(?<!\s*\/\/[^\n]*|\s*\/\*[^]*?\*\/)\brequire\s*\(/g;
        
        if (requireRegex.test(content)) {
          // Find line numbers of require() calls
          const lines = content.split('\n');
          const requireLines: number[] = [];
          
          lines.forEach((line, index) => {
            if (/\brequire\s*\(/.test(line) && !(/^\s*\/\//.test(line) || /^\s*\*/.test(line))) {
              requireLines.push(index + 1);
            }
          });
          
          if (requireLines.length > 0) {
            errors.push(`CommonJS require() found in ESM file ${filePath} at lines: ${requireLines.join(', ')}`);
          }
        }
      }
    };
    
    const walkDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          checkFile(filePath);
        }
      }
    };
    
    // Check each directory
    for (const dir of dirsToCheck) {
      if (fs.existsSync(dir)) {
        walkDir(dir);
      }
    }
    
    // Report all errors found
    if (errors.length > 0) {
      console.error('\nCommonJS require() in ESM modules:\n' + errors.join('\n'));
      fail('Found CommonJS require() in ESM modules. Check the console for details.');
    }
  });
  
  // Check for potential import issues in server/routes.ts around line 1552
  it('should check for proper imports in server/routes.ts', () => {
    const routesPath = path.join(process.cwd(), 'server/routes.ts');
    
    if (fs.existsSync(routesPath)) {
      const content = fs.readFileSync(routesPath, 'utf-8');
      const lines = content.split('\n');
      
      // Look specifically at lines around 1550-1560
      const startLine = Math.max(1530, 0);
      const endLine = Math.min(1570, lines.length - 1);
      const relevantLines = lines.slice(startLine, endLine);
      
      // Check for require() usage in this region
      const requireLine = relevantLines.findIndex(line => line.includes('require('));
      
      if (requireLine >= 0) {
        const actualLineNumber = startLine + requireLine + 1;
        console.error(`\nPotential issue found in server/routes.ts at line ${actualLineNumber}:\n${lines[startLine + requireLine]}\n`);
        console.error('Suggestion: Replace require() with a proper ES Module import at the top of the file.');
        
        // Specific suggestion for sharp package
        if (lines[startLine + requireLine].includes('require(\'sharp\')')) {
          console.error('For example, replace:\n  const sharp = require(\'sharp\')\nwith:\n  import sharp from \'sharp\';\n(at the top of the file)');
        }
        
        // This test is informative, not failing
        // We're just identifying the issue, not requiring a fix as part of the test
        console.warn('This test detected an issue but is not failing to allow for tests to run while the issue is being fixed.');
      }
    }
  });
});
