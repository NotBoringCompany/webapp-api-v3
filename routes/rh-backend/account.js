const express = require('express');
const {
    addLoggedInUser,
    removeLoggedInUser,
    retrieveUserBySessionToken,
    userLogin,
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

module.exports = router;
