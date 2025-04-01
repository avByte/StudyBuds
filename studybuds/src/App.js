// src/App.js

// frontend imports
import "./App.css";
import CreateAccount from "./CreateAccount";
import Login from "./Login";
import Logout from "./Logout";
import logo from "./studybuds-logo.png";
import Questionnaire from "./Questionnaire";

// backend imports
import React from "react";
import { HashRouter as Router, Routes, Route, Link } from "react-router-dom";
import { authCheck } from "./CookieHandler";

function App() {
  if (authCheck()) {
    return (
      <Router>
        <div className="App">
          <nav className="navbar">
            <div className="nav-left">
              <img src={logo} alt="Study Buds Logo" className="logo" />
              <span className="logo-text">Study Buds</span>
            </div>
            <div className="nav-links">
              <Link to="/questionnaire">Questionnaire</Link>
              <Link to="/logout">Logout</Link>
            </div>
          </nav>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/" element={<Login />} />
          </Routes>
        </div>
      </Router>
    );
  } else {
    return (
      <Router>
        <div className="App">
          <nav className="navbar">
            <div className="nav-left">
              <img src={logo} alt="Study Buds Logo" className="logo" />
              <span className="logo-text">Study Buds</span>
            </div>
            <div className="nav-links">
              <Link to="/login">Login</Link>
              <Link to="/create-account">Create Account</Link>
            </div>
          </nav>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/" element={<Login />} />
          </Routes>
        </div>
      </Router>
    );
  }
}

export default App;
