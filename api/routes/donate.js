const express = require('express');
const router = express.Router();
const donateController = require('../controllers/donateController');

router.post('/', donateController.createDonationOrder);

module.exports = router;