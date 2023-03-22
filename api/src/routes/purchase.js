// Create routers for the past events page for a user to display on the past
// events page for a user on the front end
// Path: api/src/routes/past.js
const express = require('express');
/* eslint-disable-next-line */
const router = express.Router();
const purchaseController = require('../controllers/purchase.js');

router.post('/', (req, res) => {
  console.log('Request recieved');
  purchaseController.getPastPurchases(req, res);
});

router.post('/future', (req, res) => {
  console.log('Request recieved');
  purchaseController.getFutureTickets(req, res);
});
router.post('/create', (req, res) => {
  console.log('Request recieved');
  purchaseController.createPurchase(req, res);
});

module.exports = router;