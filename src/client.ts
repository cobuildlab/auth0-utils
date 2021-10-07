import { nanoid } from 'nanoid';

type Auth0ClientParams = {
  domain: string;
  clientId: string;
  clienSecret: string;
};
type Auth0User = Record<string, unknown>;

class Auth0Client {
  private domain: string;
  private clientId: string;
  private clienSecret: string;
  private accessToken: string | null = null;

  constructor(params: Auth0ClientParams) {
    this.domain = params.domain;
    this.clientId = params.clientId;
    this.clienSecret = params.clienSecret;
  }

  async setup(): Promise<void> {
    try {
      const response = await fetch(`https://${this.domain}/oauth/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audience: ` https://${this.domain}/api/v2/`,
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clienSecret,
        }),
      });
      const authResponse = await response.json();

      if (!authResponse.access_token) {
        console.log('accessTokenError', authResponse);
        throw new Error('There was a problem with the access token');
      }

      this.accessToken = authResponse.access_token;
    } catch (error) {
      console.log(error);
    }
  }

  /**.
   * This function creates a user in  the auth0 database.
   *
   * @param email - User email.
   * @param connection - Database connection on Auth0.
   * @returns User.
   */
  async createAuth0User(email: string, connection: string): Promise<Auth0User> {
    const password = nanoid(10);
    if (!this.accessToken) {
      throw new Error('No valid access token');
    }

    const userResponse = await fetch(`https://${this.domain}/api/v2/users`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + this.accessToken,
      },
      body: JSON.stringify({
        email,
        password: `*${password}*`,
        connection: connection,
      }),
    });

    const user = await userResponse.json();

    return user;
  }
}

/**
 * @param params - Params tu create the client.
 * @param params.domain - Auth0 tenant domain..
 * @param params.clientId - Auth0 app client id.
 * @param params.clienSecret - Auth0 app client secret.
 * @returns Client with methods to interacts with Auth0.
 */
export function createAuth0Client(params: Auth0ClientParams): Auth0Client {
  return new Auth0Client(params);
}
