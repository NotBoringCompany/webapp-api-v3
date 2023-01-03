
require('dotenv').config();

const Moralis = require('moralis-v1/node');
const { parseJSON } = require('../../utils/jsonParser');

const serverUrl = process.env.MORALIS_SERVERURL;
const appId = process.env.MORALIS_APPID;
const masterKey = process.env.MORALIS_MASTERKEY;

/**
 * `userLogin` logs the user in to Moralis
 * @param {String} login the user's login
 * @param {String} password the user's password
 * @return {Promise<Object>} an object with `status`, `sessionToken` and `userUniqueHash`
 */
const userLogin = async (login, password) => {
    try {
        const user = await Moralis.User.logIn(login, password);

        return { status: 'ok', sessionToken: user.get('sessionToken'), userUniqueHash: user.get('userUniqueHash') };
    } catch (err) {
        throw err;
    }
};

/**
 * `addLoggedInUser` adds a logged in user to `RHLoggedInUsers` after logging into Realm Hunter.
 * @param {string} sessionToken the session token of the user
 * @return {Object} an 'ok' status and the ethAddress
 */
const addLoggedInUser = async (sessionToken) => {
    try {
        // we query the Session database for the specific `sessionToken`.
        const SessionDB = new Moralis.Query('_Session');
        SessionDB.equalTo('sessionToken', sessionToken);
        // we get the query result here
        const sessionQuery = await SessionDB.first({ useMasterKey: true });

        // if the result returns undefined (meaning it doesn't exist), we throw an error.
        if (!sessionQuery) {
            throw new Error('Session token not found');
        }

        // we parse the result into a JSON object as a string
        const parsedSessionQuery = parseJSON(sessionQuery);
        // we get the user object ID from the parsed result
        const userObjId = parsedSessionQuery.user.objectId;

        // now, we query the User database via the user object ID to obtain the user's data.
        const UserDB = new Moralis.Query('_User');
        UserDB.equalTo('objectId', userObjId);
        const userQuery = await UserDB.first({ useMasterKey: true });

        // if the result returns undefined (meaning it doesn't exist), we throw an error.
        if (!userQuery) {
            throw new Error('User not found');
        }

        // we parse the result into a JSON object as a string
        const parsedUserQuery = parseJSON(userQuery);
        // we get the user's ETH address from the parsed result
        const ethAddress = parsedUserQuery.ethAddress;

        // if the user's ETH address is undefined, we throw an error.
        if (!ethAddress) {
            throw new Error('User has no ETH address');
        }

        // now, we query the `RHLoggedInUsers` database to check if the user has logged in before.
        // if not, we 'log the user in' by adding a record of the user to the database
        const RHLoggedInUsersDB = new Moralis.Query('RHLoggedInUsers');
        RHLoggedInUsersDB.equalTo('address', ethAddress);

        const loggedInQuery = await RHLoggedInUsersDB.first({ useMasterKey: true });

        // if the query exists, then the user is logged in already. we throw an error.
        if (loggedInQuery) {
            throw new Error('User is already logged in');
        }

        // if it doesn't exist, we add the user to the database.
        const RHLoggedInUsers = Moralis.Object.extend('RHLoggedInUsers');
        const rhLoggedInUsers = new RHLoggedInUsers();

        rhLoggedInUsers.set('address', ethAddress);

        // if the user has an email, we also store the email.
        if (parsedUserQuery.email) {
            rhLoggedInUsers.set('email', parsedUserQuery.email);
        }

        // we save the record to the database.
        rhLoggedInUsers.save(null, { useMasterKey: true });

        return {
            status: 'ok',
            user: ethAddress,
        };
    } catch (err) {
        throw err;
    }
};

/**
 * `removeLoggedInUser` removes a logged in user from `RHLoggedInUsers` after logging out of Realm Hunter.
 * @param {string} address the ETH address of the user
 */
const removeLoggedInUser = async (address) => {
    try {
        const RHLoggedInUsersDB = new Moralis.Query('RHLoggedInUsers');
        RHLoggedInUsersDB.equalTo('address', address);

        const query = await RHLoggedInUsersDB.first({ useMasterKey: true });

        if (!query) {
            throw new Error('User not found');
        }

        query.destroy({ useMasterKey: true });
    } catch (err) {
        throw err;
    }
};

/**
 * `retrieveUserBySessionToken` retrieves a user's data by their session token.
 * @param {string} sessionToken the session token of the user
 * @return {Object} the user's data
 */
const retrieveUserBySessionToken = async (sessionToken) => {
    try {
        // we query the Session database for the specific `sessionToken`.
        const SessionDB = new Moralis.Query('_Session');
        SessionDB.equalTo('sessionToken', sessionToken);
        // we get the query result here
        const sessionQuery = await SessionDB.first({ useMasterKey: true });

        // if the result returns undefined (meaning it doesn't exist), we throw an error.
        if (!sessionQuery) {
            throw new Error('Session token not found');
        }

        // we parse the result into a JSON object as a string
        const parsedSessionQuery = parseJSON(sessionQuery);
        // we get the user object ID from the parsed result
        const userObjId = parsedSessionQuery.user.objectId;

        // now, we query the User database via the user object ID to obtain the user's data.
        const UserDB = new Moralis.Query('_User');
        UserDB.equalTo('objectId', userObjId);
        const userQuery = await UserDB.first({ useMasterKey: true });

        // if the result returns undefined (meaning it doesn't exist), we throw an error.
        if (!userQuery) {
            throw new Error('User not found');
        }

        // we parse the result into a JSON object as a string
        const parsedUserQuery = parseJSON(userQuery);

        return parsedUserQuery;
    } catch (err) {
        throw err;
    }
};

module.exports = {
    userLogin,
    addLoggedInUser,
    removeLoggedInUser,
    retrieveUserBySessionToken,
};
