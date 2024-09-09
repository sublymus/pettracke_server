import { BaseModel, beforeSave, column } from '@adonisjs/lucid/orm'
import { v4 } from 'uuid'

export default class UserNotifContext extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare user_id:string

  @column()
  declare context_name:string

  @column()
  declare context_id:string

  @beforeSave()
  public static async setUUID(u: UserNotifContext) {
    if (!u.id) u.id = v4()
  }
  
 }