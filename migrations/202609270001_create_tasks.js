exports.up = async (knex) => {
  await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary()
    table.string('title', 200).notNullable()
    table.text('description').nullable()
    table.boolean('completed').notNullable().defaultTo(false)
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('tasks')
}
