// EVENTS CONTROLLER
const prisma = require('../../prisma/prisma.js');
const auth = require('../utils/jwt_auth.js');

async function getTickets(req, res) {
  // (user token)

  let decoded = null;

  try {
    decoded = await auth.authenticate(req);
  } catch (err) {
    return res.status(401).send({message: 'Unauthorised'});
  }

  const userId = decoded.id;

  // Check if user exists
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).send({message: 'User not found'});
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      userId: userId,
    },
  });

  res.status(200).send(tickets);
}

/**
 * Create tickets function for a user, the request should contain a JSON object with the following properties:
 * { "ticketTypeId": [ticket_type_id] }
 * { "quantity": [quantity] }
 *
 * And the user token in the header
 *
 * @param {Request} req
 * @param {Response} res
 * @return response
 */
async function createTickets(req, res) {
  // (user token, ticket type ID, quantity)
  let decoded = null;
  try {
    decoded = await auth.authenticate(req);
  } catch (err) {
    return res.status(401).send({message: 'Unauthorised'});
  }

  if (req.body === undefined || req.body.ticketTypeId === undefined || req.body.quantity === undefined) {
    return res.status(400).send({message: 'Missing Body'});
  }
  if (req.body.quantity < 1) return res.status(400).send({message: 'Invalid Quantity'});

  ticketType = await prisma.ticketType.findFirst({
    where: {
      id: req.body.ticketTypeID,
    },
  });

  if (!ticketType) return res.status(400).send({message: 'Invalid Ticket Type'});

  for (let i = 0; i < req.body.quantity; i++) {
    prisma.create();
  }

  res.status(200).send();
}

async function useTicket(req, res) {
  let decoded = null;

  try {
    decoded = await auth.authenticate(req);
  } catch (err) {
    return res.status(401).send({message: 'Unauthorised'});
  }

  // In order for a user to mark a ticket as used, the request should come from a user who is a member of the committee of the society that the event belongs to

  const user = await prisma.user.findFirst({
    where: {
      id: decoded.id,
    },
  });

  if (!user) return res.status(404).send({message: 'User not found'});

  if (req.body === undefined || req.body.ticketId === undefined) {
    return res.status(400).send({message: 'Missing Body'});
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: req.body.ticketId,
    },
    include: {
      event: {
        include: {
          society: {
            include: {
              committee: true,
            },
          },
        },
      },
    },
  });

  const committee = ticket.event.society.committee;

  // For each member of the committee, check if the user is a member of the committee
  let isMember = false;

  for (let i = 0; i < committee.length; i++) {
    if (committee[i].userId === user.id) {
      isMember = true;
      break;
    }
  }

  console.log(isMember);

  if (!isMember) return res.status(401).send({message: 'Unauthorised'});

  if (!ticket) return res.status(400).send({message: 'Invalid Ticket ID'});

  if (ticket.status === 'USED') {
    return res.status(400).send({message: 'Ticket already used'});
  }

  const updatedTicket = await prisma.ticket.update({
    where: {
      id: req.body.ticketId,
    },
    data: {
      status: 'USED',
    },
  });

  res.status(200).send(updatedTicket);
}


module.exports = {
  getTickets,
  createTickets,
  useTicket,
};
