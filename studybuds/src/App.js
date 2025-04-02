// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CreateAccount from "./CreateAccount";
import Login from "./Login";
import Questionnaire from "./Questionnaire";
import Calendar from "./Calendar";
import MatchMaking from "./matchMaking";
import Chat from "./chat";
import "./App.css";
import logo from "./studybuds-logo.png";
import Navbar from "./Navbar";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute requireQuestionnaire={true}>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questionnaire"
            element={
              <ProtectedRoute>
                <Questionnaire />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match"
            element={
              <ProtectedRoute requireQuestionnaire={true}>
                <MatchMaking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute requireQuestionnaire={true}>
                <Chat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
