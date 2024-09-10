import type { HttpContext } from '@adonisjs/core/http'
import Code from '../models/code.js';
import { v4 } from 'uuid';
import Animal from '../models/animal.js';
import User from '../models/user.js';
import Scane from '../models/scane.js';
import Geo from "geoip-lite";
import Phone from '../models/phone.js';
import Address from '../models/address.js';
import db from '@adonisjs/lucid/services/db';
import { limitation } from './Tools/Utils.js';
import UserNotifContextsController from './user_notif_contexts_controller.js';
import env from '../../start/env.js';
import transmit from '@adonisjs/transmit/services/main';

export default class ScanesController {
    async scane_code({ request, response }: HttpContext) {
        const code_url = request.param('id');
        const { json } = request.qs()
        const code = await Code.findBy('code_url', code_url);

        if (code) {
            const scane_id = v4();

            let animal: Animal | null = null;
            try {
                animal = await Animal.find(code.animal_id);
            } catch (error) { }

            let owner: User | null = null;
            try {
                owner = await User.find(code.user_id);
            } catch (error) { }

            if (!animal || !owner) return {
                animal: animal && Animal.ParseAnimal(animal),
                owner: owner && User.ParseUser(owner),
            }

            const ip = request.ip()
            console.log('IP => ', ip);

            var geo = Geo.lookup(ip);

            console.log({ geo });

            const scane = await Scane.create({
                id: scane_id,
                code_url,
            });

            const phone = await Phone.findBy('context', owner.id);
            const address = await Address.findBy('context', owner.id);

            UserNotifContextsController._push_notification({
                context_id: code.id,
                user_id: code.user_id,
                title: animal.name.toUpperCase() + ' was found, See more..',
                content: `${animal.name}'s QR code has just been scanned.`,
            })
            transmit.broadcast(owner.id, { event: 'scane' })
            const res = {
                animal: Animal.ParseAnimal(animal),
                owner: { ...User.ParseUser(owner), address: address?.$attributes, phone: phone?.$attributes },
                scane: {
                    ...scane.$attributes,
                    id: scane_id
                }
            }

            if (json) {
                return res;
            } else {
                return response.redirect().toPath(`${env.get('CALL_BACK_URL')}/#scane_info=${JSON.stringify(res)}`);
            }

            /* 
            
            {
                animal: Animal.ParseAnimal(animal),
                owner: User.ParseUser(owner),
                scane: {
                    ...scane.$attributes,
                    id: scane_id
                }
            }
            
            */
            // le code existe

            // on te montre les information sur le chien et le proprio..
            /* 
            on te demande:

            const x = document.getElementById("demo");

            function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(showPosition);
            } else { 
                x.innerHTML = "Geolocation is not supported by this browser.";
            }
            }

            function showPosition(position) {
            x.innerHTML = "Latitude: " + position.coords.latitude + 
            "<br>Longitude: " + position.coords.longitude;
            }

            https://maps.google.com/?q=<lat>,<lng>


                - ( localisation ? user location :'') + ip location
                - d'aider a retrouver le chien
                - laisser un message

                on enregistre dans ton localstorage un json
                    {
                        code:'rtyu',
                        chien info + owner info
                        location + date
                    }
            */
        } else {
            // le code n'existe pas

            return {
                creatable: code_url,
            }
            /* 
                - on te dirige ver la page d'ajout de code
                    localhost => creatable code 
                - si tu n'est pas auth
                    on te demand de te connexter ou t'inscrire
                - si tu es authentifie et creatable code
                on te demand les de choisir un animal 
                ou d'en cree; localhost => newAnimalFor creatable

                - si newAnimalFor creatable
                    retour su choir un animal :  newAnimalFor creatable  [x]
                - si code cree  creatable code [x]
            */

        }
    }

    async update_scane({ request }: HttpContext) {

        const { scane_id, address/* , phone */, is_real_address, opened, message /* , name */ } = request.body();

        console.log('request.body()', request.body());

        const scane = await Scane.find(scane_id);

        if (!scane) throw new Error("Scane Not Found");

        if (opened == 'true') {
            scane.opened = true;
        }
        if (message) {
            scane.message = message;
        }
        if (is_real_address) {
            scane.is_real_address = is_real_address == true || 'true' ? true : false;
        }


        // let scanePhone = await Phone.findBy('context', scane_id);
        // if (phone) {
        //     try {
        //         const data = JSON.parse(phone);

        //         if (scanePhone) {
        //             phone.country = data.name;
        //             phone.format = data.format;
        //             phone.dial_code = data.dialCode;
        //             phone.phone = data.phone;
        //             phone.country_code = data.countryCode
        //             phone.save();
        //         } else {
        //             const phone_id = v4()
        //             scanePhone = await Phone.create({
        //                 context: scane_id,
        //                 id: phone_id,
        //                 country: name,
        //                 format: data.format,
        //                 dial_code: data.dialCode,
        //                 phone: phone,
        //                 country_code: data.countryCode
        //             });
        //             scanePhone.id = phone_id
        //             scanePhone.$attributes.id = phone_id
        //         }
        //     } catch (error) { }
        // }

        let scaneAddress = await Address.findBy('context', scane.id);

        console.log({ scaneAddress });


        if (address) {
            const data = JSON.parse(address);
            if (scaneAddress) {
                for (const a of ['latitude', 'longitude', 'address'] as const) {
                    if (data[a]) {
                        scaneAddress[a] = data[a];
                        scaneAddress.$attributes[a] = data[a];
                    }
                }
                scaneAddress.save();
            } else {
                const address_id = v4();
                try {
                    scaneAddress = await Address.create({
                        id: address_id,
                        context: scane.id,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        address: data.address
                    })
                    scaneAddress.id = address_id;
                    scaneAddress.$attributes.id = address_id;
                } catch (error) { }
            }
        }

        await scane.save()
        const code = await Code.findBy('code_url', scane.code_url);
        if (code) {
            console.log('update_scane');

            transmit.broadcast(code.user_id, { event: 'update_scane' })
        }
        console.log({ s: scane.$attributes });

        return {
            ...scane.$attributes,
            // phone:scanePhone?.$attributes
            address: scaneAddress?.$attributes
        }
    }

    async get_scanes({ request, auth }: HttpContext) {
        const { page, limit, order_by, user_id, scane_id, code_url, code_id, animal_id } = request.qs();
        
        let query = db.query()
            .from(Scane.table)
            .select('*')
            .select('scanes.id as id')
            .leftJoin('codes', 'codes.code_url', 'scanes.code_url');
        if (!scane_id && !user_id) {
            const user =await auth.authenticate()
            query = query.where('user_id', user.id)
        }
        if (user_id) {
            query = query.where('user_id', user_id)
        }
        if (scane_id) {
            query = query.where('scanes.id', scane_id)
        }
        if (code_url) {
            query = query.where('codes.code_url', code_url)
        }
        if (code_id) {
            query = query.where('codes.id', code_id)
        }
        if (animal_id) {
            query = query.where('animal_id', animal_id)
        }

        const l = await limitation(query, page || 1, limit || 200, order_by || 'updated_at_desc');

        const scanes = (await l.query).map(u => User.ParseUser(u));

        const animals: any = {}
        const promises = scanes.map(s => new Promise(async (rev) => {
            const address = await Address.findBy('context', s.id);
            s.address = address?.$attributes;
            if (animals[s.animal_id]) {
                s.animal = animals[s.animal_id];
            } else if (animals[s.animal_id] !== null) {
                const animal = await Animal.find(s.animal_id);
                s.animal = animal && Animal.ParseAnimal(animal.$attributes)
                animals[s.animal_id] = s.animal;
            }
            rev(null);
        }));

        await Promise.allSettled(promises);
        
        return {
            ...(l.paging),
            list: scanes//.filter(s => !!s.address)
        }
    }
}