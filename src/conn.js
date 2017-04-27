'use strict';

const mongodb = require('mongodb');
const OplogObserver = require('./oplog-emitter');

const MongoClient = mongodb.MongoClient;
const options = {
  poolSize: 10,
  autoReconnect: true,
  noDelay: true,
  keepAlive: 1000,
  connectTimeoutMS: 30000
};


MongoClient.connect('mongodb://45.79.203.115:27017/sattrack', options, (err, db) => {
  if (err) throw err;

  db.on('error', e => console.log('db error:', e));
  db.on('timeout', e => console.log('db timeout:', e));
  db.on('reconnect', e => console.log('db reconnect:', e));
  db.on('parseError', e => console.log('db parseError:', e));
  db.on('close', e => console.log('db close:', e));

  const oplog = OplogObserver(db);

  oplog.on('trackers.update|insert', () => {});
  oplog.observe(() => console.log('observing...'));
});
