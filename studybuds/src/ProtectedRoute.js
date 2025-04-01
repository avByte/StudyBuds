// src/ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

function ProtectedRoute({ children, requireQuestionnaire = false }) {
    const [user, setUser] = useState(undefined); // undefined means "still checking"
    const [questionnaireCompleted, setQuestionnaireCompleted] = useState(undefined);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser && requireQuestionnaire) {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setQuestionnaireCompleted(data?.questionnaireCompleted ?? false);
                } else {
                    setQuestionnaireCompleted(false);
                }
            }
        });
        return () => unsubscribe();
    }, [requireQuestionnaire]);

  if (user === undefined || (requireQuestionnaire && questionnaireCompleted === undefined)) {
    return null; // or a loading spinner
  }
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (requireQuestionnaire && !questionnaireCompleted) {
    return <Navigate to="/questionnaire" />;
  }

  return children;
}

export default ProtectedRoute;