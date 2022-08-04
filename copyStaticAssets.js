const shell = require("shelljs");

shell.cp("resources/icon.*", "release-builds/internet-speed-monitor-linux-x64/resources/");
shell.mkdir("-p", "release-builds/internet-speed-monitor-linux-x64/core");
shell.cp("-R", "core/ookla-speedtest/", "release-builds/internet-speed-monitor-linux-x64/core/");

