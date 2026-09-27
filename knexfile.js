const path = require('node:path')

const migrations = { directory: path.join(__dirname, 'migrations') }
const seeds = { directory: path.join(__dirname, 'seeds') }

module.exports = {
  development: {
    client: 'sqlite3',
    connection: { filename: path.join(__dirname, 'data', 'development.sqlite3') },
    useNullAsDefault: true,
    migrations,
    seeds,
  },
  testing: {
    client: 'sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true,
    pool: { min: 1, max: 1 },
    migrations,
    seeds,
  },
}
