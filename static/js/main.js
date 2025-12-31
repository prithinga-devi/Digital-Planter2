import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en';
const provider = new GoogleAuthProvider();

// --- UI LOGIC (Sliding Panels) ---
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
    e.preventDefault();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log("Google Sign-In Success:", user.email);
            window.location.href = "logged.html";
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
                const user = userCredential.user;
                console.log("Login Success:", user.email);
                window.location.href = "logged.html";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Login Error:", errorCode, errorMessage);
                if (errorCode === 'auth/invalid-login-credentials' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
                    alert("Invalid email or password.");
                } else {
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
        const username = document.getElementById('signup-username').value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                updateProfile(user, { displayName: username }).then(() => {
                    console.log("Profile updated");
                    window.location.href = "logged.html";
                }).catch((error) => {
                    console.error("Error updating profile:", error);
                    window.location.href = "logged.html";
                });
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Signup Error:", errorCode, errorMessage);
                alert("Sign up failed: " + errorMessage);
            });
    });
}

// --- Global Logout ---
window.logout = async () => {
    try {
        await auth.signOut();
        console.log("Logged out successfully");
        window.location.reload();
    } catch (error) {
        console.error("Logout Error:", error);
        alert("Logout failed: " + error.message);
    }
};

// --- Auth State Observer for index.html UI ---
onAuthStateChanged(auth, (user) => {
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');

    if (user) {
        if (logoutBtn) logoutBtn.style.display = 'flex';
        if (loginBtn) loginBtn.style.display = 'none';
        console.log("UI: Authenticated state active");
    } else {
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'flex';
        console.log("UI: Deauthenticated state active");
    }
});
