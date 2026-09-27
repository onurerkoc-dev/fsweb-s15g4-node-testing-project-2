exports.seed = async (knex) => {
  await knex('tasks').del()
  await knex('tasks').insert([
    { title: 'Test REST API', description: 'Write endpoint tests with Supertest', completed: false },
    { title: 'Review migrations', description: 'Check the development and testing database setup', completed: true },
  ])
}
