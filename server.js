'use strict';

// Modules imports
const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Load config file
const config = require('./config.json');

// Firebase Setup
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

// const SERVER_HOST = '192.168.1.102';
// const SERVER_PORT = 8000;

// Linkedin OAuth 2 setup
const credentials = {
  client: {
    id: config.linkedin.clientId,
    secret: config.linkedin.clientSecret
  },
  auth: {
    tokenHost: 'https://www.linkedin.com',
      tokenPath: '/oauth/v2/accessToken',
      authorizePath: '/oauth/v2/authorization'
  }
};
const oauth2 = require('simple-oauth2').create(credentials);

// Path to the OAuth handlers.
const OAUTH_REDIRECT_PATH = '/redirect';
const OAUTH_CALLBACK_PATH = '/linkedin-callback';
const OAUTH_MOBILE_CALLBACK_PATH = 'https://auth.expo.io/@alexbidiuk/binder';
const OAUTH_CODE_EXCHANGE_PATH = '/linkedin-mobile-exchange-code';

// Custom URI scheme for Android and iOS apps.
const APP_CUSTOM_SCHEME = 'linkedin-sign-in-demo';

// Linkedin scopes requested.
const OAUTH_SCOPES = 'basic';

const options = {
  ejectUnauthorized: false
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// ExpressJS setup
const app = express(options);
app.enable('trust proxy');
app.use(express.static('public'));
app.use(express.static('node_modules/instafeed.js'));
app.use(cookieParser());

/**
 * Redirects the User to the Linkedin authentication consent screen. Also the 'state' cookie is set for later state
 * verification.
 */
app.get(OAUTH_REDIRECT_PATH, (req, res) => {
  const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
  console.log('Setting state cookie for verification:', state);
  const secureCookie = req.get('host').indexOf('localhost:') !== 0;
  console.log('Need a secure cookie (i.e. not on localhost)?', secureCookie);
  res.cookie('state', state, {maxAge: 3600000, secure: secureCookie, httpOnly: true});
  const redirectUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: `${req.protocol}://${req.get('host')}${OAUTH_CODE_EXCHANGE_PATH}`,
    state: state,
    scope: OAUTH_SCOPES
  });
  console.log('Redirecting to:', redirectUri);
  res.redirect(redirectUri);
});



/**
 * Passes the auth code to your Mobile application by redirecting to a custom scheme URL. This serves as a fallback in
 * case App Link/Universal Links are not supported on the device.
 * Native Mobile apps should use this callback.
 */
app.get(OAUTH_CALLBACK_PATH, (req, res) => {
  res.redirect(`${OAUTH_MOBILE_CALLBACK_PATH}?${req.originalUrl.split('?')[1]}`);
});

/**
 * Exchanges a given Linkedin auth code passed in the 'code' URL query parameter for a Firebase auth token and returns
 * a Firebase Custom Auth token, Linkedin access token and user identity as a JSON object.
 * This endpoint is meant to be used by native mobile clients only since no Session Fixation attacks checks are done.
 */
app.get(OAUTH_CODE_EXCHANGE_PATH, (req, res) => {
  console.log('Received auth code:', req.query.code);
  oauth2.authorizationCode.getToken({
    code: req.query.code,
    redirect_uri: `${req.protocol}://${req.get('host')}${OAUTH_CALLBACK_PATH}`
  }).then(results => {
    console.log('Auth code exchange result received:', results);

    // Create a Firebase Account and get the custom Auth Token.
    createFirebaseAccount(results.user.id, results.user.full_name,
        results.user.profile_picture, firebaseToken).then(firebaseToken => {
      // Send the custom token, access token and profile data as a JSON object.
      res.send(firebaseToken);
    });
  }).catch((error)=>{
      res.send(error.context);
      console.warn(error);
  })
});



function createFirebaseAccount(linkedinID, displayName, photoURL, accessToken) {
  // The UID we'll assign to the user.
  const uid = `linkedin:${linkedinID}`;

  // Save the access token tot he Firebase Realtime Database.
  const databaseTask = admin.database().ref(`/linkedinAccessToken/${uid}`)
      .set(accessToken);

  // Create or update the user account.
  const userCreationTask = admin.auth().updateUser(uid, {
    displayName: displayName,
    photoURL: photoURL
  }).catch(error => {
    // If user does not exists we create it.
    if (error.code === 'auth/user-not-found') {
      return admin.auth().createUser({
        uid: uid,
        displayName: displayName,
        photoURL: photoURL
      });
    }
    throw error;
  });

  // Wait for all async task to complete then generate and return a custom auth token.
  return Promise.all([userCreationTask, databaseTask]).then(() => {
    // Create a Firebase custom auth token.
    const token = admin.auth().createCustomToken(uid);
    console.log('Created Custom token for UID "', uid, '" Token:', token);
    return token;
  });
}

// Start the server
var port = process.env.PORT || 8000;
var server = app.listen(port);
