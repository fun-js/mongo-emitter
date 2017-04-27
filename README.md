[![travis build](https://img.shields.io/travis/fun-js/mongo-emitter.svg?style=flat)](https://travis-ci.org/fun-js/mongo-emitter)
[![Dependency Status](https://david-dm.org/fun-js/mongo-emitter.svg?theme=shields.io)](https://david-dm.org/fun-js/mongo-emitter)
[![devDependency Status](https://david-dm.org/fun-js/mongo-emitter/dev-status.svg?theme=shields.io)](https://david-dm.org/fun-js/mongo-emitter#info=devDependencies)
[![Codecov](https://img.shields.io/codecov/c/github/fun-js/mongo-emitter.svg)]()
[![MIT License](https://img.shields.io/github/license/fun-js/mongo-emitter.svg?style=flat)](http://opensource.org/licenses/MIT)

## What is it?

A Event Emitter to subscribe for changes in a MongoDB ReplicaSet


## How do I install it?

```Shell
yarn add @funjs/mongo-emitter
or
npm install --save @funjs/mongo-emitter
```

## How do I use it?

```javascript
const Emitter = require('@funjs/mongo-emitter');
const mongo = MongoEmitter('mongo://localhost:27017/my-db');

mongo.on('users/:action=(insert|update)/:id', ({ action, id }, data) => {
  console.log(`action: ${action}`);
  console.log(`id: ${id}`);
  console.log(`data: ${JSON.stringify(data)}`);
});

// action: insert
// id: 1
// data: {"_id":1,"name":"Joe","age":33}

// action: update
// id: 1
// data: {"_id":1,"name":"Joe","age":34}

// action: remove
// id: 1
// data: {"_id": 1}

// ...

```



## TODO:

- [] Basic API
- [] Implement `mongo query api` to subscribe to more specific changes
