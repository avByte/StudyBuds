// src/Navbar.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import logo from "./studybuds-logo.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Study Buds Logo" className="logo" />
        <span className="logo-text">Study Buds</span>
      </div>
      <div className="nav-links">
        <div className="nav-left-links">
          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/create-account">Create Account</Link>
            </>
          ) : (
            <>
              <Link to="/calendar">Calendar</Link>
              <Link to="/match">Find Study Buddies</Link>
              <Link to="/chat">Chat</Link>
              <Link to="/find-partners">Potential Buddies</Link>
            </>
          )}
        </div>

        {user && (
          <div className="nav-right-links">
            <Link to="/questionnaire" className="retake-questionnaire">Retake Questionnaire</Link>
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;