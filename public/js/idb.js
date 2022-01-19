let db;
const request = indexedDB.open('budget_tracker', 2);

// this event will emit if the database version changes (nonexistent to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function(event) {
    db = event.target.result;
    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
      uploadTransaction();
    }
};
  
request.onerror = function(event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    budgetObjectStore.add(record);
};

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    const getAll = budgetObjectStore.getAll();
  
    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
        fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access the new_transaction object store
                const budgetObjectStore = transaction.objectStore('new_transaction');
                // clear all items in your store
                budgetObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
};

// listen for app coming back online
window.addEventListener('online', uploadTransaction);