const AWS = require('aws-sdk-mock');
const assert = require('chai').assert;
var DynamoDBSubscriber = require('../index');

// AWS.mock('DynamoDB', 'putItem', function (params, callback){
//   callback(null, "successfully put item in database");
// });

// AWS.mock('SNS', 'publish', 'test-message');

// /**
//     TESTS
// **/

// AWS.restore('SNS', 'publish');
// AWS.restore('DynamoDB');
// // or AWS.restore(); this will restore all the methods and services

describe('DynamodbSubscriber', function () {
  afterEach(function () {
    AWS.restore('DynamoDBStreams');
  });

  describe('subscriber._getOpenShards ', function () {
    it('should work', function (done) {
      AWS.mock('DynamoDBStreams', 'describeStream', (params, callback) => {
        assert.equal(params.StreamArn, 'urn:testtest');
        assert.equal(params.ExclusiveStartShardId, undefined);
        callback(null, {
          StreamDescription: {
            Shards: [
              { ShardId: '123', SequenceNumberRange: { EndingSequenceNumber: '1234' } },
              { ShardId: '456', SequenceNumberRange: { } }
            ]
          }
        });
      });

      AWS.mock('DynamoDBStreams', 'getShardIterator', (params, callback) => {
        callback(null, { ShardIterator: '123' });
      });

      var subscriber = new DynamoDBSubscriber({ arn: 'urn:testtest' });

      subscriber._getOpenShards((err, shards) => {
        if (err) { return done(err); }
        assert.equal(shards.length, 1);
        assert.isOk(shards.every(s => !s.EndingSequenceNumber && s.iterator === '123'));
        done();
      });

    });
  });


  it('should work', function (done) {
    AWS.mock('DynamoDBStreams', 'describeStream', (params, callback) => {
      assert.equal(params.StreamArn, 'urn:testtest');
      assert.equal(params.ExclusiveStartShardId, undefined);
      callback(null, {
        StreamDescription: {
          Shards: [
            { ShardId: '123', SequenceNumberRange: { EndingSequenceNumber: '1234' } },
            { ShardId: '456', SequenceNumberRange: { } }
          ]
        }
      });
    });

    AWS.mock('DynamoDBStreams', 'getShardIterator', (params, callback) => {
      assert.equal(params.ShardId, '456');
      callback(null, { ShardIterator: 'iterator-123' });
    });

    const record = {};

    AWS.mock('DynamoDBStreams', 'getRecords', (params, callback) => {
      assert.equal(params.ShardIterator, 'iterator-123');
      callback(null, { Records: [ record ], NextShardIterator: 'iterator-456' });
    });

    const subscriber = new DynamoDBSubscriber({ arn: 'urn:testtest', interval: 100 });

    subscriber.once('record', (r) => {
      assert.deepEqual(r, record);
      subscriber.stop();
      done();
    }).start();
  });


});
