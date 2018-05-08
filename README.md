# Automatic Argon2 Password Hashing for Objection.js [![Build Status](https://travis-ci.org/venables/objection-password-argon2.svg?branch=master)](https://travis-ci.org/venables/objection-password-argon2)

This plugin automatically adds automatic password hashing to your [Objection.js](https://github.com/Vincit/objection.js/) models. This makes it super-easy to secure passwords and other sensitive data.

Under the hood, the plugin uses [Argon2](https://en.wikipedia.org/wiki/Argon2) for hashing.

## Installation

### NPM
`npm i objection-password-argon2`

### Yarn
`yarn add objection-password-argon2`

## Usage

### Hashing your data

```js
// import the plugin
const Password = require('objection-password')();
const Model = require('objection').Model;

// mixin the plugin
class Person extends Password(Model) {
    static get tableName() {
        return 'person';
    }
}

const person = await Person.query().insert({
    email: 'matt@damon.com',
    password: 'q1w2e3r4'
});

console.log(person.password);
// $argon2i$v=19$m=4096,t=3,p=1$yqdvmjCHT1o+03hbpFg7HQ$Vg3+D9kW9+Nm0+ukCzKNWLb0h8iPQdTkD/HYHrxInhA
```

### Verifying the data
```js
// the password to verify
const password = 'q1w2e3r4';

// fetch the person by email
const person =
    await Person.query().first().where({ email: 'matt@damon.com'});

// verify the password is correct
const passwordValid = await person.verifyPassword(password);
```

## Options

There are a few options you can pass to customize the way the plugin works.

These options can be added when instantiating the plugin. For example:

```js
// import the plugin
const Password = require('objection-password')({
    passwordField: 'hash'
});
```

#### `allowEmptyPassword` (defaults to `false`)
Allows an empty password to be set.

#### `passwordField` (defaults to `password`)
Allows you to override the name of the field to be hashed.
