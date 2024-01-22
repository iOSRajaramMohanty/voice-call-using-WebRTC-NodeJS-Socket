const express = require('express');
const router = express.Router();

const customGenerationFunction = () =>
	(Math.random().toString(36) + "0000000000000000000").substr(2, 16);

let connectedUsers = [];

//gets all users data
router.get('/tocken', (req, res) => {
    let callerID = customGenerationFunction();
    connectedUsers.push(callerID);

    res.json({
        tocken: `${callerID}`
    });
});

router.get('/allTocken', (req, res) => {
    res.json({
        all_tocken: `${connectedUsers}`
    });
});

router.post('/:id', async (req, res) => {//id = phone-number-id
    try {
        res.json({id:req.params.id});
    } catch (error) {
        res.status(400).json(error);
    }
});

module.exports = router;