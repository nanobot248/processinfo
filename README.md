# processinfo
nodejs module for getting process information. Uses "ps" and currently only works in Linux and other environments with a compatible "ps" command.

# Usage
```
var Ps = require("../lib/package.js");

var ps = new Ps();
ps.get(function(err, data) {
  console.log("Process information: ", data);
});
```

