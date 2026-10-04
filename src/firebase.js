import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCZ49TDQjIgHoOfna8yHg01W-Tc5D5Eidk",
  authDomain: "notsexyfitness-72d40.firebaseapp.com",
  projectId: "notsexyfitness-72d40",
  storageBucket: "notsexyfitness-72d40.firebasestorage.app",
  messagingSenderId: "1057577322874",
  appId: "1:1057577322874:web:57f0eb89fda9acacf8aec3"
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

export const auth = firebase.auth()
export const db = firebase.firestore()
export const googleProvider = new firebase.auth.GoogleAuthProvider()
