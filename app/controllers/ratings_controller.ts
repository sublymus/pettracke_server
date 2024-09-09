import type { HttpContext } from '@adonisjs/core/http'
import Rating from '../models/rating.js';
import { v4 } from 'uuid';
import db from '@adonisjs/lucid/services/db';

export default class RatingsController {
    async add_rating({ auth, request }: HttpContext) {
        const { star, message, env } = request.body()
        const user = await auth.authenticate();
        if (!env) throw new Error("Env is missing");
        if (!star) throw new Error("Star is missing");

        let rating = await Rating.findBy('user_id', user.id);
        if (rating) {
            rating.env = env;
            rating.star = star;
            rating.message = message;
            
            await rating.save();
            
        } else {
            
            const id = v4();
            rating = await Rating.create({
                id,
                user_id: user.id,
                star,
                env,
                message,
            })
            rating.$attributes.id = id,
            rating.id = id;
        }
        return rating.$attributes
    }
    async get_ratings({ request }: HttpContext) {
        const { user_id, star, min_star, max_star, text, env } = request.qs();

        let query = db.query().from(Rating.table).select('*');

        if (user_id) {
            query = query.where('user_id', user_id);
        }
        if (star) {
            query = query.where('star', star);
        }
        if (min_star) {
            query = query.where('star', '>=', min_star);
        }
        if (max_star) {
            query = query.where('star', '<=', max_star);
        }
        if (env) {
            query = query.where('env', env);
        }
        if (text) {
            query = query.where('message', `%${text}`);
        }

        return (await query);
    }
}