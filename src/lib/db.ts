type Task = {
  id: number;
  steps: string[];
  title: string;
};

type TaskHistory = {
  id: number;
  apiOutput: string;
  date: string;
  dateDifference: number;
  tasks: Task[];
};

export async function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("IndexedDB is not available on the server"),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open("taskPlannerDB", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("history")) {
        db.createObjectStore("history", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTaskResponse(taskData: TaskHistory) {
  try {
    console.log("Starting saveTaskResponse");
    const db = await getDB();
    console.log("Got DB connection");

    // Check if the object store exists
    if (!db.objectStoreNames.contains("history")) {
      console.error("Object store 'history' does not exist!");
      return Promise.reject(new Error("Object store 'history' does not exist"));
    }

    // Sanitize the taskData to ensure it's safe for IndexedDB
    const safeTaskData = JSON.parse(JSON.stringify(taskData));
    console.log("Sanitized task data:", safeTaskData);

    // Get the current history
    const history = await getTaskHistory();
    console.log("Current history length:", history.length);

    // Sort the history by ID to ensure correct order
    history.sort((a, b) => a.id - b.id);

    let nextId = history.length + 1;

    // If we already have 10 items, we need to delete the oldest and shift others
    if (history.length >= 10) {
      console.log("History is full, shifting IDs...");
      nextId = 10; // Next ID will be 10 since we're maintaining 10 items max

      // Create a transaction for all the operations
      const tx = db.transaction("history", "readwrite");
      const store = tx.objectStore("history");

      // Delete the first item (ID 1)
      console.log("Deleting item with ID 1");
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = store.delete(1);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });

      // Shift all other items (ID 2-10 become ID 1-9)
      for (let i = 1; i < history.length; i++) {
        const item = history[i];
        const oldId = item.id;
        const newId = oldId - 1;

        console.log(`Shifting item from ID ${oldId} to ID ${newId}`);

        // Delete the item with the old ID
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(oldId);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });

        // Add it back with the new ID
        await new Promise<void>((resolve, reject) => {
          const addRequest = store.add({ ...item, id: newId });
          addRequest.onsuccess = () => resolve();
          addRequest.onerror = () => reject(addRequest.error);
        });
      }

      // Wait for transaction to complete
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => {
          console.log("ID shifting transaction completed");
          resolve();
        };
        tx.onerror = () => {
          console.error("ID shifting transaction failed:", tx.error);
          reject(tx.error);
        };
      });
    }

    console.log("Next ID will be:", nextId);

    // Now add the new item with the next ID
    try {
      const tx = db.transaction("history", "readwrite");
      console.log("Created transaction for new item");

      const store = tx.objectStore("history");
      console.log("Got object store reference");

      const dataToStore = { ...safeTaskData, id: nextId };
      console.log("Created data object with ID:", nextId);

      return new Promise((resolve, reject) => {
        console.log("About to call store.add");

        try {
          const request = store.add(dataToStore);
          console.log("store.add called");

          request.onsuccess = () => {
            console.log("Add operation successful");
            resolve(true);
          };

          request.onerror = () => {
            console.error("Add operation error:", request.error);
            if (request.error) {
              console.error("Error name:", request.error.name);
              console.error("Error message:", request.error.message);
            }
            reject(request.error);
          };
        } catch (innerError) {
          console.error("Exception during store.add:", innerError);
          reject(innerError);
        }

        tx.onerror = () => {
          console.error("Transaction error:", tx.error);
          reject(tx.error);
        };

        tx.oncomplete = () => {
          console.log("Transaction completed successfully");
        };
      });
    } catch (txError) {
      console.error("Exception during transaction creation:", txError);
      throw txError;
    }
  } catch (err) {
    console.error("Caught exception in saveTaskResponse:", err);
    throw err;
  }
}
export async function getTaskHistory(): Promise<TaskHistory[]> {
  const db = await getDB();
  const tx = db.transaction("history", "readonly");
  const store = tx.objectStore("history");

  return new Promise<TaskHistory[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as TaskHistory[]);
    request.onerror = () => reject(request.error);
  });
}

export async function indexExists(id: number): Promise<boolean> {
  try {
    const history = await getTaskHistory();
    return id >= 0 && id <= 10 && history.some((item) => item.id === id);
  } catch {
    return false;
  }
}

export async function deleteTaskResponse(id: number) {
  try {
    // First, get all the history items (this should be in its own transaction)
    const history = await getTaskHistory();

    // Sort by ID to ensure correct order
    history.sort((a, b) => a.id - b.id);

    // Find all items with IDs greater than the deleted one that will need to be shifted
    const itemsToShift = history.filter((item) => item.id > id);

    // Now start a new transaction for the delete and shift operations
    const db = await getDB();
    const tx = db.transaction("history", "readwrite");
    const store = tx.objectStore("history");

    // Delete the requested ID
    store.delete(id);

    // Process each item to shift its ID down by 1
    for (const item of itemsToShift) {
      const oldId = item.id;
      const newId = oldId - 1;

      // Delete the item with the old ID
      store.delete(oldId);

      // Add it back with the new ID
      store.add({ ...item, id: newId });
    }

    // Return a promise that resolves when the transaction completes
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        console.log("Delete and shift transaction completed successfully");
        resolve();
      };
      tx.onerror = () => {
        console.error("Transaction error during delete and shift:", tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        console.error("Transaction aborted during delete and shift:", tx.error);
        reject(tx.error || new Error("Transaction aborted"));
      };
    });
  } catch (err) {
    console.error("Error in deleteTaskResponse:", err);
    throw err;
  }
}
