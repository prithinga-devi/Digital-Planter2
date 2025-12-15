import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();

// --- UI LOGIC (Sliding Panels) ---
// (Keeping your existing UI logic for the sliding panels)
const mainContainer = document.getElementById('main-container');
const mainTitle = document.getElementById('main-title');
const showSignupLink = document.getElementById('show-signup-link');
const showLoginLink = document.getElementById('show-login-link');

function switchToSignup() {
    if (mainContainer) mainContainer.classList.add('active');
    if (mainTitle) mainTitle.textContent = 'SIGN UP';
}

function switchToLogin() {
    if (mainContainer) mainContainer.classList.remove('active');
    if (mainTitle) mainTitle.textContent = 'LOGIN';
}

if (showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchToSignup();
    });
}

if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchToLogin();
    });
}


// --- AUTHENTICATION LOGIC ---

// 1. Google Sign-In
const handleGoogleAuth = (e) => {
    e.preventDefault(); // Prevent form submission if inside a form

    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log("Google Sign-In Success:", user.email);
            // Redirect to the logged-in area
            window.location.href = "/logged";
        }).catch((error) => {
            console.error("Google Auth Error:", error);
            alert("Authentication failed: " + error.message);
        });
};

const googleLoginBtn = document.getElementById('google-login-btn');
const googleSignupBtn = document.getElementById('google-signup-btn');

if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleAuth);
if (googleSignupBtn) googleSignupBtn.addEventListener('click', handleGoogleAuth);

// 2. Email/Password Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                console.log("Login Success:", user.email);
                window.location.href = "/logged";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Login Error:", errorCode, errorMessage);

                if (errorCode === 'auth/operation-not-allowed') {
                    alert("Error: Email/Password login is not enabled in Firebase Console. Please enable it.");
                } else {
                    console.error("Login Error:", errorCode, errorMessage);
                    alert("Login failed: " + errorMessage);
                }
            });
    });
}

// 3. Email/Password Sign Up
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const username = document.getElementById('signup-username').value; // Get username

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                console.log("Signup Success:", user.email);

                // Update Profile with Username
                updateProfile(user, {
                    displayName: username
                }).then(() => {
                    console.log("Profile updated with username:", username);
                    alert("Account created! Redirecting...");
                    window.location.href = "/logged";
                }).catch((error) => {
                    console.error("Error updating profile:", error);
                    // Still redirect even if profile update fails, but warn
                    alert("Account created but failed to set username. Redirecting...");
                    window.location.href = "/logged";
                });

            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/email-already-in-use') {
                    alert("This email is already registered. Please Login instead.");
                    // Automatically switch to login panel
                    switchToLogin();
                } else if (errorCode === 'auth/operation-not-allowed') {
                    alert("Error: Email/Password sign-in is not enabled in Firebase Console. Please enable it.");
                } else {
                    console.error("Signup Error:", errorCode, errorMessage);
                    alert("Sign up failed: " + errorMessage);
                }
            });
    });
}
