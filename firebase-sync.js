(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.SydneyFirebaseSync = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
  function createFirebaseCollaborationSync(options) {
    const config = {
      collection: "collaboration",
      documentId: "shared",
      ...(options || {}),
    };

    let docRef = null;
    let unsubscribe = null;
    let latestSerialized = "";

    function getFirebase() {
      return root.firebase && root.firebase.apps && root.firebase.apps.length && root.firebase.auth && root.firebase.firestore
        ? root.firebase
        : null;
    }

    function serialize(state) {
      return root.SydneyCollaboration.serializeState(state);
    }

    function parse(serialized) {
      return JSON.parse(serialized);
    }

    function hydrate(value) {
      return root.SydneyCollaboration.hydrateState(JSON.stringify(value || {}));
    }

    async function start(initialState, handlers) {
      const firebase = getFirebase();
      const callbacks = handlers || {};

      if (!firebase) {
        callbacks.onStatus && callbacks.onStatus("offline");
        return { available: false };
      }

      await firebase.auth().signInAnonymously();

      const firestore = firebase.firestore();
      docRef = firestore.collection(config.collection).doc(config.documentId);
      latestSerialized = serialize(initialState);

      try {
        const snapshot = await docRef.get();
        if (snapshot.exists && snapshot.data() && snapshot.data().state) {
          const remoteState = hydrate(snapshot.data().state);
          latestSerialized = serialize(remoteState);
          callbacks.onRemoteState && callbacks.onRemoteState(remoteState);
        } else {
          await docRef.set(
            {
              state: parse(latestSerialized),
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        unsubscribe = docRef.onSnapshot(
          (remoteSnapshot) => {
            if (!remoteSnapshot.exists || !remoteSnapshot.data() || !remoteSnapshot.data().state) return;

            const remoteState = hydrate(remoteSnapshot.data().state);
            const remoteSerialized = serialize(remoteState);
            if (remoteSerialized === latestSerialized) return;

            latestSerialized = remoteSerialized;
            callbacks.onRemoteState && callbacks.onRemoteState(remoteState);
          },
          (error) => {
            callbacks.onError && callbacks.onError(error);
          }
        );

        callbacks.onStatus && callbacks.onStatus("online");
        return { available: true };
      } catch (error) {
        callbacks.onError && callbacks.onError(error);
        callbacks.onStatus && callbacks.onStatus("offline");
        return { available: false, error };
      }
    }

    async function save(state) {
      const firebase = getFirebase();
      if (!firebase || !docRef) return false;

      const serialized = serialize(state);
      if (serialized === latestSerialized) return true;

      latestSerialized = serialized;
      await docRef.set(
        {
          state: parse(serialized),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    }

    function stop() {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    }

    return {
      start,
      save,
      stop,
    };
  }

  return {
    createFirebaseCollaborationSync,
  };
});
