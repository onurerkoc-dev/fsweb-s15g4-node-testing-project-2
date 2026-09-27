const configurations = require('./knexfile')
const environment = process.env.NODE_ENV || 'development'

if (!configurations[environment]) {
  throw new Error(`Unsupported NODE_ENV: ${environment}`)
}

module.exports = require('knex')(configurations[environment])
