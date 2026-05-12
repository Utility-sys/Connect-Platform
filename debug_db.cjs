const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'connect-backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- USERS ---');
db.all("SELECT id, firstName, lastName, email, role FROM Users", [], (err, rows) => {
  if (err) throw err;
  console.table(rows);

  console.log('\n--- VENUES ---');
  db.all("SELECT id, name, ownerId FROM Venues", [], (err, rows) => {
    if (err) throw err;
    console.table(rows);
    db.close();
  });
});
