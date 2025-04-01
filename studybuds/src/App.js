// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CreateAccount from "./CreateAccount";
import Login from "./Login";
import Questionnaire from "./Questionnaire";
import Calendar from "./Calendar";
import FindPartners from "./FindPartners";
import "./App.css";
import logo from "./studybuds-logo.png";

function App() {
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
            <Link to="/calendar">Calendar</Link>
            <Link to="/find-partners">Find Partners</Link>
          </div>
        </nav>
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/find-partners" element={<FindPartners />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
