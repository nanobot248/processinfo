<<<<<<< HEAD
=======
/**
  Provides classes for a list of processes.

  @module processinfo
*/

>>>>>>> 031ed4100eedb1f586c6411c380ba472e952a753
var exec = require("child_process").exec;

var TableParser = function() {
  var schedulingClasses = {
    "-":   null,
    "?":   undefined,
    "TS":  "SCHED_OTHER",
    "FF":  "SCHED_FIFO",
    "RR":  "SCHED_RR",
    "B":   "SCHED_BATCH",
    "ISO": "SCHED_ISO",
    "IDL": "SCHED_IDLE"
  };

  var processStates = {
    "D": "UNINTERRUPTIBLE_SLEEP",
    "R": "ON_RUN_QUEUE",
    "S": "INTERRUPTIBLE_SLEEP",
    "T": "STOPPED",
    "W": "PAGING",
    "X": "DEAD",
    "Z": "ZOMBIE"
  };

  var additionalProcessStates = {
    "<": function(state) { state.priority = "HIGH"; },
    "N": function(state) { state.priority = "LOW"; },
    "L": function(state) { state.hasLockedPages = true; },
    "s": function(state) { state.isSessionLeader = true; },
    "l": function(state) { state.isMultiThreaded = true; },
    "+": function(state) { state.isForegroundProcess = true; }
  };

  var columnNames = {
    "pid":     "processId",
    "ppid":    "parentProcessId",
    "lwp":     "threadId",
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
    "nlwp":    "threadCount",
    "wchan":   "waitingChannel",
    "psr":     "processorId",
    "rss":     "residentSetSize",
    "vsz":     "virtualMemorySize",
    "stat":    "processState",
    "tt":      "terminal",
    "command": "command"
  };

  var columnParsers = {
    "processId":         parseInt,
    "parentProcessId":   parseInt,
    "threadId":          parseInt,
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
  
  this.parse = function(input) {
    var rawLines = input.replace(/\r/g, "\n").replace(/\n+/g, "\n").split("\n");
    var columns = rawLines[0].trim().toLowerCase().replace(/[ \t]+/g, " ").split(" ");
    for(var i = 0; i < columns.length; i++) {
      if(columns[i] in columnNames) { columns[i] = columnNames[columns[i]]; }
    }

    var results = [];
    for(var i = 1; i < rawLines.length; i++) {
      var result = {};
      var line = rawLines[i].trim();
      if(line == null || line.length < 1) { continue; }
      var parts = line.replace(/[ \t]+/g, " ").split(" ");
      for(var j = 0; j < columns.length - 1; j++) {
        if(columnParsers[columns[j]] != null) {
          result[columns[j]] = columnParsers[columns[j]](parts[j]);
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

<<<<<<< HEAD
var ProcessList = function() {
  var cmd = "ps -A -o pid,ppid,lwp,euid,euser,egid,egroup,suid,suser,sgid,sgroup,fuid,fuser,fgid,fgroup,ruid,ruser,rgid,rgroup,%cpu,%mem,cls,etimes,pri,rtprio,nice,nlwp,wchan,psr,rss,vsz,stat,tty,args H";
=======
/**
  Class for retrieving a list of running processes including process information.

  @class ProcessList
  @constructor
*/
var ProcessList = function() {
  var cmd = "ps -A -o pid,ppid,lwp,euid,euser,egid,egroup,suid,suser,sgid,sgroup,fuid,fuser,fgid,fgroup,ruid,ruser,rgid,rgroup,%cpu,%mem,cls,etimes,pri,rtprio,nice,nlwp,wchan,psr,rss,vsz,stat,tty,args";
>>>>>>> 031ed4100eedb1f586c6411c380ba472e952a753
  var parser = new TableParser();

  var rawList = function(callback) {
    exec(cmd, function(err, stdout, stderr) {
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

<<<<<<< HEAD
=======
  /**
    Get process information for all processes. The list is an array of objects. Each object
    represents a single process with a lot of information about the process.
    Inspect the return value in a REPL for more information.

    @method get
    @return {array} An array of processes with process information.
  */
>>>>>>> 031ed4100eedb1f586c6411c380ba472e952a753
  this.get = function(callback) {
    var list = rawList(function(err, data) {
      var processes = parser.parse(data);
      callback(null, processes);
    });
  };

}

module.exports = ProcessList;
