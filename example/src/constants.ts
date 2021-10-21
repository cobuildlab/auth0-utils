import * as dotenv from 'dotenv';

dotenv.config();

export const AUTH0_M2M_CLIENT_ID = process.env.AUTH0_M2M_CLIENT_ID || '';
export const AUTH0_M2M_CLIENT_SECRET =
  process.env.AUTH0_M2M_CLIENT_SECRET || '';
export const AUTH0_DB_CONNECTION_NAME =
  process.env.AUTH0_DB_CONNECTION_NAME || '';
export const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || '';
