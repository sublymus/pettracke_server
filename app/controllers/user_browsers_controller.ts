import type { HttpContext } from '@adonisjs/core/http'
import User from "#models/user";
import UserBrowser from "#models/user_browser";
import { AccessToken } from "@adonisjs/auth/access_tokens";

export async function setBrowser(user: User & {
  currentAccessToken: AccessToken;
}, request: HttpContext['request']) {


  const user_browser = (await UserBrowser.query().where('user_id', user.id).where('user_agent', request.headers()['user-agent'] || '').limit(1))[0];
  const token = request.headers().authorization?.split(' ')[1] || '';
  if (user_browser) {
    user_browser.token = token;
    await user_browser.save()
  } else {
    await UserBrowser.create({
      enable: true,
      notification_data: undefined,
      token,
      user_id: user.id,
      user_agent: request.headers()['user-agent']
    })
  }
  return user_browser
}
export default class UserBrowsersController {


  async disable_notifications({ request, auth }: HttpContext) {
    const { user_browser_id, target } = request.body()
    const user = await auth.authenticate();
    let query = UserBrowser.query().where('user_id', user.id)
    if (user_browser_id) {
      query = query.where('id', user_browser_id);
    }
    else if (target == 'current') {
      query = query.where('user_agent', request.headers()['user-agent'] || '');
    }else if (target == 'all'){
      // nothing to do
    }
    let list = await query;
    for (const b of list) {
      b.enable = null
      await b.save();
    }
    return list.map(l => UserBrowser.parseUserBrowser(l));
  }

  async enable_notifications({ request, auth }: HttpContext) {
    const { user_browser_id, target } = request.body()
    const user = await auth.authenticate();
    let query = UserBrowser.query().where('user_id', user.id)
    if (user_browser_id) {
      query = query.where('id', user_browser_id);
    }
    else if (target == 'current') {
      query = query.where('user_agent', request.headers()['user-agent'] || '');
    }else if (target == 'all'){
      // nothing to do
    }
    let list = await query;
    for (const b of list) {
      b.enable = true
      await b.save();
    }
    return list.map(l => UserBrowser.parseUserBrowser(l));
  }
  async set_notification_data({ request, auth }: HttpContext) {
    const { notification_data } = request.body();
    const user = await auth.authenticate();
    
    const user_browser = await setBrowser(user, request);
    if(!user_browser) return;
    user_browser.token = request.headers().authorization?.split(' ')[1] || '';
    user_browser.notification_data = notification_data
    await user_browser.save();
  }
  async get_user_browsers({ request, auth }: HttpContext) {
    const { user_id, user_agent, user_browser_id, enable } = request.qs()
    const user = await auth.authenticate();
    let query = UserBrowser.query()

    if (user_agent) query = query.where('user_agent', user_agent);
    if (user_browser_id) query = query.where('id', user_browser_id);
    if (enable == false || enable == 'false') query = query.whereNull('enable');
    if (enable == true || enable == 'true') query = query.whereNotNull('enable');
    if (user_id) {
      if (user.email == 'sublymus@gmail.com') { //TODO => admin
        query.where('user_id', user_id)
      } else {
        throw new Error("Permission Required");
      }
    } else {
      query.where('user_id', user.id)
    }
    const list = await query;
    return list.map(l => UserBrowser.parseUserBrowser(l));
  }
  async remove_user_browser({ request }: HttpContext) {
    const user_browser_id = request.param('id');
    const user_browser = await UserBrowser.find(user_browser_id);
    if (!user_browser) throw new Error("user_browser not  found");

    await user_browser.delete()

    return {
      deleted: user_browser.$isDeleted
    }

  }
}
/* 

{
  endpoint: 'https://fcm.googleapis.com/fcm/send/eaQn-y4vk08:APA91bEF1XkQ2B2LqrW-CJp3alSuuIvrXSmfKHkatwlbSmehTA7l03ZZ3zLO99kUsCj2RcLEEe1oAN1jfhKx3FB8ZhO8ibaH2bBCTCEqr6IgbBmKS83Oq5Gr7gcyYeh1iVBh2_3hHEUU',
  expirationTime: null,
  keys: {
    p256dh: 'BJIW4IZtFDarIO4JmJ-7-OQkGuyofrEn60gc7_ErqNW2s9H7hvJhu8ozFSu7k4kVjixm3BJM1K5qTmZAOjBuZxQ',
    auth: 'rf5P_GfnD3jfTD_51s66dg'
  }
} {
  qs: {
    context_name: 'subjects',
    context_id: 'cde8bd12-d0b0-489f-ad94-fa65cdd55283'
  }
}

*/