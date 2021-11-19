const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  target.result.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  console.log("Save record invoked");
  // Create a transaction on the BudgetStore db with readwrite access
  const transaction = db.transaction(["BudgetStore"], "readwrite");

  // Access your BudgetStore object store
  const store = transaction.objectStore("BudgetStore");

  // Add record to your store with add method.
  store.add(record);
}



function checkDatabase() {
  console.log("check db invoked");

  const transaction = db.transaction(["BudgetStore"], "readonly");

  const store = transaction.objectStore("BudgetStore");

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = async function () {
    if (getAll.result.length === 0) {
      // no items to post to backend
      return;
    }
    // If there are items in the store, we need to bulk add them when we are back online
    const response = await fetch("/api/transaction/bulk", {
      method: "POST",
      body: JSON.stringify(getAll.result),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
    });
    const dbTransactions = await response.json();
    // If our returned response is not empty
    if (dbTransactions.length > 0) {
      // Open another transaction to BudgetStore with the ability to read and write
      const delTxn = db.transaction(["BudgetStore"], "readwrite");

      // Assign the current store to a variable
      const currentStore = delTxn.objectStore("BudgetStore");

      // Clear existing entries because our bulk add was successful
      currentStore.clear();
      console.log("Clearing store 🧹");
    }
  };
}



// listen for app coming back online
window.addEventListener('online', checkDatabase);
