import React, { useState } from "react";
import PropTypes from "prop-types";
import "../../styles/Navbar.css";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import basket from "../../assets/basket.png";
import burger from "../../assets/burger.png";

//Create a navbar component

function Navbar(props:any) {
  const [notMenuClass, setNotMenuClass] = useState("menu");
  const [menuActive, setMenuActive] = useState<Boolean>();
  const [menuClass, setMenuClass] = useState("");

  const toggleMenu = () => {
    menuActive ? setMenuClass("") : setMenuClass("menu");
    menuActive ? setNotMenuClass("dead") : setNotMenuClass("");
    setMenuActive(!menuActive);
  };
  const closeMenu = () => {
    setMenuClass("");
    setNotMenuClass("dead");
    setMenuActive(!menuActive);
  };
  const openMenu = () => {
    setMenuClass("menu");
    setNotMenuClass("");
    setMenuActive(!menuActive);
  };

  return (
    <div className="nav-container">
      <nav className="navbar">
        <ul className="left">
          <Link to="/">
            <li className="left">
              <img src={logo} alt="Logo"></img> Ticketopia
            </li>
          </Link>
          <Link to="/">
            <li>Events</li>
          </Link>
          <Link to="/societies">
            <li>Societies</li>
          </Link>
          <Link to="/contact">
            <li>Contact</li>
          </Link>
        </ul>
        {props.isLoggedIn ? (
          <ul className="right">
            <Link to="/basket">
              <li>
                <img src={basket} alt="Basket"></img>
              </li>
            </Link>
            <Link to="/logout">
              <li>Logout</li>
            </Link>
            <Link to="/tickets">
              <li>Tickets</li>
            </Link>
            <Link to="/create-event">
              <li>Create Event</li>
            </Link>
          </ul>
        ) : (
          <ul className="right">
            <Link to="/basket">
              <li>
                <img src={basket} alt="Basket"></img>
              </li>
            </Link>
            <Link to="/login">
              <li>Login / SignUp</li>
            </Link>
          </ul>
        )}
      </nav>
      <nav className="mobile-navbar">
        <ul className="left">
          <Link to="/">
            <li className="left">
              <img src={logo} alt="Logo"></img>
            </li>
          </Link>
        </ul>
        <ul className="right">
          <a
            onClick={() => {
              openMenu();
            }}
          >
            <li>
              <img src={burger} alt="Basket"></img>
            </li>
          </a>
        </ul>
        <div
          id="notMenu"
          className={notMenuClass}
          onClick={() => {
            closeMenu();
          }}
        ></div>
        <div id="menu" className={menuClass}>
          <ul className="top">
            <a
              onClick={() => {
                toggleMenu();
              }}
            >
              <li>Close</li>
            </a>
            <Link
              onClick={() => {
                toggleMenu();
              }}
              to="/"
            >
              <li>Events</li>
            </Link>
            <Link
              onClick={() => {
                toggleMenu();
              }}
              to="/societies"
            >
              <li>Societies</li>
            </Link>
            <Link
              onClick={() => {
                toggleMenu();
              }}
              to="/contact"
            >
              <li>Contact</li>
            </Link>
          </ul>
          <div className="menuSpacing"></div>
          {props.isLoggedIn ? (
            <ul className="bottom">
              <Link
                onClick={() => {
                  toggleMenu();
                }}
                to="/tickets"
              >
                <li>Tickets</li>
              </Link>
              <Link
                onClick={() => {
                  toggleMenu();
                }}
                to="/basket"
              >
                <li>Basket</li>
              </Link>
              <Link
                onClick={() => {
                  toggleMenu();
                }}
                to="/logout"
              >
                <li>Logout</li>
              </Link>
            </ul>
          ) : (
            <ul className="bottom">
              <Link
                onClick={() => {
                  toggleMenu();
                }}
                to="/login"
              >
                <li>Login / SignUp</li>
              </Link>
              <Link
                onClick={() => {
                  toggleMenu();
                }}
                to="/basket"
              >
                <li>Basket</li>
              </Link>
            </ul>
          )}
        </div>
      </nav>
    </div>
  );
}

Navbar.propTypes = {
  isLoggedIn: PropTypes.bool,
};

export default Navbar;
