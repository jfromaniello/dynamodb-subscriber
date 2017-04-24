const AWS = require('aws-sdk-mock');
const assert = require('chai').assert;
const DynamoDBSubscriber = require('../index.js');

describe('(internal behavior) subscriber._getOpenShards', function () {
  afterEach(function () {
    AWS.restore();
  });

  before(function() {
    AWS.mock('DynamoDBStreams', 'describeStream', (params, callback) => {
      assert.equal(params.StreamArn, 'urn:test:test');
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
  });

  it('should work', function (done) {
    var subscriber = new DynamoDBSubscriber({ arn: 'urn:test:test' });
    subscriber._getOpenShards((err, shards) => {
      if (err) { return done(err); }
      assert.equal(shards.length, 1);
      assert.isOk(shards.every(s => !s.EndingSequenceNumber && s.iterator === '123'));
      done();
    });
  });
});
