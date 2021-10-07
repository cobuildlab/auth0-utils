# 8base-auth0

This is package to deal with common scenarios working with auth0 platform

## Installation

1. Run on your terminal the following command:

```sh
$ npm i --save @cobuildlab/auth0-utils
```

## Auth0Client

This client help us to interact with auth0 API

First initialize the client with the `createAuth0Client` function

```ts
import { createAuth0Client } from '@cobuildlab/auth0-utils';

const auth0Client = createAuth0Client({
  domain: 'your-app.us.auth0.com', // your domain
  clientId: 'BK6GTXnA87cdr56JXStB4TErQv70X546ff', // your auth0 app client id
  clientSecret: '********************', // your auth0 app client secret
});
```

Then before using the client it need to be setup

```ts
// after initialization
// this functions fetch the access token for the client to make requests.
// and its a async operation
await auth0Client.setup();
```

Then before using the client it need to be setup

```ts
// Creates a user with their email and database connection to save it
const auth0User = auth0Client.createAuth0User(
  'test@test.com',
  'Username-Password-Authentication',
);
```
