import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Animal extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare user_id : string

  @column()
  declare name : string

  @column()
  declare sex : string

  @column()
  declare color : string

  @column()
  declare age : string

  @column()
  declare species : string

  @column()
  declare breed : string

  @column()
  declare images : string

  @column()
  declare about : string

  @column()
  declare allergies : string

  @column()
  declare medication : string

  @column()
  declare vaccines : string

  @column()
  declare veto_name : string

  @column()
  declare veto_phone : string

  @column()
  declare veto_clinic : string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime


  public static ParseAnimal(a: Animal['$attributes']) {
    let images = [];
    try {
      images = JSON.parse(a.images || '[]')
    } catch (error) { console.error(error);
     }
    return {
      ...(a.$attributes||a),
      images
    } as any as Animal['$attributes']
  }
}