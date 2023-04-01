import React, { useState, useEffect } from "react";
import "../../styles/Purchase.css";
const jwtController = require("../../utils/jwt.js");
import { QRCodeSVG } from "qrcode.react";
import { any } from "cypress/types/bluebird";

// A component for the purchase page which displays the tickets that the user has purchased and allows them to be downloaded as a QR code.
// The user can also view the tickets that they have purchased in the future.
interface Purchase{
  id: string;
  date: string;
  total: number;
  paymentMethod: string;
  status: string;
  userId: number;
  eventId: number;
  isArchived: boolean;
  tickets: Ticket[];
  event: Event;
}

interface Ticket{
  id: number;
  ticketData: string;
  status: string;
  userId: number;
  eventId: number;
  ticketTypeId: number;
  purchaseId: number;
  isArchived: boolean;
}

interface Event{
  id: number;
  name: string;
  date: string;
  description: string;
  location: string;
  isArchived: boolean;
  banner: string;
  societyId: number;
}

const FutureTickets = () => {
  const [futureTickets, setFutureTickets] = useState([]);
  const [pastTickets, setPastTickets] = useState([]);

  // Get the future tickets from the backend.
  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "/purchase/future", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + jwtController.getToken(),
      },
    })
      //present events from lowest to highest date
      .then((response) => response.json())
      .then((data) => {
        const sortedTickets = data.futureTickets.sort(
          (a:Purchase, b:Purchase) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime()
        );
        setFutureTickets(sortedTickets);
      });

    // Get the past tickets from the backend.

    fetch(process.env.REACT_APP_API_URL + "/purchase", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + jwtController.getToken(),
      },
    })
      //present events from lowest to highest date
      .then((response) => response.json())
      .then((data) => {
        const sortedTickets = data.pastTickets.sort(
          (a:Purchase, b:Purchase) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime()
        );
        setPastTickets(sortedTickets);
      });
  }, []);

  // Display the future tickets and past tickets in a table.

  return (
    <div
      data-testid="Purchase"
      className="page-container"
      style={{ padding: "5px" }}
    >
      <div className="underlay"></div>
      <h1>Past Event Purchases</h1>
      <table className="purchase">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Event Date</th>
            <th>Tickets</th>
          </tr>
        </thead>
        <tbody>
          {pastTickets.length !== 0 &&
            pastTickets.map((ticket:Purchase) => (
              <tr data-testid={ticket.id} key={ticket.id}>
                <td>
                  <a href={"/event-details?eventId=" + ticket.event.id}>
                    {ticket.event.name}
                  </a>
                </td>
                <td>{new Date(ticket.event.date).toLocaleDateString()}</td>
                <td>
                  {ticket.tickets.map((ticket) => (
                    <div key={ticket.id}>
                      <span>Ticket ID: {ticket.id}</span>
                      <br />
                      <QRCodeSVG value={ticket.ticketData} />
                    </div>
                  ))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <h1>Upcoming Event Purchases</h1>
      <table className="purchase">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Event Date</th>
            <th>Tickets</th>
          </tr>
        </thead>
        <tbody>
          {futureTickets.length !== 0 &&
            futureTickets.map((ticket:Purchase) => (
              <tr data-testid={ticket.id} key={ticket.id}>
                <td>
                  <a href={"/event-details?eventId=" + ticket.event.id}>
                    {ticket.event.name}
                  </a>
                </td>
                <td>{new Date(ticket.event.date).toLocaleDateString()}</td>
                <td>
                  {ticket.tickets.map((ticket) => (
                    <div key={ticket.id}>
                      <span>Ticket ID: {ticket.id}</span>
                      <br />
                      <QRCodeSVG value={ticket.ticketData} />
                    </div>
                  ))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default FutureTickets;
