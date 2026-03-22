import { initializeApp } from "firebase/app"
import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    setPersistence,
    inMemoryPersistence,
} from "firebase/auth"

// Same Firebase project as other Bluebird apps
const firebaseConfig = {
    apiKey: "REMOVED_API_KEY",
    authDomain: "bluebird-documentation.firebaseapp.com",
    projectId: "bluebird-documentation",
    storageBucket: "bluebird-documentation.appspot.com",
    messagingSenderId: "65293049615",
    appId: "1:65293049615:web:077b2757723651e3cda87a",
    measurementId: "G-0Z24RWEJ2Y"
};

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// Use in-memory persistence — IndexedDB is unavailable in the WebKit
// subprocess sandbox inside a Flatpak container.
setPersistence(auth, inMemoryPersistence)

const loginWithEmailAndPassword = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
}

const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email)
}

const logout = async () => {
    await signOut(auth)
}

export {
    auth,
    loginWithEmailAndPassword,
    resetPassword,
    logout,
}
