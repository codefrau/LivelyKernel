module('lively.ide.tools.ShellCommandRunner').requires('lively.persistence.BuildSpec', 'lively.ide.CommandLineInterface', 'lively.ide.tools.CommandLine').toRun(function() {

lively.BuildSpec('lively.ide.tools.ShellCommandRunner', {
    _Extent: lively.pt(594.0,336.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "ShellCommandRunner",
    submorphs: [{
        _BorderWidth: 0,
        _Extent: lively.pt(588.0,311.0),
        _Fill: Color.rgb(180,180,180),
        _Position: lively.pt(3.0,22.0),
        className: "lively.morphic.Box",
        doNotSerialize: ['currentCommand'],
        lastFocused: {isMorphRef: true, name: "commandLine"},
        layout: {
            adjustForNewBounds: true,
            borderSize: 2,
            extentWithoutPlaceholder: lively.pt(686.0,362.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 3,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        name: 'ShellCommandRunner',
        submorphs: [{
            _AutocompletionEnabled: false,
            _BorderColor: Color.rgb(195,195,195),
            _Extent: lively.pt(579.0,266.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(4.7,4.7),
            _ShowActiveLine: false,
            _ShowGutter: false,
            _ShowIndents: false,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _TextMode: "text",
            _aceInitialized: true,
            accessibleInInactiveWindow: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            droppingEnabled: true,
            layout: { resizeHeight: true, resizeWidth: true },
            name: "output",
            storedString: "",
            theme: Config.get('aceWorkspaceTheme'),
            focus: function focus() {
            this.get("ShellCommandRunner").lastFocused = this;
            return $super();
        },
        },{
            _AutocompletionEnabled: true,
            _BorderColor: Color.rgb(195,195,195),
            _Extent: lively.pt(579.0,19.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(4.7,287.4),
            _ShowActiveLine: false,
            _ShowGutter: false,
            _ShowIndents: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _TextMode: "text",
            _aceInitialized: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            theme: Config.get('aceWorkspaceTheme'),
            clearOnInput: false,
            commandHistory: { index: 0, items: [], max: 30 },
            connections: {input: {}},
            inputChanged: "",
            isCommandLine: true,
            layout: { resizeWidth: true },
            name: "commandLine",
            sourceModule: "lively.ide.CodeEditor",
            storedString: "",
            style: {
                clipMode: "hidden",
                enableDragging: false,
                enableGrabbing: false,
                fontSize: 12,
                gutter: false
            },
            addCommandToHistory: function addCommandToHistory(cmd) {
                var hist = this.commandHistory,
                    items = hist.items;
                if (items.last() === cmd) return;
                items.push(cmd);
                if (items.length > hist.max) {
                    hist.items = items = items.slice(-hist.max);
                }
                hist.index = items.length - 1;
            },
            browseHistory: function browseHistory() {
                var cmdL = this;
                var items = this.commandHistory.items.map(function(item, i) {
                    return {isListItem: true, string: item, value: i}
                }).reverse();
                lively.ide.tools.SelectionNarrowing.chooseOne(items, function(err, i) {
                    Object.isNumber(i) && cmdL.setAndShowHistItem(i);
                    cmdL.focus.bind(cmdL).delay(0);
                });
            },
            setAndShowHistItem: function setAndShowHistItem(idx) {
                var hist = this.commandHistory, items = hist.items, len = items.length-1, i = hist.index;
                if (!Numbers.between(i, 0, len+1)) hist.index = i = len;
                else hist.index = i;
                if (this.getInput() !== items[i] && typeof items[i] !== 'undefined') this.setInput(items[i]);
            },
            clear: function clear() {
                $super();
                if (this.labelString) this.textString = this.labelString;
            },
            commandLineInput: function commandLineInput(text) {
                if (text.length > 0) this.addCommandToHistory(text);
                lively.bindings.signal(this, 'input', text);
                // for compatibility with old texts:
                lively.bindings.signal(this, 'savedTextString', text);
                this.clearOnInput && this.clear();
            },
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "textString", this, "inputChanged", {converter: 
        function (string) { return this.sourceObj.getInput(); }});
            lively.bindings.connect(this, "input", this.owner, "sendInput", {});
        },
            focus: function focus() {
                if (this.labelString) {
                    var p = this.getCursorPositionAce();
                    if (p && p.row === 0 && p.column < this.labelString.length) {
                        p.column = this.labelString.length;
                        this.withAceDo(function(ed) { ed.moveCursorToPosition(p); })
                    }
                }
                this.get("ShellCommandRunner").lastFocused = this;
                return $super();
            },
            getInput: function getInput() {
                var input = this.textString;
                if (this.labelString && input.indexOf(this.labelString) === 0) {
                    input = input.slice(this.labelString.length);
                }
                return input;
            },
            initCommandLine: function initCommandLine(ed) {
                this.isCommandLine = true;
                ed.renderer.scrollBar.element.style.display = 'none';
                ed.renderer.scrollBar.width = 0;
                ed.resize(true);
            },
            initializeAce: function initializeAce() {
                this.withAceDo(function(ed) { this.makeEditorLabelAware(ed); });
                lively.bindings.connect(this, 'textString', this, 'inputChanged', {
                    converter: function(string) { return this.sourceObj.getInput(); }
                });
                return $super();
            },
            makeEditorLabelAware: function makeEditorLabelAware(ed) {
                function offsetColumnForLabel(session, row, column) {
                        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                    var labelString = session.labelString;
                    if (!labelString || row !== 0) return column;
                    var lineString = session.getDisplayLine(row, null, 0, 0);
                    if (lineString.startsWith(labelString) && column < labelString.length) {
                        column = labelString.length;
                    }
                    return column;
                }
        
                ed.selection.moveCursorTo = ed.selection.moveCursorTo.wrap(function(proceed, row, column, keepDesiredColumn) {
                    column = offsetColumnForLabel(this.session, row, column);
                    return proceed(row, column, keepDesiredColumn);
                });
        
                ed.selection.setSelectionAnchor = ed.selection.setSelectionAnchor.wrap(function(proceed,row, column) {
                    column = offsetColumnForLabel(this.session, row,column);
                    return proceed(row, column);
                });
            },
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                this.reset();
            },
            onKeyDown: function onKeyDown(evt) {
                if (this.showsCompleter()) return $super(evt);
                var sig = evt.getKeyString();
                switch(sig) {
                    case 'Enter': this.commandLineInput(this.getInput()); evt.stop(); return true;
                    case 'Up':
                    case 'Control-Up':
                    case 'Alt-P': this.showPrevCommand(); this.focus(); evt.stop(); return true;
                    case 'Down':
                    case 'Alt-å': // "Alt-N"
                    case 'Control-Down': this.showNextCommand(); this.focus(); evt.stop(); return true;
                    case 'Alt-H': this.browseHistory(); evt.stop(); return true;
                    case 'Esc':
                    case 'Control-G': this.clear(); evt.stop(); return true;
                    default: return $super(evt);        
                }
            },
            onLoad: function onLoad() {
                $super();
                this.withAceDo(function(ed) { this.initCommandLine(ed); });
            },
            reset: function reset() {
                this.commandHistory = {items: [], max: 30, index: 0};
                this.connections = {input: {}};
            },
            setInput: function setInput(text) {
                if (this.labelString) text = this.labelString + text;
                return this.textString = text;
            },
            setLabel: function setLabel(labelString) {
                var textString = this.textString;
                if (this.labelString && this.textString.indexOf(this.labelString) === 0) {
                    textString = textString.slice(this.labelString.length);
                }
                this.labelString = labelString;
                this.withAceDo(function(ed) { ed.session.labelString = labelString; });
                this.setInput(textString);
            },
            showHistItem: function showHistItem(dir) {
                dir = dir || 'next';
                var hist = this.commandHistory, items = hist.items, len = items.length-1, i = hist.index;
                if (!Numbers.between(i, 0, len+1)) hist.index = i = len;
                if (this.getInput() !== items[i] && typeof items[i] !== 'undefined') { this.setInput(items[i]); return; }
                if (dir === 'next') {
                    if (i > len) return;
                    i = ++hist.index;
                } else {
                    if (i <= 0) return;
                    i = --hist.index;
                }
                this.setInput(items[i] || '');
            },
            showNextCommand: function showNextCommand() {
                this.showHistItem('next');
            },
            showPrevCommand: function showPrevCommand() {
                this.showHistItem('prev');
            },
            getPrefixForShellCompletion: function getPrefixForShellCompletion() {
                var raw = this.find({asString: true, needle: ' ', preventScroll: true, backwards: true, inbetween: true});
                return raw ? raw.trim() : '';
            },
            
            withShellCompletionsDo: function withShellCompletionsDo(input, thenDo) {
                if (input && input.length) input = " '" + input + "'";
                else input = "";
                var results = {};
                var i = 0;
                [{cmd: 'compgen  -f', type: 'file'},
                 {cmd: 'compgen  -d', type: 'dir'}
                ].doAndContinue(function(next, ea) {
                    lively.shell.exec(ea.cmd + input, function(cmd) {
                        var out = cmd.getStdout().trim();
                        var lines = Strings.lines(out);
                        lines.forEach(function(line) { results[line] = {type: ea.type, rank: null, inverseRank: i}; });
                        next();
                    });
                }, function() {
                    var num = Object.keys(results).length;
                    Properties.forEachOwn(function(_, val) {
                        val.rank = num - val.inverseRank; });
                    thenDo(null, results);
                });
            },
            
            doListProtocol: function doListProtocol() {
                var ed = this;
                var prefix = this.getPrefixForShellCompletion();
                this.withShellCompletionsDo(prefix, function(err, completions) {
                    if (err) { return; }
                    var items = Properties.forEachOwn(completions, function(string, val) {
                        string = string + (val.type === 'dir' ? '/' : '');
                        return {
                            isListItem: true,
                            string: Strings.format("[%s] %s", val.type, string),
                            value: string,
                            rank: val.rank
                        }
                    }).sortByKey('rank');
                    lively.ide.tools.SelectionNarrowing.chooseOne(items,
                        function(err, option) {
                            if (!option) return;
                            ed.find({backwards: true, needle: prefix});
                            ed.insertAtCursor(option, false, true);
                        }, {})
                });
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                //     completer = {
                //     getCompletions: function (editor, session, pos, _, callback) {
                //         var prefix = editor.$morph.getPrefixForShellCompletion();
                //         editor.$morph.withShellCompletionsDo(prefix, function(err, result) {
                //             if (err) { callback(err, []); return; }
                //             var completions = Properties.forEachOwn(result, function(string, val) {
                //                 var value = string + (val.type === 'dir' ? '/' : '');
                //                 return {
                //                     name: string,
                //                     value: value,
                //                     score: 9999999+ val.rank,
                //                     meta: val.type,
                //                 }
                //             });
                //             callback(null, completions);
                //         });
                //     }
                // }
                // // that.aceEditor.completers.push(completer)
                // // that.aceEditor.completers.pop()
            
            }
        }],
        onClose: function onClose(cmd) {
        this.getWindow().setTitle(cmd.getCommand() + ' [exited, ' + cmd.getCode() + ']');
        this.currentCommand = null;
    },
        onPid: function onPid(pid) {
        var cmd = this.currentCommand;
        this.getWindow().setTitle(cmd.getCommand() + ' [running, pid ' + pid + ']');
    },
        onStart: function onStart(cmd) {
        this.currentCommand = cmd;
        this.getWindow().setTitle(cmd.getCommand() + ' [running]');
    },
        onStderr: function onStderr(string) {
        this.print(string);
    },
        onStdout: function onStdout(string) {
        this.print(string);
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        if (!this.lastFocused) this.lastFocused = this.get('commandLine')
        this.lastFocused.focus();
    },
        print: function print(string) {
        this.get('output').append(string);
    },
        onKeyDown: function onKeyDown(evt) {
        var sig = evt.getKeyString();
        switch(sig) {
            case 'Alt-Up': case 'F1': this.get('output').focus(); evt.stop(); return true;
            case 'Alt-Down': case 'F2': this.get('commandLine').focus(); evt.stop(); return true;
            case 'Control-C': this.killCommand('SIGINT'); evt.stop(); return true;
            case 'Control-D': this.killCommand('SIGQUIT'); evt.stop(); return true;
            case 'Esc': this.killCommand('SIGKILL'); evt.stop(); return true;
            default: return $super(evt);        
        }
    },
        reset: function reset() {
        this.doNotSerialize = ['currentCommand'];
        lively.bindings.connect(this.get('commandLine'), 'input', this, 'sendInput');
        this.getWindow().setTitle('execute Shell command');
        this.get('commandLine').textString = '';
        this.get('output').textString = '';
    },
        sendInput: function sendInput(input) {
        var cmd = this.currentCommand;
        if (cmd && cmd.isRunning()) cmd.write(input+'\n');
        else this.runCommand(input);
    },
        runCommand: function runCommand(command) {
        this.get('output').textString = '';
        var cmd = new lively.ide.CommandLineInterface.PersistentCommand(command);
        var self = this, listener = {
            onPid: function(pid) { self.onPid(pid); },
            onOut: function(out) { self.onStdout(out); },
            onErr: function(err) { self.onStderr(err); },
            onClose: function(cmd) { self.onClose(cmd); }
        };
        lively.bindings.connect(cmd, 'pid', listener, 'onPid');
        lively.bindings.connect(cmd, 'stdout', listener, 'onOut');
        lively.bindings.connect(cmd, 'stderr', listener, 'onErr');
        lively.bindings.connect(cmd, 'end', listener, 'onClose', {
            updater: function($upd, cmd) {
                lively.bindings.disconnectAll(this.sourceObj);
                $upd(cmd);
            }
        });
        cmd.start();
        this.onStart(cmd);
    },
        killCommand: function killCommand(signal) {
        var cmd = this.currentCommand;
        if (!cmd) { show('No command running!'); return; }
        if (cmd._killed) { // was killed already?
            cmd.checkIfCommandIsStillAttachedAndRunning();
        } else {
            cmd.kill(signal);
        }
    },
    }],
    titleBar: "execute Shell command",
    runCommand: function runCommand(command) {
    return this.targetMorph.runCommand(command);
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
    $super();
    var cmdLine = this.get('commandLine');
    (function() {
        cmdLine.commandHistory = lively.ide.tools.CommandLine.getHistory('lively.ide.execShellCommand');
    }).delay(0);
}
});


}) // end of module