const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events.ts');

// This route is used to get all events from the database.
router.get('/', (req, res) => {
  eventsController.getEvents(req, res);
});

// When a POST request is made to /events, it includes a JSON object with
// the following properties:
// { "id": [event_id] }
router.post('/', (req, res) => {
  eventsController.getEventById(req, res);
});

router.post('/search', (req, res) => {
  eventsController.searchEvents(req, res);
});

// When a POST request is made to the /events/create, it includes a JSON
// object with the following properties:
// { "name": [event_name] }
// { "description": [event_description] }
// { "date": [event_date] }
// { "society": [society_id] }
router.post('/create', (req, res) => {
  eventsController.createEvent(req, res);
});

// When a POST request is made to the /events/update, it includes a JSON
// object with the following properties:
// { "id": [event_id] }
// { "name": [event_name] }
// { "description": [event_description] }
// { "date": [event_date] }
// { "location": [event_location] }"}
// { "society": [society_id] }
router.post('/update', (req, res) => {
  eventsController.updateEvent(req, res);
});

// When a POST request is made to the /events/delete, it should include a JSON
// object with the following properties:
// { "id": [event_id] }
router.post('/delete', (req, res) => {
  eventsController.deleteEvent(req, res);
});

router.post('/auth', (req, res) => {
  eventsController.checkPrivileges(req, res);
});

module.exports = router;
