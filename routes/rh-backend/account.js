const express = require('express');
const {
    addLoggedInUser,
    removeLoggedInUser,
    retrieveUserBySessionToken,
    userLogin,
    addUserData,
    addPlayfabId,
    getUserIdFromUniqueHash,
    getPlayfabId,
    checkPlayfabIdExists,
    checkUserDataExists,
} = require('../../api/rh-backend/account');
const router = express.Router();

router.post('/addLoggedInUser', async (req, res) => {
    const { sessionToken } = req.body;

    try {
        const result = await addLoggedInUser(sessionToken);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.post('/removeLoggedInUser', async (req, res) => {
    const { address } = req.body;

    try {
        const result = await removeLoggedInUser(address);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.post('/retrieveUserBySessionToken', async (req, res) => {
    const { sessionToken } = req.body;

    try {
        const result = await retrieveUserBySessionToken(sessionToken);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.post('/userLogin', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await userLogin(username, password);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.post('/addUserData', async (req, res) => {
    const { userObjId, playfabId } = req.body;

    try {
        const result = await addUserData(userObjId, playfabId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.post('/addPlayfabId', async (req, res) => {
    const { userObjId, playfabId } = req.body;

    try {
        const result = await addPlayfabId(userObjId, playfabId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.post('/getUserIdFromUniqueHash', async (req, res) => {
    const { uniqueHash } = req.body;

    try {
        const result = await getUserIdFromUniqueHash(uniqueHash);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.get('/getPlayfabId/:address', async (req, res) => {
    const address = req.params.address;

    try {
        const result = await getPlayfabId(address);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.post('/checkPlayfabIdExists', async (req, res) => {
    const { userObjId } = req.body;

    try {
        const result = await checkPlayfabIdExists(userObjId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.post('/checkUserDataExists', async (req, res) => {
    const { userObjId } = req.body;

    try {
        const result = await checkUserDataExists(userObjId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
