/*
|   src/CookieHandler.js
|   all this does is log the user out
|   love, jordan <3
*/

// imports
import React, { useState } from "react";
import { authLogout } from "./CookieHandler";
import { auth } from "./firebase";
import { useNavigate} from "react-router-dom";

function Logout(){
    // constants
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // attempts to log out, delete the authentication token, then navigates to login
    try {
        auth.signOut(auth).then(() => {
            authLogout();
            navigate("/login");
        })
    } catch (err) {
        setError(err.message);
    }
}

export default Logout;