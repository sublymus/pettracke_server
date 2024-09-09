import router from '@adonisjs/core/services/router'
import AuthController from '../app/controllers/auth_controller.js';
import AnimalsController from '../app/controllers/animals_controller.js';
import CodesController from '../app/controllers/codes_controller.js';
import env from './env.js';
import ScanesController from '../app/controllers/scanes_controller.js';
import UserBrowsersController from '../app/controllers/user_browsers_controller.js';
import UserNotifContextsController from '../app/controllers/user_notif_contexts_controller.js';
import webpush from "web-push";
import RatingsController from '../app/controllers/ratings_controller.js';

//Auth
router.get('/google_connexion', [AuthController, 'google_connexion']);
router.get('/gl_push_info', [AuthController, 'google_push_info']);
router.get('me', [AuthController, 'me']);
router.post('/create_user', [AuthController,'create_user']);
router.put('/edit_me', [AuthController, 'edit_me']);
router.get('/delete_user_account',[AuthController,'delete_user_account'])
router.get('/disconnection', [AuthController, 'disconnection']);
router.get('/global_disconnection', [AuthController, 'global_disconnection']);
//Animal
router.post('/create_animal', [AnimalsController, 'create_animal']);
router.put('/update_animal', [AnimalsController, 'update_animal']);
router.get('/get_animals', [AnimalsController, 'get_animals']);
router.delete('/delete_animal/:id', [AnimalsController, 'delete_animal']);
//Code
router.post('/create_code', [CodesController, 'create_code']);
router.put('/update_code', [CodesController, 'update_code']);
router.get('/get_codes', [CodesController, 'get_codes']);
router.delete('/delete_code/:id', [CodesController, 'delete_code']);
//Scane
router.get('/get_scanes',[ScanesController,'get_scanes'])
router.get('/s_c/:id', [ScanesController, 'scane_code']);
router.put('/update_scane', [ScanesController, 'update_scane']);
// User Browsers
router.get('/get_user_browsers', [UserBrowsersController, 'get_user_browsers'])
router.put('/disable_notifications', [UserBrowsersController, 'disable_notifications'])
router.put('/enable_notifications', [UserBrowsersController, 'enable_notifications'])
router.put('/set_notification_data', [UserBrowsersController, 'set_notification_data'])
router.delete('/remove_user_browser/:id', [UserBrowsersController, 'remove_user_browser'])
// UserNotif Contexts
router.post('/add_notif_context', [UserNotifContextsController, 'add_notif_context'])
router.get('/get_notif_contexts', [UserNotifContextsController, 'get_notif_contexts'])
router.delete('/remove_notif_context/:id', [UserNotifContextsController, 'remove_notif_context'])
//Rating
router.post('/add_rating', [RatingsController, 'add_rating'])
router.get('/get_ratings', [RatingsController, 'get_ratings'])

router.get(`${env.get("FILE_STORAGE_URL")}/*`, ({ params, response }) => {
  const fileName = `/${(params['*'] as string[]).join('/')}` 
  response.download(`${env.get("FILE_STORAGE_PATH")}${fileName}`);
});
router.get('/public/*', ({ params, response }) => {
  const fileName = `/${(params['*'] as string[]).join('/')}`
  response.download(`${env.get("PUBLIC_PATH")}${fileName}`);
});

router.get('/', ({ response }) => {
  response.download(`${env.get("PUBLIC_PATH")}/index.html`); 
})

router.get('/*', ({ params, response }) => {
  const fileName = `/${(params['*'] as string[]).join('/')}`
  if (
      params['*'][0] == 'assets' ||
      params['*'][0] == 'src' || 
      params['*'][0] == 'logo.png'||
      params['*'][0] == 'worker.js'
      ) {
      response.download(`${env.get("PUBLIC_PATH")}${fileName}`);
  } else {
      // response.download(`${env.get("PUBLIC_PATH")}/index.html`);
  }
})


const publicVapidKey = 'BDwYyNLBYIyNOBFX3M27uTAUXLrUxgHVyBJPjxJj3aQR7ghxC_MetHpzgTspdk4e4Iq9E0LCzeAtbCPOcdclxCk';
const privateVapidKey = 'rOHBJ0AGjSf37QW-mPRScGNr_0Bqn6Ouk-1nQPUUPpI';

webpush.setVapidDetails('mailto:sublymus@gmail.com', publicVapidKey, privateVapidKey);

const list:any[] = [];
router.post('/add_context_notifier', ({request, response}) => {
    // Get pushSubscription object
    const subscription = request.body();
    list.push(subscription);
    // Send 201 - resource created
    response.status(201).json({});
    // Create payload
    // webpush.sendNotification(subscription as any, payload).catch(err => console.error(err));
    // Pass object into sendNotification
    setTimeout(()=>{
        list.forEach(s=>{
            // console.log('Push ==>> ', {
                
            // });
            console.log(s);
            
            const payload = JSON.stringify({title:'new Message', content: "Push Content"});
            webpush.sendNotification(s as any,payload ).catch(err => console.error(err));
        })
    }, 1000)
}); 







