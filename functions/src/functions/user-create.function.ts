import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// tslint:disable-next-line: variable-name
export const onUserCreate_UserProfile_Create =
  functions.auth.user().onCreate(
    (user: admin.auth.UserRecord, context) => {
      const { uid, email, displayName, photoURL } = user;

      admin.database().ref('users/' + user.uid + '/profile').set({ uid, email, displayName, photoURL });

    });
