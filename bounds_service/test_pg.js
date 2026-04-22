const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://user:password@127.0.0.1:5432/neighbourly_uk' });
console.log('Connecting to postgres...');
client.connect()
  .then(() => {
    console.log('Connected!');
    return client.query('SELECT 1');
  })
  .then(res => {
    console.log('Query result:', res.rows);
    client.end();
  })
  .catch(err => {
    console.error('Error:', err);
    client.end();
  });
