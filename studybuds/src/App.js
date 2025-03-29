// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CreateAccount from "./CreateAccount";
import Login from "./Login";
import "./App.css";


function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/login">Login</Link> |{" "}
          <Link to="/create-account">Create Account</Link>
        </nav>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

