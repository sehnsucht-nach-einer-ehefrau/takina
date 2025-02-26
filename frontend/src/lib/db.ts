export async function getDB() {
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

export async function saveTaskResponse(taskData: any) {
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

    // Get the current history to determine the next ID
    let history = await getTaskHistory();
    console.log("Current history length:", history.length);

    // If there are 10 or more items, delete the oldest one first
    if (history.length >= 10) {
      const oldestId = history[0].id;
      console.log(`Deleting oldest entry with ID: ${oldestId}`);
      await deleteTaskResponse(oldestId);
      history = await getTaskHistory();
    }

    // Find the next available ID
    const usedIds = new Set(history.map((item) => item.id));
    let nextId = 1;
    while (usedIds.has(nextId)) {
      nextId++;
    }

    console.log("Task Data (truncated for logging):", {
      ...safeTaskData,
      apiOutput: safeTaskData.apiOutput
        ? `${safeTaskData.apiOutput.substring(0, 50)}...`
        : undefined,
    });
    console.log("Next ID:", nextId);

    // Create the transaction in a separate try/catch
    try {
      const tx = db.transaction("history", "readwrite");
      console.log("Created transaction");

      const store = tx.objectStore("history");
      console.log("Got object store reference");

      const dataToStore = { ...safeTaskData, id: nextId };
      console.log("Created data object with ID");

      return new Promise((resolve, reject) => {
        console.log("About to call store.add");

        try {
          const request = store.add(dataToStore);
          console.log("store.add called");

          request.onsuccess = () => {
            console.log("Add operation successful");
            resolve(true);
          };

          request.onerror = (event) => {
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

        tx.onerror = (event) => {
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

export async function getTaskHistory() {
  const db = await getDB();
  const tx = db.transaction("history", "readonly");
  const store = tx.objectStore("history");

  return new Promise<any[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteTaskResponse(id: number) {
  const db = await getDB();
  const tx = db.transaction("history", "readwrite");
  const store = tx.objectStore("history");

  return new Promise<void>((resolve, reject) => {
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`Deleted entry with ID: ${id}`);
      resolve();
    };

    request.onerror = (event) => {
      console.error("Delete operation error:", request.error);
      reject(request.error);
    };
  });
}
