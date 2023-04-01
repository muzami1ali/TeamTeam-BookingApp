// This file contains functions that make API calls to the backend 

const jwtController = require('./jwt.js');

interface Society {
  id: number;
  name: string;
  email: string;
  description: string;
  category: string;
  isArchived: boolean;
}

interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  banner: string;
  societyId: number;
  isArchived: boolean;
  society: Society;
}

// This function gets all events from the backend 
export const getEvents = async () => {
  var events: Event[] = [];
  await fetch(process.env.REACT_APP_API_URL + '/events', {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    events = data.events;
  })
  .catch(error => {
    console.log(error);
  })
  return events;
}

// This function gets a specific event from the backend
export const getEventById = async (eventId: number) => {
  var event = {};
  if(jwtController.getToken() != null){
    await fetch(process.env.REACT_APP_API_URL + '/events/', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + jwtController.getToken()
      },
      body: JSON.stringify({"eventId": eventId})
    })
    .then(response => response.json())
    .then(data => {
      event = data;
    })
    .catch(error => {
      console.log(error);
    })
  } else {
    await fetch(process.env.REACT_APP_API_URL + '/events/', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({"eventId": eventId})
    })
    .then(response => response.json())
    .then(data => {
      event = data;
    })
    .catch(error => {
      console.log(error);
    })
  }
  return event;
}