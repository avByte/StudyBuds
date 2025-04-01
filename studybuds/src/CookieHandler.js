/*
|   src/CookieHandler.js
|   backend file for handling cookies
|   look i'm just messing around tbh
|   love, jordan <3
*/

// imports
import Cookies from 'js-cookie';

// function for logging in
// inshallah this stores the authorization token
function authLogin(userCredentials){
    const user = userCredentials.user;

    // build login cookie
    if (user){
        const idToken = user.getIdToken();
        Cookies.set("authToken", idToken, {secure: true, sameSite: "Strict"});
    }
}

// function for checking authentication
// most likely use case is for redirecting users to the login page
// returns true if an authentication token exists; false otherwise
function authCheck(){
    return Cookies.get('authToken') != null;
}

// function to force users to login
// use case for security reasons
function authRedirect(){
    const navigate = useNavigate();
    useEffect(() => {
        if (!authCheck()) {
            navigate("/login");
        }
    }, [navigate]);
}

// removes the authentication token
// literally all it does
function authLogout(){
    Cookies.remove('authToken');
}