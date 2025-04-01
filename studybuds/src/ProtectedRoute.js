// src/ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function ProtectedRoute({ children }) {
    const [user, setUser] = useState(undefined); // undefined means "still checking"


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
        }, []);

  if (user === undefined) return null; // or a loading spinner
  if (!user) return <Navigate to="/login" />;

  return children;
}

export default ProtectedRoute;