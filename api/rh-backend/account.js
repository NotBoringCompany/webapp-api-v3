
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
 * @return {object} the user's data
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

/**
 * `addUserData` adds an instance of the user to `WebAppData` and `RealmHunterData`.
 * @param {string} userObjId the user's object ID (from _User)
 * @param {string} playfabId OPTIONAL. will add to the playfabId column if added. otherwise, `addPlayfabId` will need to be called.
 * @return {Object} an 'ok' status
 */
const addUserData = async (userObjId, playfabId) => {
    try {
        const WebAppDataDB = Moralis.Object.extend('WebAppData');
        const webAppDataDB = new WebAppDataDB();

        const RealmHunterDataDB = Moralis.Object.extend('RealmHunterData');
        const realmHunterDataDB = new RealmHunterDataDB();

        // we check if the data exists. if they do, we throw an error.
        const WebAppData = new Moralis.Query('WebAppData');
        const RealmHunterData = new Moralis.Query('RealmHunterData');
        const UserData = new Moralis.Query('_User');

        UserData.equalTo('objectId', userObjId);

        const getUser = await UserData.first({ useMasterKey: true });
        const parsedUser = parseJSON(getUser);
        const ethAddress = parsedUser.ethAddress;

        WebAppData.matchesQuery('user', UserData);
        RealmHunterData.matchesQuery('user', UserData);

        const webAppQuery = await WebAppData.first({ useMasterKey: true });
        const realmHunterQuery = await RealmHunterData.first({ useMasterKey: true });

        // if the query results exist, we throw an error since we want them to be empty.
        if (webAppQuery) {
            throw new Error('User web app data already exists.');
        }

        if (realmHunterQuery) {
            throw new Error('User\'s Realm Hunter data already exists.');
        }

        webAppDataDB.set('user', {
            __type: 'Pointer',
            className: '_User',
            objectId: userObjId,
        });

        if (ethAddress) {
            webAppDataDB.set('ethAddress', ethAddress);
            realmHunterDataDB.set('ethAddress', ethAddress);
        }

        webAppDataDB.set('webAppTier', 'newcomer');

        // if the playfabId is given, we also add this.
        if (playfabId) {
            webAppDataDB.set('playfabId', playfabId);
            // although playfab id exists, the user's account is just created.
            // we will assume (with high probability) that the user will NOT be able to claim just yet.
            webAppDataDB.set('canClaim', false);
            webAppDataDB.set('canDeposit', true);
        } else {
            // claiming & depositing requires a playfabId, so these will be disabled for now.
            webAppDataDB.set('canClaim', false);
            webAppDataDB.set('canDeposit', false);
        }

        realmHunterDataDB.set('user', {
            __type: 'Pointer',
            className: '_User',
            objectId: userObjId,
        });

        await webAppDataDB.save(null, { useMasterKey: true });
        await realmHunterDataDB.save(null, { useMasterKey: true });

        return {
            status: 'ok',
        };
    } catch (err) {
        throw err;
    }
};

/**
 * `checkPlayfabIdExists` checks if a user has a playfabId stored in our database.
 * the playfabId MUST exist in both `WebAppData` and `RealmHunterData`to return a `true` value.
 * @param {string} userObjId the user's object ID (from _User)
 * @return {boolean} true if the playfabId exists in both databases, false otherwise.
 */
const checkPlayfabIdExists = async (userObjId) => {
    try {
        let bothExists = false;

        const WebAppData = new Moralis.Query('WebAppData');
        WebAppData.equalTo('user', {
            __type: 'Pointer',
            className: '_User',
            objectId: userObjId,
        });

        const RealmHunterData = new Moralis.Query('RealmHunterData');
        RealmHunterData.equalTo('user', {
            __type: 'Pointer',
            className: '_User',
            objectId: userObjId,
        });

        const webAppQuery = await WebAppData.first({ useMasterKey: true });
        const realmHunterQuery = await RealmHunterData.first({ useMasterKey: true });

        if (!webAppQuery) {
            throw new Error('User web app data does not exist.');
        }

        if (!realmHunterQuery) {
            throw new Error('User\'s Realm Hunter data does not exist.');
        }

        if (webAppQuery && realmHunterQuery) {
            bothExists = true;
        }

        return bothExists;
    } catch (err) {
        throw err;
    }
};

module.exports = {
    userLogin,
    addLoggedInUser,
    removeLoggedInUser,
    retrieveUserBySessionToken,
    addUserData,
    checkPlayfabIdExists,
};
