import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_notif_contexts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id')
      table.string('context_name')
      table.string('context_id')
     })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}