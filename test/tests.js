const assert = require("assert");
const Ps = require("../lib/package.js");
const _ = require("lodash");

describe("get all available columns and list threads", function() {
  it("returned columns should be equal to ProcessList.defaultColumns", function(done) {
    var ps = new Ps();
    ps.get(function(err, data) {
      try {
        assert(data instanceof Array);
        assert(data.length > 0);
        var columns = Ps.defaultColumns;
        var proc = data[0];
        var keys = Object.keys(proc);
        var diff1 = _.difference(columns, keys);
        var diff2 = _.difference(keys, columns);
        assert(diff1.length < 1);
        assert(diff2.length < 1);
        done();
      } catch(ex) {
        done(ex);
      }
    });
  });
});

describe("get only some columns and list threads", function() {
  it("returned columns should be [processId, parentProcessId, command]", function(done) {
    var columns = ["processId", "parentProcessId", "command"];
    var ps = new Ps({
      columns: columns
    });
    ps.get(function(err, data) {
      try {
        assert(data instanceof Array);
        assert(data.length > 0);
        var proc = data[0];
        var keys = Object.keys(proc);
        var diff1 = _.difference(columns, keys);
        var diff2 = _.difference(keys, columns);
        assert(diff1.length < 1);
        assert(diff2.length < 1);
        done();
      } catch(ex) {
        done(ex);
      }
    });
  });
});

describe("get only real process, no threads", function() {
  it("Number of distinct process IDs should be the same as the number of distinct thread IDs", function(done) {
    var columns = ["processId", "lightweightProcessId"];
    var ps = new Ps({
      columns: columns,
      listThreads: false
    });
    ps.get(function(err, data) {
      try {
        assert(data instanceof Array);
        assert(data.length > 0);
        var proc = data[0];
        var keys = Object.keys(proc);
        var diff1 = _.difference(columns, keys);
        var diff2 = _.difference(keys, columns);
        assert(diff1.length < 1);
        assert(diff2.length < 1);
        var processIds = _.map(data, function(proc) {
          return proc.processId
        });
        var threadIds = _.map(data, function(proc) {
          return proc.lightweightProcessId
        });
        assert(_.uniq(processIds).length == _.uniq(threadIds).length);
        done();
      } catch(ex) {
        done(ex);
      }
    });
  });
});
