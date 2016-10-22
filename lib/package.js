/**
  Provides classes for listing processes.

  @module processinfo
*/

var exec = require("child_process").exec;
var _ = require("lodash");

// map from "ps" column names to friendlier names returned by ProcessList.get()
var processInfoColumnNames = {
  "pid":     "processId",
  "ppid":    "parentProcessId",
  "lwp":     "lightweightProcessId",
  "euid":    "effectiveUserId",
  "euser":   "effectiveUserName",
  "egid":    "effectiveGroupId",
  "egroup":  "effectiveGroupName",
  "suid":    "savedUserId",
  "suser":   "savedUserName",
  "sgid":    "savedGroupId",
  "sgroup":  "savedGroupName",
  "fuid":    "filesystemUserId",
  "fuser":   "filesystemUserName",
  "fgid":    "filesystemGroupId",
  "fgroup":  "filesystemGroupName",
  "ruid":    "realUserId",
  "ruser":   "realUserName",
  "rgid":    "realGroupId",
  "rgroup":  "realGroupName",
  "%cpu":    "cpuPercentage",
  "%mem":    "memoryPercentage",
  "cls":     "schedulingClass",
  "elapsed": "startedAt",
  "pri":     "priority",
  "rtprio":  "realTimePriority",
  "ni":      "nicePriority",
  "nlwp":    "lightweightProcessCount",
  "wchan":   "waitingChannel",
  "psr":     "processorId",
  "rss":     "residentSetSize",
  "vsz":     "virtualMemorySize",
  "stat":    "processState",
  "tt":      "terminal",
  "command": "command"
};

// map from friendly names to the command line format names used for "ps"
var inverseProcessInfoColumnNames = {};
(function(columnNames, inverseColumnNames) {
  var keys = Object.keys(columnNames);
  for(var i in keys) {
    if(keys[i] == "elapsed") {
      inverseColumnNames["startedAt"] = "etimes";
    } else if(keys[i] == "ni") {
      inverseColumnNames["nicePriority"] = "nice";
    }  else if(keys[i] == "tt") {
      inverseColumnNames["terminal"] = "tty";
    } else if(keys[i] == "args") {
      inverseColumnNames["command"] = "args";
    } else {
      inverseColumnNames[columnNames[keys[i]]] = keys[i];
    }
  }
})(processInfoColumnNames, inverseProcessInfoColumnNames);

const schedulingClasses = {
  "-":   null,
  "?":   undefined,
  "TS":  "SCHED_OTHER",
  "FF":  "SCHED_FIFO",
  "RR":  "SCHED_RR",
  "B":   "SCHED_BATCH",
  "ISO": "SCHED_ISO",
  "IDL": "SCHED_IDLE"
};

const processStates = {
  "D": "UNINTERRUPTIBLE_SLEEP",
  "R": "ON_RUN_QUEUE",
  "S": "INTERRUPTIBLE_SLEEP",
  "T": "STOPPED",
  "W": "PAGING",
  "X": "DEAD",
  "Z": "ZOMBIE"
};

const additionalProcessStates = {
  "<": function(state) { state.priority = "HIGH"; },
  "N": function(state) { state.priority = "LOW"; },
  "L": function(state) { state.hasLockedPages = true; },
  "s": function(state) { state.isSessionLeader = true; },
  "l": function(state) { state.isMultiThreaded = true; },
  "+": function(state) { state.isForegroundProcess = true; }
};

const TableParser = function() {
  const self = this;

  self.columnNames = processInfoColumnNames;
  self.inverseColumnNames = inverseProcessInfoColumnNames;

  self.columnParsers = {
    "processId":         parseInt,
    "parentProcessId":   parseInt,
    "threadId":          parseInt,
    "lightweightProcessId":    parseInt,
    "lightweightProcessCount": parseInt,
    "effectiveUserId":   parseInt,
    "effectiveGroupId":  parseInt,
    "savedUserId":       parseInt,
    "savedGroupId":      parseInt,
    "filesystemUserId":  parseInt,
    "filesystemGroupId": parseInt,
    "realUserId":        parseInt,
    "realGroupId":       parseInt,
    "cpuPercentage":     parseFloat,
    "memoryPercentage":  parseFloat,
    "schedulingClass":   function(input) {
      return schedulingClasses[input.trim()];
    },
    "startedAt":         function(input) {
      var now = Date.now();
      var elapsed = parseInt(input);
      now -= (elapsed * 1000);
      return (new Date(now)).toISOString();
    },
    "priority":          parseInt,
    "realTimePriority":  function(input) { return input === "-" ? null : parseInt(input); },
    "nicePriority":      function(input) { return input === "-" ? null : parseInt(input); },
    "threadCount":       parseInt,
    "processorId":       parseInt,
    "residentSetSize":   function(input) { return parseInt(input) * 1024; },
    "virtualMemorySize": function(input) { return parseInt(input) * 1024; },
    "processState":      function(input) {
      input = input.trim();
      var state = input[0];
      var result = {
        state: processStates[state],
        priority: "NORMAL",
        hasLockedPages: false,
        isSessionLeader: false,
        isMultiThreaded: false,
        isForegroundProcess: false
      };
      for(var i = 1; i < input.length; i++) {
        var filter = additionalProcessStates[input[i]];
        if(filter != null) { filter(result); }
      }
      return result;
    }
  }

  self.parse = function(input) {
    var rawLines = input.replace(/\r/g, "\n").replace(/\n+/g, "\n").split("\n");
    var columns = rawLines[0].trim().toLowerCase().replace(/[ \t]+/g, " ").split(" ");
    for(var i = 0; i < columns.length; i++) {
      if(columns[i] in self.columnNames) {
        columns[i] = self.columnNames[columns[i]];
      }
    }

    var results = [];
    for(var i = 1; i < rawLines.length; i++) {
      var result = {};
      var line = rawLines[i].trim();
      if(line == null || line.length < 1) { continue; }

      var parts = line.replace(/[ \t]+/g, " ").split(" ");
      for(var j = 0; j < columns.length - 1; j++) {
        if(self.columnParsers[columns[j]] != null) {
          result[columns[j]] = self.columnParsers[columns[j]](parts[j]);
        } else {
          result[columns[j]] = parts[j];
        }
      }
      result[columns[columns.length - 1]] = parts.slice(columns.length - 1);
      results.push(result);
    }
    return results;
  };
};

/**
  Class for retrieving a list of running processes including process information.

  @param options Currently, the available options are:
    columns: An array of column names. The names are the same as returned by
      the "get" method.
    listThreads: Boolean value that defines whether threads are listed (true)
      or only processes are listed (false).
  @class ProcessList
  @constructor
*/
var ProcessList = function(options) {
  const self = this;

  const baseCommand = "ps -A -o ";
  const threadsSwitch = "H";
  var parser = new TableParser();
  var _options = _.assign({
    columns: ProcessList.defaultColumns,
    listThreads: true
  }, options);

  var psColumns = _.map(_options.columns, function(name) {
    return parser.inverseColumnNames[name];
  });

  var rawList = function(callback) {
    var cmd = baseCommand + " " + psColumns.join(",");
    if(_options.listThreads == true) { cmd += " " + threadsSwitch};
    exec(cmd, {maxBuffer: 1024*1024*10}, function(err, stdout, stderr) {
      if(err != null || (
        typeof(stdout) !== "string" || stdout.length < 1
      )) {
        var error = new Error("An error occurred while executing ps");
        error.innerError = err;
        error.stdout = stdout;
        error.stderr = stderr;
        callback(error);
      } else {
        callback(null, stdout);
      }
    });
  };

  /**
    Get process information for all processes. The list is an array of objects. Each object
    represents a single process with a lot of information about the process.
    Inspect the return value in a REPL for more information.

    @method get
    @return {array} An array of processes with process information.
  */
  self.get = function(callback) {
    var list = rawList(function(err, data) {
      if(err != null) {
        console.log("error: ", err);
        return callback(err);
      }
      var processes = parser.parse(data);
      callback(null, processes);
    });
  };

}

/**
  The array of columns returned from ProcessList.get() by default.

  @member defaultColumns
  @static
*/
ProcessList.defaultColumns = [
  "processId", "parentProcessId", "lightweightProcessId",
  "effectiveUserId", "effectiveUserName",
  "effectiveGroupId", "effectiveGroupName",
  "savedUserId", "savedUserName", "savedGroupId", "savedGroupName",
  "filesystemUserId", "filesystemUserName",
  "filesystemGroupId", "filesystemUserName",
  "realUserId", "realUserName", "realGroupId", "realGroupName",
  "cpuPercentage", "memoryPercentage", "schedulingClass", "startedAt",
  "priority", "realTimePriority", "nicePriority", "lightweightProcessCount",
  "waitingChannel", "processorId", "residentSetSize", "virtualMemorySize",
  "processState", "terminal", "command"
];

module.exports = ProcessList;
