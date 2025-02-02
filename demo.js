// @ts-check
import DataStore from './DataStore.js';

main();

function main() {
  document
    .querySelector('#default')
    ?.addEventListener('click', testDefaultStore);

  document.querySelector('#named')?.addEventListener('click', testNamedStore);

  document
    .querySelector('#multiple')
    ?.addEventListener('click', testMultipleStores);

  document.querySelector('#length')?.addEventListener('click', testGetLength);

  document
    .querySelector('#upgrade')
    ?.addEventListener('click', testOnUpgradeNeeded);

  document
    .querySelector('#clear')
    ?.addEventListener('click', testClearDefaultStore);

  document
    .querySelector('#remove-all')
    ?.addEventListener('click', removeAllDatabases);
}

async function testDefaultStore() {
  console.log('Testing default store');
  const defaultStore = new DataStore();
  await defaultStore.setItem('foo', 'bar');
  await defaultStore.setItem('fizz', 'buzz');
  console.log(await defaultStore.getItem('foo')); // bar

  try {
    console.log(await defaultStore.getItem('baz')); // Error: Key not found
  } catch (error) {
    console.error(error);
  }

  console.log(await defaultStore.keys()); // ['foo']
  await defaultStore.removeItem('foo');
  await defaultStore.setItem('obj', { foo: 'bar' });

  // final state of the database
  // fizz: 'buzz'
  // obj: { foo: 'bar' }
}

async function testNamedStore() {
  console.log('Testing named store');

  DataStore.setupDb({
    name: 'My Database',
    storesToCreate: 'My Store',
  });

  const myStore = new DataStore('My Database', 'My Store');
  await myStore.setItem('foo', 'bar');
  await myStore.setItem('fizz', 'buzz');
  console.log(await myStore.getItem('foo')); // bar

  try {
    console.log(await myStore.getItem('baz')); // Error: Key not found
  } catch (error) {
    console.error(error);
  }

  console.log(await myStore.keys()); // ['foo']
  await myStore.removeItem('foo');
  await myStore.setItem('obj', { foo: 'bar' });
}

async function testMultipleStores() {
  console.log('Testing multiple stores');

  DataStore.setupDb({
    name: 'My Database',
    storesToCreate: ['Store 1', 'Store 2'],
  });

  const store1 = new DataStore('My Database', 'Store 1');
  const store2 = new DataStore('My Database', 'Store 2');

  await store1.setItem('foo', 'bar');
  await store2.setItem('fizz', 'buzz');

  console.log(await store1.getItem('foo')); // bar
  console.log(await store2.getItem('fizz')); // buzz
}

async function testGetLength() {
  console.log('Testing getLength');

  const store = new DataStore();
  await store.setItem('foo', 'bar');
  await store.setItem('fizz', 'buzz');
  console.log(await store.count()); // 2
}

async function testOnUpgradeNeeded() {
  console.log('Testing onUpgradeNeeded');
  const databases = await indexedDB.databases();

  for (const { name } of databases) {
    if (name === 'New Database') {
      // @ts-ignore
      indexedDB.deleteDatabase(name);
    }
  }

  DataStore.setupDb({
    name: 'New Database',
    storesToCreate: ['data', 'people'],
    onUpgradeNeeded: (db, stores) => {
      console.log('Upgrade needed callback');
      stores[0].setItem('foo', 'bar');
    },
  });
}

async function testClearDefaultStore() {
  console.log('Clearing default store');
  const defaultStore = new DataStore();
  await defaultStore.setItem('foo', 'bar');
  await defaultStore.setItem('fizz', 'buzz');
  console.log(await defaultStore.getItem('foo')); // bar

  await defaultStore.clear();
  console.log(await defaultStore.keys()); // []
}

async function removeAllDatabases() {
  console.log('Removing all databases');
  const databases = await indexedDB.databases();

  for (const { name } of databases) {
    // @ts-ignore
    indexedDB.deleteDatabase(name);
  }
}
