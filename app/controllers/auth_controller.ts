import type { HttpContext } from '@adonisjs/core/http'
import User, { USER_STATUS } from "#models/user";
import { v4 } from "uuid";
import { updateFiles } from './Tools/FileManager/UpdateFiles.js';
import db from '@adonisjs/lucid/services/db';
import { limitation, paginate } from './Tools/Utils.js';
import Phone from '../models/phone.js';
import Address from '../models/address.js';
import { setBrowser } from './user_browsers_controller.js';
import hash from '@adonisjs/core/services/hash'

export default class AuthController {

    public static async _create_user({ email, avatarUrl = '/src/res/user-fill.png', password, full_name, mode }: { full_name: string, password: string, avatarUrl?: string, email: string, mode: 'login' | 'signup' | 'dual' }) {
        let user = await User.findBy("email", email);
        let token: string | undefined;
        console.log(email, password, mode);

        if (user) {
            if (mode == 'signup') {
                throw new Error("Email Not Avalaible");
            }
            if (user.status == USER_STATUS.NEW) {
                user.password = password;
                user.photos = JSON.stringify([avatarUrl]);
                user.full_name = full_name;
                user.status = USER_STATUS.VISIBLE
                await user.save();
                return User.ParseUser(user);
            }

            const valid = await hash.verify(user.password, password)
            if (!valid) throw new Error("Unauthorized access..");

            token = (await User.accessTokens.create(user)).value?.release();
            return {
                token,
                ...User.ParseUser(user)
            }
            // response
            //     .redirect()
            //     .toPath(`${env.get('FRONT_ORIGINE')}/auth#=${JSON.stringify()
            //         }`);
        } else {

            if (mode == 'login') {
                throw new Error("Account Do Not Exist");
            }
            const user_id = v4();
            user = await User.create({
                id: user_id,
                email,
                full_name: full_name,
                password: password,
                status: USER_STATUS.VISIBLE,
                photos: JSON.stringify([avatarUrl]),
            })

            user.id = user_id;
            user.$attributes.id = user_id;
            //await _create_client( {name, email, password}, auth )
            token = (await User.accessTokens.create(user)).value?.release();
            return {
                token,
                ...User.ParseUser(user),
                photos: JSON.parse(user.photos || '[]'),
            }
            // response.redirect().toPath(`${env.get('FRONT_ORIGINE')}/auth#=${JSON.stringify()
            //     }`);
        }

    }


    public async google_connexion({ ally }: HttpContext) {
        return ally.use("google").redirect();
    }

    public async delete_user_account({ request, auth }: HttpContext) {

        const { user_id } = request.qs()
        const user = await auth.authenticate();
        AuthController._golbal_disconnection(user, user_id)

        if (user_id /*&& admin / moderator*/) {
            const tagetUser = await User.find(user_id);
            if (!tagetUser) return 'user not found';
            await tagetUser.delete();
            return {
                isDeleted: tagetUser.$isDeleted
            }
        } else {
            await user.delete();
            return {
                isDeleted: user.$isDeleted
            }
        }

    }
    public async disconnection({ auth }: HttpContext) {
        const user = await auth.authenticate();
        await User.accessTokens.delete(user, user.currentAccessToken.identifier);
        return {
            disconnection: true
        };
    }
    public async global_disconnection({ request, auth }: HttpContext) {

        const { user_id } = request.qs()
        const user = await auth.authenticate();
        return AuthController._golbal_disconnection(user, user_id)

    }

    public static async _golbal_disconnection(user: User, user_id?: string) {
        if (user_id /*&& admin / moderator*/) {
            const tagetUser = await User.find(user_id);
            if (!tagetUser) return 'user not found';
            const tokens = await User.accessTokens.all(tagetUser);
            for (const token of tokens) {
                await User.accessTokens.delete(tagetUser, token.identifier);
            }
        } else {
            const tokens = await User.accessTokens.all(user);
            for (const token of tokens) {
                await User.accessTokens.delete(user, token.identifier);
            }
        }
        return {
            disconnection: true,
        }
    }

    public async google_push_info({ ally, response }: HttpContext) {
        const provider = ally.use('google');
        console.log({ google: 'google_push_info' });

        if (provider.accessDenied()) {
            throw new Error("google access was denied");
        }

        if (provider.stateMisMatch()) {
            throw new Error("google request expired. Retry again");
        }
        if (provider.hasError()) {
            throw new Error(provider.getError() || 'provider.hasError()');
        }
        const { id, email, avatarUrl, name } = await provider.user();

        if (!email) {
            throw new Error("google request user email");
        }

        let data:any = AuthController._create_user({
            email,
            password: id,
            full_name: name,
            mode: 'dual',
            avatarUrl
        });

        response.send(`
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        
        <body>
        
            <script type="module">
                const user = ${JSON.stringify(data)}
                window.addEventListener('DOMContentLoaded', () => {
                    try{
                    const u =  JSON.stringify(user);
                    localStorage.setItem('user',u)
                    localStorage.setItem('token',${JSON.stringify(data.token)})
                    }catch(error){ console.log(error)}
                    window.close();
                })
            </script>
        
        </body>
        
        </html>
        `)
    }

    public async create_user({ request }: HttpContext) {
        const { mode = 'signup', email = '' as string, password } = request.body();

        return AuthController._create_user({
            email,
            full_name: email.substring(0, email.indexOf('@')),
            password,
            mode
        })
    }

    async me({ request, auth }: HttpContext) {
        const user = await auth.authenticate()
        // setBrowser(user, request) 
        let address = await Address.findBy('context', user.id);
        let phone = await Phone.findBy('context', user.id);
        setBrowser(user, request)
        return {
            ...User.ParseUser(user),
            phone: phone?.$attributes,
            address: address?.$attributes,
            // token:  request.headers().authorization?.split(' ')[1]
        };
    }

    async edit_me({ request, auth }: HttpContext) {
        const body = request.body();

        let urls: Record<string, string[]> = {};

        const user = await auth.authenticate();

        (['full_name'] as const).forEach((attribute) => {
            if (body[attribute]) user[attribute] = body[attribute];
        });

        let phone = await Phone.findBy('context', user.id);

        console.log({ body });


        if (body.phone) {

            const data = JSON.parse(body.phone);
            if (phone) {
                try {
                    phone.country = data.name;
                    phone.format = data.format;
                    phone.dial_code = data.dialCode;
                    phone.phone = data.phone;
                    phone.country_code = data.countryCode
                    phone.save();
                } catch (error) { }
            } else {
                const phone_id = v4()
                phone = await Phone.create({
                    context: user.id,
                    id: phone_id,
                    country: data.name,
                    format: data.format,
                    dial_code: data.dialCode,
                    phone: data.phone,
                    country_code: data.countryCode
                });
                phone.id = phone_id
                phone.$attributes.id = phone_id
            }
        }

        let address = await Address.findBy('context', user.id);

        if (body.address) {
            const data = JSON.parse(body.address);
            if (address) {
                for (const a of ['latitude', 'longitude', 'address'] as const) {
                    address[a] = data[a];
                    address.$attributes[a] = data[a];
                }
                address.save();
            } else {
                const address_id = v4();
                try {
                    address = await Address.create({
                        id: address_id,
                        context: user.id,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        address: data.address
                    })
                    address.id = address_id;
                    address.$attributes.id = address_id;
                } catch (error) { }
            }
        }

        for (const f of (['photos'] as const)) {
            if (body[f]) {
                urls[f] = await updateFiles({
                    request,
                    table_name: "users",
                    table_id: user.id,
                    column_name: f,
                    lastUrls: user[f] || '[]',
                    newPseudoUrls: body[f],
                    options: {
                        throwError: true,
                        min: 1,
                        max: 7,
                        compress: 'img',
                        extname: ['jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'avif', 'apng', 'gif', "jpg", "png", "jpeg", "webp"],
                        maxSize: 12 * 1024 * 1024,
                    },
                });
                user[f] = JSON.stringify(urls[f]);
            }
        }

        await user.save();

        return {
            ...User.ParseUser(user.$attributes),
            phone,
            address,
            ...urls
        }
    }
    async get_users({ request }: HttpContext) {
        const { page, limit, full_name, email, phone, user_id, order_by, text } = paginate(request.qs() as { page: number | undefined, limit: number | undefined } & { [k: string]: any });

        let query = db.query().from(User.table)
            .select('*')
        if (user_id) {
            query = query.whereLike('id', `%${user_id}%`);
        } else {
            if (text) {
                if ((text).startsWith('#')) {
                    query = query.whereLike('users.id', `%${text.replaceAll('#', '')}%`);
                } else {
                    query = query.andWhere((q) => {
                        const v = `%${text.split('').join('%')}%`;
                        q.whereLike('email', v).orWhereLike('full_name', v)
                    });
                }
            } else {
                if (email) {
                    query = query.andWhereLike('email', `%${email.split('').join('%')}%`);
                }
                if (phone) {
                    query = query.andWhereLike('phone', `%${phone.split('').join('%')}%`);
                }
                if (full_name) {
                    query = query.andWhereLike('full_name', `%${full_name.split('').join('%')}%`);
                }
            }
        }

        const l = await limitation(query, page, limit, order_by);
        const users = (await l.query).map(u => User.ParseUser(u));

        const promises = users.map(u => new Promise(async (rev) => {
            const phone = await Phone.findBy('context', u.id);
            u.phone = phone?.$attributes
            let address = await Address.findBy('context', u.id);
            u.address = address?.$attributes
            rev(null);
        }))
        await Promise.allSettled(promises);
        return {
            ...(l.paging),
            list: users
        }
    }
}

