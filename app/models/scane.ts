import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Scane extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare code_url: string

  @column()
  declare address: string

  @column()
  declare name: string

  @column()
  declare opened : boolean
  
  @column()
  declare is_real_address: boolean

  @column()
  declare message: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  public static ParseScane(a: Scane['$attributes']) {
    let address = undefined;
    try {
      address =a.address  && JSON.parse(a.address )
    } catch (error) { console.error(error);
     }
    return {
      ...(a.$attributes||a),
      address
    } as any as Scane['$attributes']
  }
}


