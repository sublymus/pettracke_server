import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeSave, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { v4 } from 'uuid'

export enum USER_TYPE {
  CLIENT = 'CLIENT',
  COLLABORATOR = 'COLLABORATOR',
  OWNER = 'OWNER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}
export enum USER_STATUS {
  NEW = 'NEW',
  VISIBLE = 'VISIBLE'
}

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare full_name: string | null

  @column()
  declare email: string

  @column()
  declare photos: string

  @column()
  declare status: string

  @column()
  declare phone: string // json string[]

  @column()
  declare address: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime | null

  // static accessTokens = DbAccessTokensProvider.forModel(User)


  @beforeSave()
  public static async setUUID (user: User) {
   if(!user.id)user.id = v4()
  }

  public static ParseUser(user: User['$attributes']) {
    let photos = [];
    try {
      photos = JSON.parse(user.photos || '[]')
    } catch (error) { console.error(error);
     }
    return {
      ...(user.$attributes||user),
      photos,
      password: undefined,
    } as any as User['$attributes']
  }
  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })
}

