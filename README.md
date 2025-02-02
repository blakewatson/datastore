# DataStore

DataStore is a JavaScript module that makes it easy to save key value/pairs to [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) with an API similar to [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

IndexedDB is allowed more storage space than localStorage. It can also store more data types than strings. That means you can save structured data without having to convert it to JSON first. IndexedDB, unlike localStorage, isn’t blocking—all operations are asynchronous.

IndexedDB can do a _lot_ more, but the reasons above are enough to use it even in relatively simple cases. This DataStore class is woefully underusing IndexedDB features. It merely replicates localStorage but by using IndexedDB behind the scenes for its advantages.

## Usage

While DataStore aims to be as simple as localStorage, it does have one extra setup step: you must create an instance.

```js
import DataStore from './path/to/DataStore.js';

const store = new DataStore();
```

If you want to use it just like localStorage, and you don't care about naming or versioning the database, then you can instantiate it with no parameters.

## Retrieve data

Get data out of your store using `getItem(key)`. Every operation on the store returns a promise. For this example, I will show both promise chaining and async/await. For further examples, I will show only async/await for brevity.

```js
const store = new DataStore();

// with promise chaining
store.getItem('email').then((email) => console.log(email));

// with async/await
async function main() {
  const email = await store.getItem('email');
  console.log(email);
}
```

## Add data

Add or overwrite data with `setItem(key, value)`.

```js
async function main() {
  await store.setItem('email', 'foo@example.com');
  // do something afterward
}
```

Unlike localStorage you can also save structured data:

```js
async function main() {
  await store.setItem('jdoe@example.com', { name: 'Jane Doe', age: 31 });
  // do something afterward
}
```

## Remove data

You can remove an entry from your data store with `removeItem(key)`.

```js
async function main() {
  await store.removeItem('email');
  // do something afterward
}
```

## Clear a data store

You can remove every entry in a data store with `clear`.

```js
async function main() {
  await store.clear();
  // do something afterward
}
```

## Get a list of keys

You can get back an array of all the keys in your data store with `keys()`.

```js
async function main() {
  const keys = await store.keys();
  console.log(keys);
  // Example: ['email', 'token', 'loginDate']
}
```

## Get the number of entries

While localStorage gives you a `length` property that you can read from, DataStore provides you a count of all the entries in your store with the `count()` function.

```js
async function main() {
  let num = await store.count();
  // Ex: 3

  // if you prefer the word "length," this method is identical
  num = await store.length();
  // still 3
}
```

## Using a named database with one or more named stores

Unlike localStorage, IndexedDB has the concept of an [object store](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore) and a database can have multiple object stores. This is handy for grouping data. You can name a database and specify one or more named stores by using this extra setup step.

### Set up named database and stores

`setupDb` is a static method on the `DataStore` class that opens a database and creates any object stores that you specify. You can also provide a version number and an `onUpgradeNeeded` callback. That callback gives you an opportunity to do any database setup that you need to do after the object stores are created. You can omit this callback if all you want to do is create the object stores because that happens automatically.

The database name is required, but all of the other `SetupDbOptions` are optional.

```js
DataStore.setupDb({
  name: 'My Database',
  version: 1, // default value
  // can be string or array of strings. default is 'data'.
  storesToCreate: ['users', 'posts'],
  onUpgradeNeeded: async (db, stores) => {
    // Perform any database operations you want to do.
    // `stores` represents a DataStore instance for each store you created.
  },
});
```

### Get a named DataStore instance

If you use the `setupDb` method to create a named database and one or more named stores, then you must instantiate `DataStore` by specifying the database name and the store name you want to use.

```js
// This isn't necessarily a smart way to structure posts and likes but
// is just an example of how to use multiple data stores on a database.

async function main() {
  // 'data' is the default object store name so we can omit it
  const store = new DataStore('My Database');
  // number keys get turned into strings under the hood
  const post = await store.getItem(1);

  // specify database name and object store name if not using default.
  const metaStore = new DataStore('My Database', 'metadata');
  const likes = await metaStore.getItem('likes-1');

  return { post, likes };
}
```

## Keys are strings

DataStore only supports strings as keys. That said, you _can_ use numbers in `getItem`, `setItem`, and `removeItem`. Just be aware that they get converted to strings under the hood. The `keys()` method always returns an array of strings.
