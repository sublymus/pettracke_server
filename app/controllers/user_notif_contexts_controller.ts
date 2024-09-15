import User from '#models/user';
import UserBrowser from '#models/user_browser';
import UserNotifContext from '#models/user_notif_context';
import type { HttpContext } from '@adonisjs/core/http'
import webpush from "web-push";
export default class UserNotifContextsController {
  async add_notif_context({ request, auth }: HttpContext) {
    const { context_name, context_id } = request.body();
    const user = await auth.authenticate();
    return await UserNotifContextsController._add_notif_context({
      context_id, context_name, user
    });
  }
  public static async _add_notif_context({ context_id, context_name, user }: { context_name: string, context_id: string, user: User }) {
    let user_context = (await UserNotifContext.query().where('user_id', user.id).where('context_name', context_name).where('context_id', context_id).limit(1))[0];

    if (!user_context) {
      user_context = await UserNotifContext.create({
        context_id,
        context_name,
        user_id: user.id,
      })
    }
    return user_context
  }
  async get_notif_contexts({ request, auth }: HttpContext) {
    const { context_id, context_name } = request.qs()
    const user = await auth.authenticate();
    const a = await this._get_notif_contexts({
      context_id,
      context_name,
      user_id: user.id
    })
    return a.map(c => c.$attributes)
  }
  async _get_notif_contexts({ context_id, context_name, user_id }: { context_id?: string, context_name?: string, user_id?: string }) {
    let query = UserNotifContext.query();
    if (user_id) query = query.andWhere('user_id', user_id)
    if (context_name) query = query.andWhere('context_name', context_name)
    if (context_id) query = query.andWhere('context_id', context_id)

    return await query;
  }

  async remove_notif_context({ request, auth }: HttpContext) {
    const context_id = request.param('id');
    const user = await auth.authenticate();
    return await this._remove_notif_context({ context_id, user_id: user.id })
  }
  async _remove_notif_context({ context_id, user_id }: { context_id: string, user_id: string }) {
    const c = (await this._get_notif_contexts({ context_id, user_id }))[0]
    if (!c) throw new Error("UserNotifContext Not Found");
    await c.delete();
    return {
      deleted: false
    }
  }

  static async _push_notification({ user_id, context_id, title, content }: { context_id: string, user_id: string, title: string, content: string }) {
    
    try {
      let user_contexts = await UserNotifContext.query().where('context_id', context_id)//.where('context_name', context_name);
      const payload = JSON.stringify({ title, content });
      
      for (const c of user_contexts) {
        let browsers = await UserBrowser.query().where('user_id', c.user_id);
        console.log(JSON.stringify(browsers,undefined,4))
      
        for (const b of browsers) {
          try {
            if (b.notification_data) {
              const data = JSON.parse(b.notification_data)

              console.log({data});
              
              webpush.sendNotification(data as any, payload).catch(async (error) => {
                console.log(error);
                
                // console.log('==>', b.$attributes);
                // b.notification_data = null;
                // await b.save()
              });
            }
          } catch (error) {
            console.log(error);
          }
        }
        if (c.user_id != user_id) {
          
        }
      }

    } catch (error) { }
  }
}