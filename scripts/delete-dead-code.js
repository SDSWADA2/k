const fs = require('fs');
try {
  fs.unlinkSync('src/lib/db-storage.ts');
  console.log('db-storage.ts deleted');
} catch (e) {
  console.log(e.message);
}
try {
  fs.unlinkSync('src/lib/audit.ts');
  console.log('audit.ts deleted');
} catch (e) {
  console.log(e.message);
}
