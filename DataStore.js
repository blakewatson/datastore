// @ts-check

const DEFAULT_DB_NAME = 'Default DB';
const DEFAULT_STORE_NAME = 'data';

/**
 * @typedef {Object} SetupDbOptions
 * @property {string} name
 * @property {number} [version]
 * @property {string[] | string} [storesToCreate]
 * @property {(db: IDBDatabase, stores: DataStore[]) => void} [onUpgradeNeeded]
 */

export default class DataStore {
  /** @type {string | null} */
  dbName = null;
  /** @type {string | null} */
  storeName = null;

  /**
   * Create a new database with one or more stores.
   * @param {SetupDbOptions} options
   */
  static setupDb(options) {
    const {
      name,
      version = 1,
      storesToCreate = DEFAULT_STORE_NAME,
      onUpgradeNeeded = null,
    } = options;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);

      request.onerror = (event) => {
        // @ts-ignore
        console.error('Error opening database:', event.target.error);
        reject(new Error('Error opening database'));
      };

      request.onsuccess = (event) => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        /** @type {IDBDatabase} */
        const db = request.result;
        const existingStores = db.objectStoreNames;
        const dataStoreInstances = [];

        if (Array.isArray(storesToCreate)) {
          storesToCreate.forEach((storeName) => {
            if (existingStores.contains(storeName)) {
              return;
            }
            db.createObjectStore(storeName);
            dataStoreInstances.push(new DataStore(name, storeName));
          });
        } else {
          if (existingStores.contains(storesToCreate)) {
            return;
          }
          db.createObjectStore(storesToCreate);
          dataStoreInstances.push(new DataStore(name, storesToCreate));
        }

        if (onUpgradeNeeded) {
          onUpgradeNeeded(db, dataStoreInstances);
        }
      };
    });
  }

  /**
   * @param {string} dbName
   * @param {string} storeName
   */
  constructor(dbName = DEFAULT_DB_NAME, storeName = DEFAULT_STORE_NAME) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  getDb() {
    return new Promise((resolve, reject) => {
      // @ts-ignore we know this.dbName and this.version exist
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        // @ts-ignore
        console.error('Error opening database:', event.target.error);
        reject(new Error('Error opening database'));
      };

      request.onsuccess = (event) => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        console.log('Upgrade needed');
        /** @type {IDBDatabase} */
        const db = request.result;
        const existingStores = db.objectStoreNames;

        // @ts-ignore we know this.storeName is a string
        if (!existingStores.contains(this.storeName)) {
          // @ts-ignore we know this.storeName is a string
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  /** @param {string | number} key */
  async getItem(key) {
    /** @type {IDBDatabase} */
    const db = await this.getDb();

    if (typeof key === 'number') {
      key = key.toString();
    }

    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }

    return new Promise((resolve, reject) => {
      if (!this.storeName) {
        reject(new Error('Store name not set'));
        return;
      }

      const transaction = db.transaction(this.storeName, 'readonly');

      transaction.onerror = (event) => reject(transaction.error);

      const store = transaction.objectStore(this.storeName);

      const request = store.get(key);

      request.onerror = (event) => reject(request.error);

      request.onsuccess = () => {
        if (request.result === undefined) {
          reject(new Error('Key not found'));
          db.close();
          return;
        }
        resolve(request.result);
        db.close();
      };
    });
  }

  /**
   * @param {string | number} key
   * @param {any} value
   */
  async setItem(key, value) {
    /** @type {IDBDatabase} */
    const db = await this.getDb();

    if (typeof key === 'number') {
      key = key.toString();
    }

    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }

    return /** @type {Promise<void>} */ (
      new Promise((resolve, reject) => {
        if (!this.storeName) {
          reject(new Error('Store name not set'));
          return;
        }

        const transaction = db.transaction(this.storeName, 'readwrite');

        transaction.onerror = (event) => reject(transaction.error);

        const store = transaction.objectStore(this.storeName);

        const request = store.add(value, key);

        request.onerror = (event) => reject(request.error);

        request.onsuccess = () => {
          db.close();
          resolve();
        };
      })
    );
  }

  /** @param {string | number} key */
  async removeItem(key) {
    /** @type {IDBDatabase} */
    const db = await this.getDb();

    if (typeof key === 'number') {
      key = key.toString();
    }

    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }

    return /** @type {Promise<void>} */ (
      new Promise((resolve, reject) => {
        if (!this.storeName) {
          reject(new Error('Store name not set'));
          return;
        }

        const transaction = db.transaction(this.storeName, 'readwrite');

        transaction.onerror = (event) => reject(transaction.error);

        const store = transaction.objectStore(this.storeName);

        const request = store.delete(key);

        request.onerror = (event) => reject(request.error);

        request.onsuccess = () => {
          db.close();
          resolve();
        };
      })
    );
  }

  async keys() {
    /** @type {IDBDatabase} */
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      if (!this.storeName) {
        reject(new Error('Store name not set'));
        return;
      }

      const transaction = db.transaction(this.storeName, 'readonly');

      transaction.onerror = (event) => reject(transaction.error);

      const store = transaction.objectStore(this.storeName);

      const request = store.getAllKeys();

      request.onerror = (event) => reject(request.error);

      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };
    });
  }

  async count() {
    /** @type {IDBDatabase} */
    const db = await this.getDb();

    return new Promise((resolve, reject) => {
      if (!this.storeName) {
        reject(new Error('Store name not set'));
        return;
      }

      const transaction = db.transaction(this.storeName, 'readonly');

      transaction.onerror = (event) => reject(transaction.error);

      const store = transaction.objectStore(this.storeName);

      const request = store.count();

      request.onerror = (event) => reject(request.error);

      request.onsuccess = () => {
        resolve(request.result);
        db.close();
      };
    });
  }

  async length() {
    return this.count();
  }

  async clear() {
    /** @type {IDBDatabase} */
    const db = await this.getDb();

    return /** @type {Promise<void>} */ (
      new Promise((resolve, reject) => {
        if (!this.storeName) {
          reject(new Error('Store name not set'));
          return;
        }

        const transaction = db.transaction(this.storeName, 'readwrite');

        transaction.onerror = (event) => reject(transaction.error);

        const store = transaction.objectStore(this.storeName);

        const request = store.clear();

        request.onerror = (event) => reject(request.error);

        request.onsuccess = () => {
          db.close();
          resolve();
        };
      })
    );
  }
}
