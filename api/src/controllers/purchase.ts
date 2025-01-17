// Past events page controller for the user. 

const prisma = require('../../prisma/prisma.ts');
const {mail} = require('../utils/emails.ts');
const auth = require('../utils/jwt_auth.ts');
const {randomString} = require('../utils/random.ts');


// This function is used to get the past purchases of a user
const getPastPurchases = async (req, res) => {
  try {
    // Authenticate the user
    const decoded = await auth.authenticate(req);

    // Get the user id from the decoded token
    const userId = decoded.id; 

    // use the user id to get the user's past purchases for events that have already happened
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: userId,
        event: {
          date: {
            lte: new Date(),
          },
        },
        isArchived: false,
      },
    });

    // Retreive tickets using purchase id and add the tickets to purchase json
    const pastTickets = await Promise.all(purchases.map(async (purchase) => {
      const tickets = await prisma.ticket.findMany({
        where: {
          purchaseId: purchase.id,
        },
      });
      return {
        ...purchase,
        tickets: tickets,
      };
    }));

    // Retreive event using event id and add the event to purchase json for a past ticket
    const pastTicketWithEvent = await Promise.all(pastTickets.map(
        async (ticket) => {
          const event = await prisma.event.findUnique({
            where: {
              id: ticket.eventId,
            },
          });
          return {
            ...ticket,
            event: event,
          };
        }));
    res.status(200).send({pastTickets: pastTicketWithEvent});
  } catch (err) {
    res.status(401).send({token: null, error: 'Unauthorized'});
  }
};


// This function is used to get the future purchases of a user.
const getFutureTickets = async (req, res) => {
  let decoded = null;
  try {
    // Authenticate the user
    decoded = await auth.authenticate(req);
  } catch (err) {
    return res.status(401).send({token: null, error: 'Unauthorized'});
  }

  // Get all purchases for the user where the event date is in the future
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: decoded.id,
      event: {
        date: {
          gte: new Date(),
        },
      },
      isArchived: false,
    },
  });

  // Retreive tickets using purchase id and add the tickets to purchase json
  const futureTickets = await Promise.all(
      purchases.map(async (purchase) => {
        const tickets = await prisma.ticket.findMany({
          where: {
            purchaseId: purchase.id,
          },
        });
        return {
          ...purchase,
          tickets: tickets,
        };
      }),
  );

  // Retreive event using event id and add the event to purchase json
  const futureTicketWithEvent =
    await Promise.all(futureTickets.map(async (ticket) => {
      const event = await prisma.event.findUnique({
        where: {
          id: ticket.eventId,
        },
      });
      return {
        ...ticket,
        event: event,
      };
    }));

  res.status(200).send({futureTickets: futureTicketWithEvent});
};

// This function is for the user to create a purchase.
const createPurchase = async (req, res) => {
  // (user token, payment status, total, payment method, event id, tickets)
  let decoded = null;
  try {
    decoded = await auth.authenticate(req);
  } catch (err) {
    return res.status(401).send({error: 'Unauthorised'});
  }

  if (
    req.body === undefined ||
    req.body.status === undefined ||
    req.body.total === undefined ||
    req.body.method === undefined ||
    req.body.ticket_quantities === undefined ||
    req.body.eventId === undefined
  ) {
    return res.status(400).send({error: 'Missing Body'});
  }

  if (
    // Check that the status is a string
    typeof req.body.status !== 'string' ||
    // Check that the method is a string
    typeof req.body.method !== 'string' ||
    // Check that the total is a number
    typeof req.body.total !== 'number' ||
    // Check that the total is greater than 0
    req.body.total < 0 ||
    // Check that the eventId is a number
    typeof req.body.eventId !== 'number' ||
    // Check that the eventId is greater than 0
    req.body.eventId <= 0
  ) {
    return res.status(400).send({error: 'Invalid Body'});
  }

  // Split the if statement above into multiple individual if statements
  if (typeof req.body.ticket_quantities !== 'object') {
    return res.status(400).send({error: 'Ticket Quantities not an object'});
  }

  if (req.body.ticket_quantities === null) {
    return res.status(400).send({error: 'Ticket Quantities is null'});
  }

  if (!req.body.ticket_quantities.hasOwnProperty('types')) {
    return res.status(400).send({error: 'Ticket Quantities has no types'});
  }

  if (!Array.isArray(req.body.ticket_quantities.types)) {
    return res.status(400)
        .send({error: 'Ticket Quantities types is not an array'});
  }

  if (req.body.ticket_quantities.types.length === 0) {
    return res.status(400).send({error: 'Ticket Quantities types is empty'});
  }

  for (const type of req.body.ticket_quantities.types) {
    if (
      // Check that ticket_quantities.types is an array of objects
      typeof type !== 'object' ||
      // Check that ticket_quantities.types is an array of objects with id and
      // quantity properties
      !type.hasOwnProperty('id') ||
      !type.hasOwnProperty('quantity') ||
      // Check that the quantity is a number and greater than 0
      typeof type.quantity !== 'number' ||
      type.quantity <= 0 ||
      // Check that the ID is a number and greater than 0
      typeof type.id !== 'number' ||
      type.id <= 0
    ) {
      return res.status(400).send({error: 'Invalid ticket_quantities'});
    }

    // Check that the ID is a valid ticket type ID
    const ticketTypeId = await prisma.ticketType.findUnique({
      where: {
        id: type.id,
      },
    });

    if (!ticketTypeId) {
      return res.status(400).send({error: 'Invalid ticket type ID'});
    }
  }

  const event = await prisma.event.findFirst({
    where: {
      id: req.body.eventId,
    },
  });

  if (!event) return res.status(400).send({error: 'Invalid Event ID'});

  const payment = await prisma.purchase.create({
    data: {
      total: req.body.total,
      paymentMethod: 'paypal',
      user: {
        connect: {
          id: decoded.id,
        },
      },
      event: {
        connect: {
          id: req.body.eventId,
        },
      },
    },
  });

  let quantity = 0;

  const tickets = [];

  for (const type of req.body.ticket_quantities.types) {
    key = type.id;
    value = type.quantity;

    const ticketType = await prisma.ticketType.findFirst({
      where: {
        id: key,
      },
    });

    if (!ticketType) {} else {
      for (let i = 0; i < value; i++) {
        quantity++;

        const ticketEncode = {
          ticketTypeName: ticketType.name,
          ticketTypeID: ticketType.id,
          userID: decoded.id,
          eventID: event.id,
          purchaseID: payment.id,
          ticketSecret: randomString(),
        };
        const tickettext = Buffer.from(
            JSON.stringify(ticketEncode)).toString('base64');
        tickets.push({
          'qrData': tickettext,
          'String': ticketType.ticketType + ' ' + event.name + quantity,
        });

        await prisma.ticket.create({
          data: {
            ticketData: tickettext,
            purchase: {
              connect: {
                id: payment.id,
              },
            },
            ticketType: {
              connect: {
                id: ticketType.id,
              },
            },
            event: {
              connect: {
                id: event.id,
              },
            },
            user: {
              connect: {
                id: decoded.id,
              },
            },
          },
        });
      }
    }
  }

  const user = await prisma.user.findFirst({
    where: {
      id: decoded.id,
    },
  });

  const eventDate = new Date(event.date);

  mail(to=user.email, subject='Purchase Confirmation', body=`
  <h2>Purchase Confirmation Order #` + payment.id + `</h2><br />
  <br />
  <h4> Confirmation Of Order Details:</h4><br />
  <p><br />
  Event Name: <a href="http://localhost:3000/event-details?eventId=` + event.id + `">` + event.name + `</a><br />
  Event Date: ` + eventDate.toDateString() + `<br />
  Event Date: ` + eventDate.toTimeString() + `<br />
  Event URL: <a>http://localhost:3000/event-details?eventId=` + event.id + `</a><br />
  <br />
  <br />
  Quantity Of Tickets: ` + quantity + `<br />
  Payment Method: ` + req.body.method + `<br />
  Total Sum Of Tickets: ` + req.body.total + `<br />
  <br />
  <br />
  </p>
  `, qrYes=true, qrcodes=tickets);

  return res.status(200).send({message: 'Success'});
};


module.exports = {
  getPastPurchases,
  getFutureTickets,
  createPurchase,
};
