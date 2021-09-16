import { AccessTokenAuth0 } from './types';
import fetch from 'node-fetch';
import { nanoid } from 'nanoid';

/**
 * This action create a auth0 users.
 *
 * @param {string} email - Email to create the user.
 * @param {string} access_token - Need the access token of auth0, you need this obligatory.
 * @param {string} auth0UsersUrl - This is a url of auth0 project, you can get this in the doc of auth0. Example: https://your-app.us.auth0.com/api/v2/users.
 * @returns {Promise<any>} - Success data if created the user.
 * @private
 */
export const createAuth0User = async (
  email: string,
  access_token: string,
  auth0UsersUrl: string,
): Promise<any> => {
  const password = nanoid(10);
  console.log(password);

  if (!access_token) {
    throw new Error('No valid access token');
  }

  let userResponse;

  try {
    userResponse = await fetch(`${auth0UsersUrl}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + access_token,
      },
      body: JSON.stringify({
        email,
        password: `*${password}*`,
        connection: 'Username-Password-Authentication',
      }),
    });
  } catch (error) {
    console.log('ERROR CREATING AUTH0 USER \n', error);
    throw new Error(error);
  }

  userResponse = await userResponse.json();

  if (!userResponse) {
    console.log('CreateUserError', userResponse);
    console.log('ERROR CREATING AUTH0 USER \n');
    throw new Error('ERROR CREATING AUTH0 USER');
  }

  console.log('User auth0 Created Success', userResponse);
  return userResponse;
};

/**
 * @description Fetch user by email on auth0.
 *
 * @param {string} email - Email of the user to look all data of user in auth0.
 * @param {string} access_token - Api access token.
 * @param {string} token_type - The type of api token.
 * @param {string} url - Url to fetch the users by email on auth0. Example: https://your-app.us.auth0.com/api/v2/users-by-email?email=.
 *
 * @returns {Promise<string | undefined>} The id of the user to be blocked.
 * @private
 */
export const fetchUserByEmailOnAuth0 = async (
  email: string,
  access_token: string,
  token_type: string,
  url: string,
): Promise<string | undefined> => {
  try {
    const userResponse = await fetch(url + email, {
      method: 'GET',
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });
    return (await userResponse.json())[0].user_id;
  } catch (error) {
    console.log('ERROR FECHING USER \n', error);
    throw new Error(error);
  }
};

/**
 * @description Function to fetch auth0 access token.
 * @param {string} fetchTokenUrl - Url to fetch auth0 token. Example: https://your-app.us.auth0.com/oauth/token.
 * @param {string} auth0Audience - Auth0 audience of your project. Example: https://your-app.us.auth0.com/api/v2/.
 * @param {string} auth0MachineClientId - Need a M2M client id. Example: IAx2aVXfXUNW1qjk4sQYtMMRoWFSM6wx.
 * @param {string} auth0MachineSecret - Need a M2M client secret. Example: PZJJKWuBQcUc610fyGaLP4mVV6S9kHYyHSreup8A4Ltum7yAWgPTKzX4YxkydShb.
 * @returns {Promise<AccessTokenAuth0>} The access token and token type for conections with the API.
 * @private
 */
export const fetchAccessTokenOnAuth0 = async (
  fetchTokenUrl: string,
  auth0Audience: string,
  auth0MachineClientId: string,
  auth0MachineSecret: string,
): Promise<AccessTokenAuth0> => {
  if (fetchTokenUrl === undefined)
    throw new Error('fetchTokenUrl is undefined');

  try {
    const response = await fetch(fetchTokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        audience: auth0Audience,
        grant_type: 'client_credentials',
        client_id: auth0MachineClientId,
        client_secret: auth0MachineSecret,
      }),
    });
    const authResponse = await response.json();
    if (!authResponse.access_token) {
      console.log('accessTokenError', authResponse);
      throw new Error('There was a problem with the access token');
    }
    return authResponse;
  } catch (error) {
    console.log('authActionError', error);
    throw new Error(error);
  }
};

/**
 * @description Request email verification from Auth0.
 *
 * @param {string} auth_domain - Auth0's auth domain.
 * @param {string} access_token - Auth0's management api access token (see {@linkcode fetchAccessTokenOnAuth0}).
 * @param {string} user_id - Authenticated user ID.
 * @param {string} client_id - Auth0's machine client ID.
 * @param {string} provider - User's authentication provider.
 *
 * @returns {Promise<void>} - Gracefully exit if job was successfully created.
 *
 * @private
 */
export const sendAuth0EmailVerification = async (
  auth_domain: string,
  access_token: string,
  user_id: string,
  client_id: string,
  provider: string,
): Promise<void> => {
  try {
    const response = await fetch(
      `https://${auth_domain}/api/v2/jobs/verification-email`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          user_id: `${provider}|${user_id}`,
          client_id,
          identity: {
            user_id,
            provider,
          },
        }),
      },
    );

    if (response.status !== 201) {
      throw new Error(`Request failed with status code ${response.status}`);
    }
  } catch (e) {
    throw new Error(e);
  }
};
