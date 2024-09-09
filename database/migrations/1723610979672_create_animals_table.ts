import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'animals'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()

      table.string('name').notNullable()
      table.uuid('user_id').notNullable()
      table.string('sex')
      table.string('color')
      table.string('age')
      table.string('species')
      table.string('breed')
      table.string('images')
      table.string('about')
      table.string('allergies')
      table.string('conditions')
      table.string('medication')
      table.string('vaccines')

      table.string('veto_name')
      table.string('veto_phone')
      table.string('veto_address')
      table.string('veto_clinic')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}