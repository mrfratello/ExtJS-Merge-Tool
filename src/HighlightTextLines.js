/*
 * Highlight Text Lines for ExtJS 6 (ux Component)
 * version: 0.1.0
 * author: John Syomochkin
 */
Ext.define('HighlightTextLines',{
    extend: 'Ext.panel.Panel',
    alias: 'widget.highlighttextlines',

    config: {
        text: "",

        highlightLines: "",
        lineNumbers: false,
        lineWrapping: false,

        // private
        lines_to_highlight: [],
    },

    cls: 'HighlightTextLines',
    layout: {
        type: 'vbox',
        align: 'stretch',
    },

    items: [
        {
            xtype: 'box',
            flex: 1,
            cls: 'codemirror-input-box',
            style: {
                lineHeight: '1.6em',
            },
        }
    ],
    dockedItems: [
        {
            xtype: 'toolbar',
            dock: 'top',
            items: [
                {
                    text: 'Prev highlighting',
                    action: 'codemirror-prev-highlighted-line',
                    listeners: {
                        click: function(button){
                            var me = button.up('highlighttextlines');
                            me.goToHighlighting(-1);
                        },
                    },
                },
                '-',
                {
                    text: 'Next highlighting',
                    action: 'codemirror-next-highlighted-line',
                    listeners: {
                        click: function(button){
                            var me = button.up('highlighttextlines');
                            me.goToHighlighting(1);
                        },
                    },
                },
                '-',
                {
                    text: 'Options',
                    menu: [
                        {
                            xtype: 'menucheckitem',
                            text: 'Line Numbers',
                            action: 'codemirror-toggle-linenumbers',
                            listeners: {
                                checkchange: function(item, check){
                                    var me = item.up('highlighttextlines');
                                    me.lineNumbers = check;
                                    me.updateCodeMirrorOptions();
                                },
                            },
                        },
                        {
                            xtype: 'menucheckitem',
                            text: 'Line Wrap',
                            action: 'codemirror-toggle-linewrapping',
                            listeners: {
                                checkchange: function(item, check){
                                    var me = item.up('highlighttextlines');
                                    me.lineWrapping = check;
                                    me.updateCodeMirrorOptions();
                                },
                            },
                        },
                    ],
                },
                '-',
                {
                    text: 'Find',
                    action: 'codemirror-find',
                    listeners: {
                        click:  function(button){
                            var me = button.up('highlighttextlines');
                            me.find();
                        },
                    },
                },
                '-'
            ],
        },
    ],
    listeners: {
        render: "initCodeMirror",
    },

    initCodeMirror: function(){
        var me = this,
            el = me.getEl(),
            codemirror_box = el.down('.codemirror-input-box', true);
        codemirror_box.innerHTML = "";
        me.highlight_text = CodeMirror( codemirror_box, {
            value: me.text,
            readOnly: true,
        });
        me.updateViewTools();
        setTimeout(function(){
            me.updateCodeMirrorOptions();
            me.initHighlightLines();
        }, 100);
    },

    initHighlightLines: function(){
        var me = this,
            lines = me.highlightLines.split(',');
        me.current_line_index = -1;
        me.lines_to_highlight = [];

        for (var i = 0; i < lines.length; i++){
            var line = lines[i].trim();
            me.markLines(line);
        }
        me.initScrollPosition();
    },

    initScrollPosition: function(){
        var me = this;

        me.lines_to_highlight.sort(function(a, b){
            return a - b;
        });
        me.goToHighlighting(1);
    },

    updateViewTools: function(){
        var me = this,
            line_numbers_item = me.down('[action=codemirror-toggle-linenumbers]'),
            line_wrapping_item = me.down('[action=codemirror-toggle-linewrapping]');

        line_numbers_item.setChecked(me.lineNumbers, true);
        line_wrapping_item.setChecked(me.lineWrapping, true);
    },

    updateCodeMirrorOptions: function(){
        var me = this;
        me.highlight_text.setOption('lineNumbers', me.lineNumbers );
        me.highlight_text.setOption('lineWrapping', me.lineWrapping );
    },

    find: function(){
        var me = this;
        me.highlight_text.execCommand('findPersistent');
    },

    markLines: function(line_string){
        var me = this,
            doc = me.highlight_text.getDoc(),
            lines_list = line_string.split('-'),
            max_line = doc.lineCount(),
            line;

        if (lines_list.length == 1){
            line = parseInt(lines_list[0]) - 1;

            if ( line <= max_line){
                me.lines_to_highlight.push(line);
                doc.addLineClass(line, 'background', 'highlight_text_line');
            }
        } else if (lines_list.length == 2) {
            var line_start = parseInt(lines_list[0]) - 1,
                line_end = parseInt(lines_list[1]) - 1,
                is_push_in_list = false;

            for (line = line_start; line <= line_end; line++){
                if ( line <= max_line){
                    if (!is_push_in_list) {
                        me.lines_to_highlight.push(line);
                        is_push_in_list = true;
                    }
                    doc.addLineClass(line, 'background', 'highlight_text_line');
                }
            }
        }
    },

    goToHighlighting: function(direction){
        var me = this,
            highlight_text = me.highlight_text,
            cursor_coords,
            current_line;

        me.current_line_index += direction;
        me.checkCurrentLineIndex();
        current_line = me.lines_to_highlight[me.current_line_index];
        cursor_coords = highlight_text.cursorCoords({line: current_line, ch: 0}, "local"),
        highlight_text.scrollTo(0, cursor_coords.top);
    },

    checkCurrentLineIndex: function(){
        var me = this,
            next_highligting_button = me.down('[action="codemirror-next-highlighted-line"]'),
            prev_highligting_button = me.down('[action="codemirror-prev-highlighted-line"]');

        me.current_line_index = (me.current_line_index < 0) ? 0 : me.current_line_index;
        me.current_line_index = (me.current_line_index > (me.lines_to_highlight.length - 1)) ? me.lines_to_highlight.length - 1 : me.current_line_index;

        if ( me.current_line_index <= 0 ){
            prev_highligting_button.setDisabled(true);
        } else {
            prev_highligting_button.setDisabled(false);
        }
        if ( me.current_line_index >= (me.lines_to_highlight.length - 1) ){
            next_highligting_button.setDisabled(true);
        } else {
            next_highligting_button.setDisabled(false);
        }
    },

    setupText: function(text){
        var me = this;
        me.text = text;
        me.initCodeMirror();
    },

    setupHighlightLines: function(ranges){
        var me = this;
        me.highlightLines = ranges;
        me.initCodeMirror();
    }
});
