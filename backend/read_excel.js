const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, '../template_pecas.xlsx'));
console.log('Pecas:');
console.log(XLSX.utils.sheet_to_json(wb.Sheets['Pecas']).slice(0, 5));

console.log('\nOlimpos:');
console.log(XLSX.utils.sheet_to_json(wb.Sheets['Olimpos']).slice(0, 10));
