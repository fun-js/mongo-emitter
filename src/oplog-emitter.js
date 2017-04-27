'use strict';

const util = require('util');

const Emitter = require('@funjs/emitter');
const Timestamp = require('mongodb').Timestamp;

const [INSERT, UPDATE, REMOVE] = ['i', 'u', 'd'];
const operationsNames = {
  insert: INSERT,
  update: UPDATE,
  remove: REMOVE
};
const noop = () => {};

module.exports = Object.freeze(OplogObserver);

function OplogObserver(dbConn) {
  let currentCursor;

  const emitter = Emitter();
  const queryObj = {};
  const dbName = dbConn.databaseName;
  const db = dbConn.db('local');
  const oplogColl = db.collection('oplog.rs');


  // public API
  return Object.freeze({ on });


  /**
   * observe oplog operations
   *
   * @param {any} next
   */
  function observe(next) {
    getStartingPoint((err, result) => {
      if (err) {
        return next(err);
      }
      listenForOperations(result, next);
    });
  }


  /**
   * add operations listeners
   *
   * @param {any} nsOp
   * @param {any} listener
   */
  function on(nsOps, listener) {
    const [ns, op] = parseNamespace(nsOps);

    addOperationListener(listener, ns, op, () => {
      if (currentCursor !== undefined) {
        currentCursor.close((err) => {
          if (err) {
            return emitter.emit('error', err);
          }

          observe(err => err && emitter.emit('error', err));
        });
      }
    });
  }


  /**
   * findLastDocumentInOplog
   *
   * @param {function} next
   */
  function getStartingPoint(next) {
    // Find by the highest timestamp
    oplogColl.find({}, { ts: 1 })
      .sort({ $natural: -1 })
      .limit(1)
      .next((err, result) => {
        if (err) {
          return next(err);
        }

        return next(undefined, result);
      });
  }


  function listenForOperations(startingPoint, next) {
    // Create a cursor for tailing and set it to await data
    const query = Object.assign({},
      createTimeStampQuery(startingPoint),
      createNamespaceOperationsQuery()
    );

    console.log(JSON.stringify(query, null, 4));

    const cursor = oplogColl.find(query, { numberOfRetries: Number.MAX_VALUE })
      .addCursorFlag('tailable', true)
      .addCursorFlag('awaitData', true)
      .addCursorFlag('oplogReplay', true);

    currentCursor = cursor;
    handleCursorStream(cursor);
    next();
  }


  /**
   * parseNamespace
   *
   * @param {string} namespaceOperation
   * @returns {array}
   */
  function parseNamespace(namespaceOperation) {
    const sections = namespaceOperation.split('.');
    return [sections[0].split('|'), sections[1].split('|')];
  }

  /**
   * addOperationListener
   *
   * @param {function} listener
   * @param {array} ns
   * @param {array} op
   */
  function addOperationListener(listener, ns, op, done) {
    ns.forEach((n) => {
      if (!queryObj[n]) {
        namespaces[n] = {};
      }
      op.forEach((o) => {
        if (!namespaces[n][o]) {
          namespaces[n][o] = [];
        }
        namespaces[n][o].push(listener);
        const operation = operationsNames[o];
        if (operation === undefined) {
          throw new Error(`${o}: is an invalid opration`);
        }
        if (operations[0] === false) {
          operations[o] = true;
        }
      });
    });

    done();
  }


  /**
   * createNamespaceOperationsQuery
   *
   * @returns {object}
   */
  function createNamespaceOperationsQuery() {
    const ns = Object.keys(namespaces).join('|');

    return {
      ns: { $regex: `(^(${dbName})).(${ns})` },
      op: { $regex: Object.keys(operations).join('|') }
    };
  }
}


/**
 * createTimeStampQuery
 *
 * @param {TimeStamp|undefined} ts
 * @returns {TimeStamp}
 */
function createTimeStampQuery(ts) {
  // If there isn't one found, get one from the local clock
  if (ts) {
    return { ts: { $gt: ts } };
  }

  const tstamp = new Timestamp(0, Math.floor(new Date().getTime() / 1000));
  return { ts: { $gt: tstamp } };
}


/**
 * handleCursorStream
 *
 * @param {object} cursor
 */
function handleCursorStream(cursor, next) {
  // Wrap that cursor in a Node Stream
  const stream = cursor.stream();

  // And when data arrives at that stream, print it out
  stream.on('data', handleData);

  stream.on('error', (e) => {
    console.log('stream error:', e);
    throw new Error('Stream Error');
  });

  stream.on('end', (e) => {
    console.log('stream end:', e);
    throw new Error('Stream Ended');
  });

  stream.on('close', (e) => {
    console.log('stream close:', e);
    throw new Error('Stream Closed');
  });
}


function handleData(doc) {
  console.log(`doc |> ${util.inspect(doc, false, null)}`);
  // var col = doc.ns.split('.')[1],
  //     ns = _namespaces[col],
  //     op = doc.op,
  //     operator = Object.keys(doc.o)[0],
  //     data = {};

  // data.collection = col;

  // if (ns) {
  //     if (op === UPDATE && ns.update) {
  //         data.action = 'update';

  //         if (operator[0] === '$') {
  //             data._id = doc.o2._id;
  //             switch (operator) {
  //                 case '$set':
  //                     data.operator = operator;
  //                     data.data = doc.o.$set;
  //                     break;
  //                 default:
  //                     data.operator = operator;
  //                     data.data = doc.o[operator];
  //             }
  //         } else {
  //             data._id = doc.o._id;
  //             data.data = doc.o;
  //         }

  //         ns.update.forEach(function (updateCallback) {
  //             updateCallback(data);
  //         });
  //         return;
  //     }
  //     if (doc.op === INSERT && ns.insert) {
  //         data.action = 'insert';
  //         data.data = doc.o;
  //         ns.insert.forEach(function (insertCallback) {
  //             insertCallback(data);
  //         });
  //         return;
  //     }
  //     if (doc.op === REMOVE && ns.remove) {
  //         data.action = 'remove';
  //         data.data = doc.o;
  //         ns.remove.forEach(function (removeCallback) {
  //             removeCallback(data);
  //         });
  //         return;
  //     }
  // }
}
