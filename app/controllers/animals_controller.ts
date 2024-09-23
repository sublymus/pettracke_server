import type { HttpContext } from '@adonisjs/core/http'
import { updateFiles } from './Tools/FileManager/UpdateFiles.js';
import Animal from '../models/animal.js';
import { v4 } from 'uuid';
import { createFiles } from './Tools/FileManager/CreateFiles.js';
import { deleteFiles } from './Tools/FileManager/DeleteFiles.js';
import db from '@adonisjs/lucid/services/db';
import { limitation } from './Tools/Utils.js';
import Code from '../models/code.js';
import Scane from '../models/scane.js';

export default class AnimalsController {
    async update_animal({ request, auth }: HttpContext) {

        const body = request.body();

        const user = await auth.authenticate();

        const animal = await Animal.find(body.animal_id);

        if (!animal) throw new Error("Animal Not Founnd");

        if (animal.user_id != user.id) throw new Error("Permission Required");

        ['about',
            'medication',
            'vaccines',
            'species',
            'breed',
            'allergies',
            'color',
            'sex',
            'age',
            'name',
            'veto_name',
            'veto_phone',
            'veto_clinic'
        ].forEach(k => {
            if (body[k]) (animal as any)[k] = body[k];
        })

        for (const a of ['images'] as const) {
            if (!body[a]) continue;
            try {
                console.log('***=>', animal[a], body[a]);

                const images = await updateFiles({
                    request,
                    table_name: Animal.table,
                    table_id: animal.id,
                    column_name: a,
                    lastUrls: animal[a] || '[]',
                    newPseudoUrls: body[a],
                    options: {
                        throwError: true,
                        min: 0,
                        max: 1,
                        compress: 'img',
                        extname: ['jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'avif', 'apng', 'gif', "jpg", "png", "jpeg", "webp"],
                        maxSize: 12 * 1024 * 1024,
                    },
                });
                animal[a] = JSON.stringify(images);
            } catch (error) {
                console.log(error);

            }
        }
        await animal.save()

        return Animal.ParseAnimal(animal)
    }
    async create_animal({ request, auth }: HttpContext) {
        const { veto_name, veto_phone, veto_clinic, age, about, medication, vaccines, allergies, breed, species, conditions, color, sex, name } = request.body()




        const user = await auth.authenticate();

        const animal_id = v4();

        const anumal_images = await createFiles({
            request,
            column_name: "images",
            table_id: animal_id,
            table_name: Animal.table,
            options: {
                throwError: true,
                compress: 'img',
                min: 0,
                max: 1,
                extname: ['jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'avif', 'apng', 'gif', "jpg", "png", "jpeg", "webp"],
                maxSize: 12 * 1024 * 1024,
            },
        });

        const animal = await Animal.create({
            id: animal_id,
            images: JSON.stringify(anumal_images),
            about,
            medication,
            vaccines,
            allergies,
            breed,
            species,
            color,
            sex,
            name,
            user_id: user.id,
            age,
            veto_name,
            veto_phone,
            veto_clinic
        })
        animal.id = animal_id
        animal.$attributes.id = animal_id
        return Animal.ParseAnimal(animal)
    }


    async get_animals({ request, auth }: HttpContext) {
        const { page, limit, order_by,
            about,
            medication,
            vaccines,
            type,
            color,
            sex,
            name,
            animal_id,
            user_id,
            all
        } = request.qs()
        return AnimalsController._get_animals({
            page, limit, order_by,
            about,
            medication,
            vaccines,
            type,
            color,
            sex,
            name,
            animal_id,
            user_id,
            all
        }, auth)
    }
    public static async _get_animals({ page, limit, order_by,
        about,
        medication,
        vaccines,
        type,
        color,
        sex,
        name,
        animal_id,
        user_id,
        all
    }: {
        page?: number,
        limit?: number,
        order_by?: string,
        about?: string,
        medication?: string,
        vaccines?: string,
        type?: string,
        color?: string,
        sex?: string,
        name?: string,
        animal_id?: string,
        user_id?: string,
        all?: string,
    }, auth: HttpContext['auth']) {

        let query = db.query().from(Animal.table)
            .select('*')
        if (animal_id) {
            query = query.where('id', animal_id);
        }
        if (user_id) {
            // const user = await auth.authenticate();
            // if (user?.email != 'sublymus@gmail.com') throw new Error("Admin Permission Required");
            query = query.where('user_id', user_id);
        } else if (all) {
            // const user = await auth.authenticate();
            // if (user?.email != 'sublymus@gmail.com') throw new Error("Admin Permission Required");
        } else if (!animal_id) {
            let user = await auth.authenticate();
            query = query.where('user_id', user.id);
        }


        if (name) {
            query = query.where('product_id', `%${name}%`);
        }
        if (sex) {
            query = query.where('product_id', sex);
        }
        if (color) {
            query = query.where('product_id', `%${color}%`);
        }
        if (vaccines) {
            query = query.where('product_id', `%${vaccines}%`);
        }
        if (type) {
            query = query.where('product_id', `%${type}%`);
        }
        if (medication) {
            query = query.where('product_id', `%${medication}%`);
        }
        if (about) {
            query = query.where('product_id', `%${about}%`);
        }

        const a = await limitation(query, page || 1, limit || 25, order_by);
        const animals = (await query).map(v => Animal.ParseAnimal(v));
        return {
            ...a.paging,
            list: animals
        }
    }

    async delete_animal({ request, auth }: HttpContext) {
        const user = await auth.authenticate();
        const animal_id = request.param('id');
        const animal = await Animal.find(animal_id);
        if (!animal) throw new Error("Animal not found");
        if (animal.user_id != user.id) throw new Error("PREMISSION REQUIRED");

        const codes = await Code.findManyBy('animal_id', animal_id);
        await Promise.allSettled(codes.map(c=>new Promise(async(rev)=>{
            const scanes = await Scane.findManyBy('code_url', c.code_url);
            await Promise.allSettled(scanes.map(s=>new Promise(async(rev)=>{
                await s.delete();
                rev(null);
            })))    
            await c.delete();
            rev(null);
        })))

       
        await deleteFiles(animal_id);
        await animal.delete()
        // await db.rawQuery('delete from `features` where `id` = :id;', { id: feature_id });
        return {
            isDeleted: animal.$isDeleted,
        }
    }
}