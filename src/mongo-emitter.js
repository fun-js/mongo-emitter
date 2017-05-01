import mongodb from 'mongodb';

import Emitter from '@funjs/emitter';
import OplogEmitter from './oplog-emitter';


const noop = () => {};
const MongoClient = mongodb.MongoClient;
const connOptions = {
  poolSize: 10,
  autoReconnect: true,
  noDelay: true,
  keepAlive: 1000,
  connectTimeoutMS: 30000
};

export default Object.freeze(MongoEmitter);



/**
 *
 * @param {string} [{ url, options }={ url: 'mongodb://localhost:27017', options: {} }]
 * @param {any} [done=noop]
 * @returns
 */
function MongoEmitter({ url, options } = { url: 'mongodb://localhost:27017', options: {} }, done = noop) {
  const emitter = Emitter(options);
  const { on, once, off, offAll, emit } = emitter;

  MongoClient.connect(url, connOptions, (err, db) => {
    if (err) {
      return done(err);
    }

    OplogEmitter(db, emitter);

    db.on('error', err => emit('db/error', err));
    db.on('timeout', err => emit('db/timeout', err));
    db.on('reconnect', err => emit('db/reconnect', err));
    db.on('parseError', err => emit('db/parseError', err));
    db.on('close', err => emit('db/close', err));
  });

  return Object.freeze({ on, once, off, offAll });
}
