'use strict';

const Argon2 = require('argon2');

const REGEXP = /^\$argon/;

module.exports = (options) => {

    // Provide good defaults for the options if possible.
    options = Object.assign({
        allowEmptyPassword: false,
        passwordField: 'password'
    }, options);

    // Return the mixin. If your plugin doesn't take options, you can simply export
    // the mixin. The factory function is not needed.
    return (Model) => {

        return class extends Model {

            $beforeInsert(context) {

                const maybePromise = super.$beforeInsert(context);

                return Promise.resolve(maybePromise).then(() => {
                    // hash the password
                    return this.generateHash();
                });
            }

            $beforeUpdate(queryOptions, context) {

                const maybePromise = super.$beforeUpdate(queryOptions, context);

                return Promise.resolve(maybePromise).then(() => {
                    if (queryOptions.patch && this[options.passwordField] === undefined) {
                        return;
                    }

                    // hash the password
                    return this.generateHash();
                });
            }

            /**
             * Compares a password to an Argon2 hash
             * @param  {String}             password  the password...
             * @return {Promise.<Boolean>}            whether or not the password was verified
             */
            verifyPassword(password) {
                return Argon2.verify(this[options.passwordField], password);
            }

            /**
             * Generates an Argon2 hash
             * @return {Promise.<(String|void)>}  returns the hash or null
             */
            generateHash() {

                const password = this[options.passwordField];

                if (password) {

                    if (this.constructor.isArgonHash(password)) {
                        throw new Error('Argon2 tried to hash another Argon2 hash');
                    }

                    return Argon2.hash(password).then((hash) => {
                        this[options.passwordField] = hash;
                    });
                }

                // throw an error if empty passwords aren't allowed
                if (!options.allowEmptyPassword) {
                    throw new Error('password must not be empty');
                }

                return Promise.resolve();
            }


            /**
             * Detect rehashing for avoiding undesired effects
             * @param {String} str A string to be checked
             * @return {Boolean} True if the str seems to be an Argon2 hash
             */
            static isArgonHash(str) {
                return REGEXP.test(str);
            }
        };

    };
};
