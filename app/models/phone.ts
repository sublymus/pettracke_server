import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Phone extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare context: string

  @column()
  declare country_code: string

  @column()
  declare dial_code: string

  @column()
  declare format: string

  @column()
  declare country: string

  @column()
  declare phone: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}