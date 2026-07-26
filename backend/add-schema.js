const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Find all `model XYZ { ... }` blocks
const regex = /model\s+\w+\s+\{([\s\S]*?)\}/g;
content = content.replace(regex, (match, body) => {
  if (!body.includes('@@schema("public")')) {
    // Add @@schema before the closing brace
    return match.replace(/}$/, '  @@schema("public")\n}');
  }
  return match;
});

// Enums as well
const enumRegex = /enum\s+\w+\s+\{([\s\S]*?)\}/g;
content = content.replace(enumRegex, (match, body) => {
  if (!body.includes('@@schema("public")')) {
    return match.replace(/}$/, '  @@schema("public")\n}');
  }
  return match;
});

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Added @@schema("public") to all models and enums');
