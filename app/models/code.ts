import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Code extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code_url: string

  @column()
  declare user_id: string

  @column()
  declare animal_id: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}