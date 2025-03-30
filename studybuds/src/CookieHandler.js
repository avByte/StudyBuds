/*
CookieHandler.js
backend file for handling cookies
look i'm just messing around tbh
*/

// imports
import Cookies from 'js-cookie';
import React, { useState } from "react";
import { auth } from "./firebase";

// removes the authentication token
// literally all it does
function authLogout(){
    Cookies.remove('authToken');
}

// function for checking authentication
// most likely use case is for redirecting users to the login page
// returns true if an authentication token exists; false otherwise
function authCheck(){
    return Cookies.get('authToken') != null;
}