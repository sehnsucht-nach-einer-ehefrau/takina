// lib/indexedDB.ts
export interface WalkthroughState {
  taskId: number;
  currentDayIndex: number;
  parsedDays: string[][];
  checkedItems: Record<string, boolean>;
  finishedDays: boolean[];
  completionStats: {
    completed: number;
    total: number;
  };
  purpleCount: number;
  clearedTaskSchedule: boolean;
}

const DB_NAME = "walkthroughApp";
const STORE_NAME = "walkthroughState";
const DB_VERSION = 1;

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("Error opening IndexedDB");
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "taskId" });
      }
    };
  });
};

export const walkthroughIndexExists = async (id: number): Promise<boolean> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = (event) => {
        resolve(!!(event.target as IDBRequest).result);
      };

      request.onerror = (event) => {
        console.error("Error checking index existence:", event);
        reject("Failed to check index existence");
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in indexExists:", error);
    throw error;
  }
};

// Save walkthrough state to IndexedDB
export const saveWalkthroughState = async (
  state: WalkthroughState,
): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(state);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error("Error saving state:", event);
        reject("Failed to save walkthrough state");
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in saveWalkthroughState:", error);
    throw error;
  }
};

// Load walkthrough state from IndexedDB
export const loadWalkthroughState = async (
  taskId: number,
): Promise<WalkthroughState | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(taskId);

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result || null);
      };

      request.onerror = (event) => {
        console.error("Error loading state:", event);
        reject("Failed to load walkthrough state");
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in loadWalkthroughState:", error);
    throw error;
  }
};

// Delete walkthrough state from IndexedDB
export const deleteWalkthroughState = async (taskId: number): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(taskId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error("Error deleting state:", event);
        reject("Failed to delete walkthrough state");
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error in deleteWalkthroughState:", error);
    throw error;
  }
};
