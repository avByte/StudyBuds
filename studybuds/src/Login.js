// src/Login.js

// we do a little tomfoolery
// external package that's installed
import Cookies from 'js-cookie';

// imports
import React, { useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom"; 

function Login() {
  // constants
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); 

  // handleLogin function for logging in and routing
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      // attempt to login
      const userCredentials = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredentials.user;

      // build login cookie
      if (user){
        const idToken = await user.getIdToken();
        Cookies.set("authToken", idToken, {secure: true, sameSite: "Strict"});
      }

      // exit login and navigate to calendar
      navigate("/calendar"); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Log In</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

export default Login;
