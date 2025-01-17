import React from "react";
import PropTypes from "prop-types";
import "../../../styles/index.css";

// This is a functional component that renders a form to add a member to a society
const AddCommitteeMember = (props:any) => {
  const [value, setValue] = React.useState("");

  const handleSubmit = (event:any) => {
    event.preventDefault();
    props.addMember(value);
    setValue("");
  };

  return (
    <form
      onSubmit={(event) => handleSubmit(event)}
      style={{
        marginLeft: "8px",
      }}
    >
      <input
        value={value}
        type="email"
        placeholder="Enter member's email"
        onChange={(event) => setValue(event.target.value)}
        required
        style={{
          borderRadius: 3,
        }}
        className="addmemberinput"
      />
      <button
        className="button"
        style={{ marginLeft: "8px", marginBottom: "8px" }}
      >
        Add Member
      </button>
    </form>
  );
};

AddCommitteeMember.propTypes = {
  addMember: PropTypes.func,
};

export default AddCommitteeMember;
