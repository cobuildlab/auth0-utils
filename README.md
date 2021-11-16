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

Then you can use any of the methods

```ts
// Creates a user with their email and database connection to save it
const auth0User = auth0Client.createAuth0User(
  'test@test.com',
  'Username-Password-Authentication',
);
```

```ts
// Retrives a user by their email
const auth0User = auth0Client.getUserByEmail('test-user@test-mail.com');
```

```ts
// Deletes a user by its auth0 id
const auth0User = auth0Client.deleteUser('auth0|C61704df6c69eb200705238e5');
```

## Contribute to this package

You can contribute to this project cloning this repository then install

```sh
$ npm install
```

In the `example` directory inside this project there is a small node js app that imports this library
You can use the example app to test you features and fixes during the development process

1. First make the build with `npm run build` at the root to build de package.
2. Then you can `npm run build && node lib/index.js` to build and execute the node script to test the package.
