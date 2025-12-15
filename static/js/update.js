import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function updateUserProfile(user) {
    const userName = user.displayName;
    const userEmail = user.email;
    const userProfilePicture = user.photoURL;
    console.log(userEmail);

    // Note: ID in HTML is 'username', user provided code used 'userName'
    const nameEl = document.getElementById("username");
    if (nameEl) nameEl.textContent = userName;

    const emailEl = document.getElementById("userEmail");
    if (emailEl) emailEl.textContent = userEmail;

    const picEl = document.getElementById("userProfilePicture");
    if (picEl && userProfilePicture) {
        picEl.src = userProfilePicture;
        picEl.style.display = 'inline-block';
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        updateUserProfile(user);
    } else {
        // Redirect to home if not logged in or after logout
        window.location.href = '/';
    }
});

// Logout Listener (keeping existing functionality)
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // Redirect happens via onAuthStateChanged or here
            window.location.href = "/";
        } catch (error) {
            console.error("Logout Error:", error);
            alert("Error logging out: " + error.message);
        }
    });
}
