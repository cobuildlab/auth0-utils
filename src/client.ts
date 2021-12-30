import { nanoid } from 'nanoid';
import fetch, { Response } from 'node-fetch';
import { Auth0UserUpdate } from './types';
import { hanldeFetch } from './utils';

export type Auth0ClientParams = {
  domain: string;
  clientId: string;
  clienSecret: string;
};

export type Auth0User = {
  created_at: string;
  email: string;
  email_verified: false;
  identities: [
    {
      connection: string;
      user_id: string;
      provider: string;
      isSocial: boolean;
    },
  ];
  name: string;
  nickname: string;
  picture: string;
  updated_at: string;
  user_id: string;
};

export type SendVerificationEmailResponse = {
  type: string;
  status: string;
  created_at: string;
  id: string;
};

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

  private async setupAccesToken(): Promise<void> {
    if (this.accessToken) {
      return;
    }
    try {
      const response = await fetch(`https://${this.domain}/oauth/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audience: `https://${this.domain}/api/v2/`,
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clienSecret,
        }),
      });
      const authResponse = (await response.json()) as { access_token: string };

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
   * This function creates a user in  the auth0 database if the users already exits it fetch it and return it.
   * this method need the following scopes from the M2M acces token "create:users" & "read:users"
   *
   * @param email - User email.
   * @param connection - Database connection on Auth0.
   * @param options - options
   * @param options.sendVerificationEmail - if should send a verification email.
   * @returns User.
   */
  async createOrReturnUser(
    email: string,
    connection: string,
    options?: {
      sendVerificationEmail: boolean;
    },
  ): Promise<Auth0User> {
    try {
      const user = await this.createAuth0User(email, connection, options);
      return user;
    } catch (error) {
      if (JSON.stringify(error).includes('The user already exists')) {
        const user = await this.getUserByEmail(email);

        return user;
      }

      throw error;
    }
  }
  /**.
   *
   * This function send a verification email to the .
   * This method need the following scopes from the M2M acces token "update:users".
   *
   * If you want to change the "redirect to url" please check this doc.
   * https://auth0.com/docs/brand-and-customize/email/customize-email-templates#configuring-the-redirect-to-url
   *
   * @param userId - The ID of the user.
   * @returns Response of the email sent.
   */
  async sendAuth0EmailVerification(
    userId: string,
  ): Promise<SendVerificationEmailResponse> {
    await this.setupAccesToken();

    return await hanldeFetch<SendVerificationEmailResponse>(
      fetch(`https://${this.domain}/api/v2/jobs/verification-email`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer ' + this.accessToken,
        },
        body: JSON.stringify({
          user_id: userId,
          client_id: this.clientId,
        }),
      }),
    );
  }
  /**.
   * This function creates a user in  the auth0 database.
   * this method need the following scopes from the M2M acces token "create:users"
   *
   * @param email - User email.
   * @param connection - Database connection on Auth0.
   * @param options - options
   * @param options.sendVerificationEmail - if should send a verification email.
   * @returns User.
   */
  async createAuth0User(
    email: string,
    connection: string,
    options?: {
      sendVerificationEmail: boolean;
    },
  ): Promise<Auth0User> {
    await this.setupAccesToken();

    const password = nanoid(10);
    if (!this.accessToken) {
      throw new Error('No valid access token');
    }

    const userResponse = await hanldeFetch<Auth0User>(
      fetch(`https://${this.domain}/api/v2/users`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer ' + this.accessToken,
        },
        body: JSON.stringify({
          email,
          password: `*${password}*`,
          connection: connection,
          verify_email: options?.sendVerificationEmail ?? false,
        }),
      }),
    );

    return userResponse;
  }

  /**.
   * This method returs a link for the user to reset the password.
   * this method need the following scopes from the M2M acces token "create:user_tickets"
   * @param params - User email.
   * @param params.connectionId - the connectio id of the database. example: "con_131231231321"
   * ID of the connection. If provided, allows the user to be specified using email instead of user_id. If you set this value, you must also send the email parameter. You cannot send user_id when specifying a connection_id.
   * @param params.resultUrl - Url to redirect the user after the the user chage their password. example "https://myapp.com/callback/"
   * @param params.email - the user email
   * @param params.ttlSec - Number of seconds for which the ticket is valid before expiration. If unspecified or set to 0, this value defaults to 432000 seconds (5 days).
   * @param params.clientId - ID of the client. If provided for tenants using New Universal Login experience, the user will be prompted to redirect to the default login route of the corresponding application once the ticket is used. See Configuring Default Login Routes for more details.
Conflicts with: result_url
   * @param params.userId - user_id of for whom the ticket should be created.
Conflicts with: connection_id, email
   * @returns User.
   */
  async getResetPasswordLink(params: {
    connectionId?: string;
    userId?: string;
    email?: string;
    resultUrl?: string;
    ttlSec?: number;
    clientId?: string;
  }): Promise<{ ticket: string }> {
    await this.setupAccesToken();

    if (!this.accessToken) {
      throw new Error('No valid access token');
    }
    const request = {
      user_id: params.userId,
      result_url: params.resultUrl,
      client_id: params.clientId,
      connection_id: params.connectionId,
      email: params.email,
      ttl_sec: params.ttlSec ?? 0,
      mark_email_as_verified: true,
    };
    const tikectResponse = await hanldeFetch<{ ticket: string }>(
      fetch(`https://${this.domain}/api/v2/tickets/password-change`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer ' + this.accessToken,
        },
        body: JSON.stringify(request),
      }),
    );

    return tikectResponse;
  }
  /**.
   * GET	/api/v2/users
   * this method need the following scopes from the M2M acces token "read:users, read:user_idp_tokens"
    - Specify a search criteria for users
    - Sort the users to be returned
    - Select the fields to be returned
    - Specify the number of users to retrieve per page and the page index.
   
    The q query parameter can be used to get users that match the specified criteria using query string syntax.
   
    Learn more about searching for users.
    See https://auth0.com/docs/users/user-search/user-search-query-syntax
   *
   * @param params - Params.
   * @param params.page - Page of the records.
   * @param params.perPage - Size of the response.
   * @param params.query - Query string to filter the users.
   * @returns A list of users.
   */
  async getUserList(params?: {
    page?: number;
    perPage?: number;
    query?: string;
  }): Promise<Auth0User[]> {
    const { page = 1, perPage = 10, query } = params || {};

    await this.setupAccesToken();
    const urlAppend = query
      ? `page=${page}&per_page=${perPage}&q=${query}`
      : `page=${page}&per_page=${perPage}`;
    const fullUrl = `https://${this.domain}/api/v2/users?${urlAppend}`;

    const usersResponse = await hanldeFetch<Auth0User[]>(
      fetch(fullUrl, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer ' + this.accessToken,
        },
      }),
    );

    return usersResponse;
  }
  /**.
   *DELETE	/api/v2/users/{id}
    Delete a user.
   
   * This method need the following scopes from the M2M acces token "delete:users"
   *
   * @param id - Id of the user.
   * @returns Success response.
   */
  async deleteUser(id: string): Promise<Response> {
    await this.setupAccesToken();

    const usersResponse = await fetch(
      `https://${this.domain}/api/v2/users/${id}`,
      {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer ' + this.accessToken,
        },
      },
    );
    if (!(usersResponse.status >= 200 && usersResponse.status <= 299)) {
      throw new Error('Fail to delete user');
    }
    return usersResponse;
  }

  /**.
  * GET	/api/v2/users-by-email
   Get user by its email.
   
   * This method need the following scopes from the M2M acces token "read:users" 
   *
   * @param email - Email of the user.
   * @returns {Auth0User} The user.
   */
  async getUserByEmail(email: string): Promise<Auth0User> {
    await this.setupAccesToken();
    const searchUser = await hanldeFetch<Auth0User[]>(
      fetch(
        `https://${this.domain}/api/v2/users-by-email?${new URLSearchParams({
          email,
        }).toString()}`,
        {
          method: 'GET',
          headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer ' + this.accessToken,
          },
        },
      ),
    );
    const user = searchUser[0];

    return user;
  }
  /**.
   *PATCH	/api/v2/users/USER_ID
    Change password a user.
   
   * This method need the following scopes from the M2M acces token "read:users", "update:users" & "update:users_app_metadata"
   *
   * @param email - Email of the user.
   * @param password - New password.
   * @returns {Auth0User} The id of the user to be blocked.
   */
  async changePassword(email: string, password: string): Promise<Auth0User> {
    await this.setupAccesToken();
    const searchUser = await hanldeFetch<Auth0User[]>(
      fetch(
        `https://${this.domain}/api/v2/users-by-email?${new URLSearchParams({
          email,
        }).toString()}`,
        {
          method: 'GET',
          headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer ' + this.accessToken,
          },
        },
      ),
    );
    const { user_id } = searchUser[0];
    const usersResponse = await hanldeFetch<Auth0User>(
      fetch(`https://${this.domain}/api/v2/users/${user_id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer ' + this.accessToken,
        },
        body: JSON.stringify({
          password: password,
        }),
      }),
    );
    return usersResponse;
  }

  /**.
   * Check user password.
   *
   * This method requires that the m2m application have "password" as a valid grant.
   *
   * @param email - Email of the user.
   * @param password - New password.
   * @returns {boolean} Boolean If are valid password.
   */
  async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<boolean> {
    await this.setupAccesToken();

    const authenticateUserInput = {
      grant_type: 'password',
      password: password,
      client_id: this.clientId,
      client_secret: this.clienSecret,
      username: email,
      audience: `https://${this.domain}/api/v2/`,
      scope: 'profile email',
    };

    const response = await fetch(`https://${this.domain}/oauth/token`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authenticateUserInput),
    });

    const data = await response.json();

    if (!response.ok && response.status !== 403) {
      throw data;
    } else if (response.status === 403) {
      return false;
    } else {
      return true;
    }
  }
  /**.
   * @param id - Email of the user.
   * @param info - New info.
   * @returns {Auth0User} User Update Response.
   */
  async updateUserData(id: string, info: Auth0UserUpdate): Promise<Auth0User> {
    await this.setupAccesToken();

    const response = await hanldeFetch<Auth0User>(
      fetch(`https://${this.domain}/api/v2/users/${id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          Authorization: 'Bearer ' + this.accessToken,
        },
        body: JSON.stringify(info),
      }),
    );

    return response;
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
