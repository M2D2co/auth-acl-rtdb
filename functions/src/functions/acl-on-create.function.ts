import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// tslint:disable-next-line: variable-name
export const onDataCreate_ACL_Create =
  functions.database.ref('data/{resourceId}').onCreate(async (snapshot, context) => {
    const { resourceId } = context.params;
    const { createdBy } = snapshot.val();
    const value = {
      uid: createdBy,
      createdBy,
      createdOn: admin.database.ServerValue.TIMESTAMP,
    };

    const waitlist: Promise<any>[] = [];
    ['admin', 'create', 'read', 'update', 'delete'].forEach(action => {
      waitlist.push(
        admin.database().ref(`/acl/${resourceId}/${action}/${createdBy}`).set(value)
      );
    });

    // Wait for completion
    await Promise.all(waitlist);
  });
