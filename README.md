# processinfo
nodejs module for getting process information. Uses "ps" and currently only
works on Linux systems and other environments with a compatible "ps" command.

# Usage
## Get all columns
This snippet lists all columns known to the ProcessList class by using the
column names listed in the `ProcessList.defaultColumns` array.

```javascript
var Ps = require("../lib/package.js");

var ps = new Ps();
ps.get(function(err, data) {
  console.log("Process information: ", data);
});
```

## Only get some specific columns
This code returns only four columns.
```javascript
var Ps = require("../lib/package.js");

var ps = new Ps({
  columns: ["processId", "parentProcessId", "lightweightProcessId", "command"]
});
ps.get(function(err, data) {
  console.log("Process information: ", data);
});
```

## Don't list threads
The following code only lists real processes, but skips all lightweight
processes (threads).

```javascript
var Ps = require("../lib/package.js");

var ps = new Ps({
  listThreads: false
});
ps.get(function(err, data) {
  console.log("Process information: ", data);
});
```
