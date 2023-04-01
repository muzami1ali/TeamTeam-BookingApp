import React, {Component} from "react";
import '../../styles/EventCard.css';
import PropTypes from 'prop-types';

// This component is used to display the event cards on the home page and the events page.
// It is used in the Events component. 
interface Props {
  specificEvent: {
    banner: string;
    name: string;
    description: string;
    date: string;
    location: string;
    society: {
      name: string;
    };
  };
}

class Event extends Component<Props> { 

  d = new Date(this.props.specificEvent.date);
  
  // This function is used to render the component. 
  render() {
    return (
      <div className="innerEventCard" data-testid = "eventCardID">
        <div className="imageCard">
          <div className="image" data-testid = "eventImageID" style={{backgroundImage: `url(${this.props.specificEvent.banner})`}}></div>
          <div className="eventName" data-testid = "eventNameID">{this.props.specificEvent.name}</div>
          <div className="hiddenUntilHover">
          <div className="imageOverlay"></div>
            <div className="societyName">{this.props.specificEvent.society.name}</div>
            <div className="eventDesc">{this.props.specificEvent.description}</div>
            <div className="locationTime">{this.props.specificEvent.location}<br />{this.d.toDateString()}</div>
          </div>
        </div>
      </div>
    );
  }
}


// This is used to check the type of the props passed to the component.

// Event.propTypes = {
//   specificEvent: PropTypes.shape({
//     banner: PropTypes.string.isRequired,
//     name: PropTypes.string.isRequired,
//     description: PropTypes.string.isRequired,
//     date: PropTypes.string.isRequired,
//     location: PropTypes.string.isRequired,
//     society: PropTypes.shape({
//       name: PropTypes.string.isRequired,
//     }).isRequired,
//   }).isRequired,
// };
export default Event;