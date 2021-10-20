import {
  AUTH0_M2M_CLIENT_ID,
  AUTH0_M2M_CLIENT_SECRET,
  AUTH0_DOMAIN,
  AUTH0_DB_CONNECTION_NAME,
} from './constants';
import { createAuth0Client } from '@cobuildlab/auth0-utils';

const auth0 = createAuth0Client({
  clienSecret: AUTH0_M2M_CLIENT_SECRET,
  clientId: AUTH0_M2M_CLIENT_ID,
  domain: AUTH0_DOMAIN,
});

auth0
  .deleteUser('auth0|61704df6c69eb200705238e5')
  .then((data) => {
    console.log('susccess');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.log('error');
    console.log(JSON.stringify(error, null, 2));
  });
