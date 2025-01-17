import React from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { useParams } from "react-router-dom";
const jwtController = require("../../utils/jwt.ts");
import "../../styles/index.css";

// A component for the edit event page which allows the user to edit the details of an event they have created previously.
function EditEvents() {
  return (
    <div className="container" style={{ marginTop: "80px" }}>
      <div className="underlay"></div>
      <h1>Edit Event</h1>
      <Formik
        initialValues={{
          eventId: parseInt(useParams().id!),
          eventName: "",
          description: "",
          date: "",
          location: "",
          time: "",
        }}
        // Validation for the form fields using Yup.
        validationSchema={Yup.object({
          eventName: Yup.string()
            .trim()
            .min(3, "Event name must be at least 3 characters."),
          description: Yup.string()
            .trim()
            .min(30, "Event description must be at least 30 characters."),
          date: Yup.date().min(new Date(), "Event date must be in the future."),
          location: Yup.string()
            .trim()
            .min(3, "Event location must be at least 3 characters."),
          time: Yup.string(),
        })}
        onSubmit={(value) => {
          if (
            value.eventName === "" &&
            value.description === "" &&
            value.date === "" &&
            value.location === "" &&
            value.time === ""
          ) {
            alert("Please fill in at least one field to update the event.");
            return;
          }

          if (value.date !== "" && value.time === "") {
            alert("Please fill in the time of the event.");
            return;
          }

          if (value.date === "" && value.time !== "") {
            alert("Please fill in the date of the event.");
            return;
          }
          // Create an event object to send to the backend.
          const event = {
            eventId: value.eventId,
            name: value.eventName,
            description: value.description,
            date:
              value.date === "" || value.time === ""
                ? ""
                : value.date + "T" + value.time + ":00.000Z",
            location: value.location,
          };
          fetch(process.env.REACT_APP_API_URL + "/events/update", {
            // Send the event object to the backend to update the event.
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + jwtController.getToken(),
            },
            body: JSON.stringify(event),
          })
            .then((response) => {
              if (response.status === 200) {
                response.json().then((data) => {
                  alert("Event updated successfully!");
                  window.location.href =
                    "/event-details?eventId=" + data.event.id;
                });
              } else {
                alert("Error updating event. Please try again.");
              }
            })
            .catch((error) => {
              console.log(error);
            });
        }}
        // Render the form fields and validation errors.
      >
        {(formikProps) => (
          <form onSubmit={formikProps.handleSubmit}>
            <div className="field">
              <label>Name:</label>
              <input
                name="eventName"
                value={formikProps.values.eventName}
                onChange={formikProps.handleChange}
                type="text"
                onBlur={formikProps.handleBlur}
              />
              {formikProps.touched.eventName && formikProps.errors.eventName ? (
                <label className="errortext" htmlFor="eventName">
                  {formikProps.errors.eventName}
                  <br />
                </label>
              ) : (
                ""
              )}
            </div>
            <div className="field">
              <label>Description:</label>
              <textarea
                name="description"
                value={formikProps.values.description}
                onChange={formikProps.handleChange}
                onBlur={formikProps.handleBlur}
                rows={8}
                cols={173}
              ></textarea>
              {formikProps.touched.description &&
              formikProps.errors.description ? (
                <label className="errortext" htmlFor="description">
                  {formikProps.errors.description}
                  <br />
                </label>
              ) : (
                ""
              )}
            </div>
            <div className="field">
              <label>Location:</label>
              <input
                name="location"
                value={formikProps.values.location}
                onChange={formikProps.handleChange}
                type="text"
                onBlur={formikProps.handleBlur}
              />
              {formikProps.touched.location && formikProps.errors.location ? (
                <label className="errortext" htmlFor="location">
                  {formikProps.errors.location}
                  <br />
                </label>
              ) : (
                ""
              )}
            </div>
            <div className="field">
              <label>Date:</label>
              <input
                name="date"
                value={formikProps.values.date}
                onChange={formikProps.handleChange}
                type="date"
                onBlur={formikProps.handleBlur}
              />
              {formikProps.touched.date && formikProps.errors.date ? (
                <label className="errortext" htmlFor="date">
                  {formikProps.errors.date}
                  <br />
                </label>
              ) : (
                ""
              )}
            </div>
            <div className="field">
              <label>Time:</label>
              <input
                name="time"
                value={formikProps.values.time}
                onChange={formikProps.handleChange}
                type="time"
                onBlur={formikProps.handleBlur}
              />
            </div>
            {formikProps.touched.time && formikProps.errors.time ? (
              <label className="errortext" htmlFor="time">
                {formikProps.errors.time}
                <br />
              </label>
            ) : (
              ""
            )}
            <button
              type="submit"
              className="button"
              style={{ marginTop: "15px" }}
            >
              Update Event
            </button>
          </form>
        )}
      </Formik>
    </div>
  );
}

export default EditEvents;
