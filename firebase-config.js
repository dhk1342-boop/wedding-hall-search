(function initializeWeddingpickFirebase() {
  if (typeof window === "undefined" || typeof window.firebase === "undefined") {
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyC0wu40fkTPZHePn6rVDC1CNip-SthrE-Q",
    authDomain: "wedding-hall-pick.firebaseapp.com",
    databaseURL: "https://wedding-hall-pick-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "wedding-hall-pick",
    storageBucket: "wedding-hall-pick.firebasestorage.app",
    messagingSenderId: "979522921421",
    appId: "1:979522921421:web:97f1c6ae3d073b9b4a5a84",
    measurementId: "G-LJ4XEX9EH9",
  };

  window.WEDDINGPICK_FIREBASE_CONFIG = firebaseConfig;

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }

  window.WEDDINGPICK_FIREBASE_APP = window.firebase.app();
  window.WEDDINGPICK_FIREBASE_DB = window.firebase.database();
})();
