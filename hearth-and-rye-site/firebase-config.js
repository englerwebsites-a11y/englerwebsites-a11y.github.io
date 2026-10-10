const firebaseConfig = {
  apiKey: 'AIzaSyCRkLM8QH4o-sTQ0QTRv3JWvo3uVfBJlaI',
  authDomain: 'hearthandryedemo.firebaseapp.com',
  databaseURL: 'https://hearthandryedemo-default-rtdb.firebaseio.com',
  projectId: 'hearthandryedemo',
  storageBucket: 'hearthandryedemo.firebasestorage.app',
  messagingSenderId: '852499869514',
  appId: '1:852499869514:web:69d2d0f5a89defc4c81bb3',
  measurementId: 'G-ZVELDMWXX2'
};

// Skip quietly if the Firebase scripts were blocked or failed to load;
// the rest of the site still works without accounts.
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}