'use strict';

const argon2 = require('argon2');

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

            $beforeUpdate(opt, context) {

                const maybePromise = super.$beforeUpdate(context);

                return Promise.resolve(maybePromise).then(() => {
                    // hash the password
                    return this.generateHash();
                });
            }

            /**
             * Compares a password to a argon2 hash
             * @param  {[type]} password [description]
             * @return {[type]}          [description]
             */
            verifyPassword(password) {
                return argon2.verify(this[options.passwordField], password);
            }

            /**
             * Generates a argon2 hash
             * @param  {String}  password         the password...
             * @param  {Number}  rounds           the number of rounds to use when hashing (default = 12)
             * @return {String}                   returns the hash or null
             */
            generateHash() {

                const password = this[options.passwordField];

                if (password) {

                    if (this.constructor.isArgonHash(password)) {
                        throw new Error('Argon2 tried to hash another argon2 hash');
                    }

                    return argon2.hash(password).then((hash) => {
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
             * @return {Boolean} True if the str seems to be an argon2 hash
             */
            static isArgonHash(str) {
                return str.startsWith('$argon');
            }
        };

    };
};
