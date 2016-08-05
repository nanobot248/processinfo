var assert = require("assert");
var Ps = require("../lib/package.js");

describe("blabla", function() {
  it("should do something", function(done) {
    var ps = new Ps();
    ps.get(function(err, data) {
      console.log("data: ", data);
      try {
        assert(data instanceof Array);
        assert(data.length > 0);
        done();
      } catch(ex) {
        done(ex);
      }
    });
  });
});

