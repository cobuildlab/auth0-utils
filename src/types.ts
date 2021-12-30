export type AccessTokenAuth0 = {
  access_token: string;
  token_type: string;
};

export type Auth0UserUpdate = {
  blocked?: boolean;
  email_verified?: boolean;
  email?: string;
  phone_number?: string;
  phone_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  verify_email?: boolean;
  verify_phone_number?: boolean;
  password?: string;
  connection?: string;
  client_id?: string;
  username?: string;
};
