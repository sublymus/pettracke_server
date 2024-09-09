import type { HttpContext } from '@adonisjs/core/http'
import Code from '../models/code.js';
import Animal from '../models/animal.js';
import { v4 } from 'uuid';
import db from '@adonisjs/lucid/services/db';
import { limitation } from './Tools/Utils.js';
// import Scane from '../models/scane.js';
// import Geo from "geoip-lite";
import User from '../models/user.js';
import env from '../../start/env.js';
export default class CodesController {
    async update_code({ request, auth }: HttpContext) {
        const { code_id, animal_id } = request.body();

        const user = await auth.authenticate();

        const code = await Code.find(code_id);

        if (!code) throw new Error("Code Not Founnd");

        if (code.user_id != user.id) throw new Error("Permission Required");
        if (!animal_id) throw new Error("animal_id is required");

        const animal = await Animal.find(animal_id);
        if (!animal) throw new Error("Animal Not Found");
        if (animal.user_id != user.id) throw new Error("Permission Required");

        code.animal_id = animal_id
        await code.save()

        return User.ParseUser(Animal.ParseAnimal({ ...user.$attributes,...animal.$attributes,...code.$attributes}))
    }
    async create_code({ request, auth }: HttpContext) {
        const { animal_id, code_url } = request.body()

        const user = await auth.authenticate();

        const animal = await Animal.find(animal_id);
        if(!code_url) throw new Error("Code_url is Require");
        
        if (!animal) throw new Error("Animal Not Found");
        if (animal.user_id != user.id) throw new Error("Permission Required");

        const code_id = v4();

        const code = await Code.create({
            id: code_id,
            animal_id,
            user_id: user.id,
            code_url: code_url,//`${env.get('CALL_BACK_URL')}/s_c/${code_url}`
        });
        
        code.id = code_id
        code.$attributes.id = code_id
        return User.ParseUser(Animal.ParseAnimal({...user.$attributes,...animal.$attributes,...code.$attributes}))
    }

    async get_codes({ request, auth }: HttpContext) {
        const { page, limit, order_by,
            user_id,
            code_url,
            code_id,
            animal_id,
        } = request.qs()
        let query = db.query().from(Code.table)
            .select('*')
            .select('codes.id as id')
            .select('codes.created_at as created_at')
            .leftJoin('animals','animals.id','animal_id')
            .leftJoin('users','users.id','codes.user_id')
        if (animal_id) {
            query = query.where('animal_id', animal_id);
        }
        if (code_url) {
            query = query.where('code_url', `%${code_url}%`);
        }
        if(code_id){
            query = query.where('codes.id', code_id);
        }
        if (user_id) {
            const user =await auth.authenticate();
            if (user?.email != 'sublymus@gmail.com') throw new Error("Admin Permission Required");
            query = query.where('codes.user_id', user_id);
        }else{
            let user = await auth.authenticate();
            query = query.where('codes.user_id', user.id);
        }

        const a = await limitation(query, page || 1, limit || 25, order_by);
        return {
            ...a.paging,
            list: (await query).map(c=>User.ParseUser(Animal.ParseAnimal(c)))
        }
    }

    async delete_code({ request, auth }: HttpContext) {
        const user = await auth.authenticate();
        const code_id = request.param('id');
        const code = await Code.find(code_id);
        if (!code) throw new Error("Code not found");
        if (code.user_id != user.id) throw new Error("PREMISSION REQUIRED");
        await code.delete()
        // await db.rawQuery('delete from `features` where `id` = :id;', { id: feature_id });
        return {
            isDeleted: code.$isDeleted,
        }
    }

   
}