/*
 * Merge Tool for ExtJS 6 (ux Component)
 * version: 0.1.0
 * author: John Syomochkin
 */
Ext.define('Ext.ux.MergeTool',{
    extend: 'Ext.panel.Panel',
    alias: 'widget.mergetoolpanel',

    config: {
        textLeft: '',
        textRight: '',

        lineNumbers: false,
        lineWrapping: false,
        collapseIdentical: 0,

        current_diff: -1,
        count_diff: 0,
        selection_diff: []
    },
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    items: [
        {
            xtype: 'box',
            flex: 1,
            cls: 'codemirror-input-box',
            style: {
                lineHeight: '1.6em'
            }
        }
    ],

    dockedItems: [
        {
            xtype: 'toolbar',
            dock: 'top',
            items: [
                {
                    text: 'Prev Diff',
                    action: 'codemirror-prev-diff',
                    listeners: {
                        click:  function(button) {
                            var me = button.up( 'mergetoolpanel' );
                            me.goToDiff( -1 );
                        }
                    }
                },
                '-',
                {
                    text: 'Next Diff',
                    action: 'codemirror-next-diff',
                    listeners: {
                        click: function(button) {
                            var me = button.up( 'mergetoolpanel' );
                            me.goToDiff( 1 );
                        }
                    }
                },
                {
                    text: 'Go to Diff',
                    action: 'codemirror-one-diff',
                    hidden: true,
                    listeners: {
                        click: function(button) {
                            var me = button.up( 'mergetoolpanel' );
                            me.goToDiff( 1 );
                        }
                    }
                },
                {
                    text: 'No diffs',
                    action: 'codemirror-no-diffs',
                    disabled: true,
                    hidden: true
                },
                '-',
                {
                    text: 'Go to line',
                    action: 'codemirror-goto-line',
                    listeners: {
                        click: function(button) {
                            var me = button.up( 'mergetoolpanel' );
                            me.goToLine( button );
                        }
                    }
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
                                checkchange: function(item, check) {
                                    var me = item.up('mergetoolpanel');
                                    me.lineNumbers = check;
                                    me.updateCodeMirrorOptions();
                                }
                            }
                        },
                        {
                            xtype: 'menucheckitem',
                            text: 'Line Wrap',
                            action: 'codemirror-toggle-linewrapping',
                            listeners: {
                                checkchange: function(item, check){
                                    var me = item.up('mergetoolpanel');
                                    me.lineWrapping = check;
                                    me.updateCodeMirrorOptions();
                                }
                            }
                        },
                        {
                            xtype: 'menucheckitem',
                            text: 'Collapse Identical',
                            action: 'codemirror-toggle-collapse',
                            listeners: {
                                checkchange: function(item, check){
                                    var me = item.up('mergetoolpanel');
                                    me.collapseIdentical = (check) ? 1 : 0;
                                    me.initCodeMirror();
                                }
                            }
                        }
                    ]
                },
                '-',
                {
                    text: 'Find',
                    menu: [
                        {
                            text: 'Left',
                            action: 'codemirror-find-left',
                            listeners: {
                                click:  function(button){
                                    var me = button.up('mergetoolpanel');
                                    me.find('left');
                                }
                            }
                        },
                        {
                            text: 'Right',
                            action: 'codemirror-find-right',
                            listeners: {
                                click:  function(button){
                                    var me = button.up('mergetoolpanel');
                                    me.find('right');
                                }
                            }
                        }
                    ]
                },
                '-'
            ]
        }
    ],

    listeners: {
        render: "initCodeMirror"
    },

    initCodeMirror: function() {
        var me = this,
            el = me.getEl(),
            codemirror_box = el.down('.codemirror-input-box', true);
        codemirror_box.innerHTML = "";
        me.merge_tool = CodeMirror.MergeView( codemirror_box, {
            origLeft: me.textLeft,
            value: me.textRight,
            revertButtons: false,
            readOnly: true,
            collapseIdentical: me.collapseIdentical
        });
        me.updateViewTools();
        setTimeout(function(){
            me.updateCodeMirrorOptions();
        }, 100);
        me.initDiffs();
    },

    updateViewTools: function(){
        var me = this,
            line_numbers_item = me.down('[action=codemirror-toggle-linenumbers]'),
            line_wrapping_item = me.down('[action=codemirror-toggle-linewrapping]'),
            line_collapse_item = me.down('[action=codemirror-toggle-collapse]');

        line_numbers_item.setChecked(me.lineNumbers, true);
        line_wrapping_item.setChecked(me.lineWrapping, true);
        line_collapse_item.setChecked(me.collapseIdentical, true);
    },

    updateCodeMirrorOptions: function(){
        var me = this;
        me.setOption('lineNumbers', me.lineNumbers );
        me.setOption('lineWrapping', me.lineWrapping );
    },

    initDiffs: function(){
        var me = this,
            merge_tool = me.merge_tool,
            codemirror_left = merge_tool.leftOriginal(),
            view = codemirror_left.state.diffViews,
            selection_chunks = [],

            prev_button = me.down('[action="codemirror-prev-diff"]'),
            next_button = me.down('[action="codemirror-next-diff"]'),
            one_button = me.down('[action="codemirror-one-diff"]'),
            nodiff_button = me.down('[action="codemirror-no-diffs"]');
        if (view){
            for (var i = 0; i < view.length; i++){
                selection_chunks = Ext.Array.merge(selection_chunks, view[i].chunks);
            }
        }
        me.selection_diffs = selection_chunks;
        me.count_diff = selection_chunks.length - 1;
        if (me.count_diff == 0){
            prev_button.hide();
            prev_button.next('tbseparator').hide();
            next_button.hide();
            one_button.show();
        } else if (me.count_diff == -1){
            prev_button.hide();
            prev_button.next('tbseparator').hide();
            next_button.hide();
            nodiff_button.show();
        }
        me.checkCurrentDiff();
    },

    setOption: function(option, value){
        var me = this,
            merge_tool = me.merge_tool,
            codemirror_left = merge_tool.leftOriginal(),
            codemirror_right = merge_tool.editor();
        codemirror_left.setOption(option, value);
        codemirror_right.setOption(option, value);

        me.updateGapView();
    },

    updateGapView: function(){
        var me = this,
            merge_tool = me.merge_tool,
            views = merge_tool.leftOriginal().state.diffViews;
        if (views){
            for (var i = 0; i < views.length; i++){
                views[i].forceUpdate();
            }
        }
    },

    goToDiff: function(direction){
        var me = this,
            merge_tool = me.merge_tool,
            codemirror_left = merge_tool.leftOriginal(),
            codemirror_right = merge_tool.editor();

        me.current_diff += direction;
        me.checkCurrentDiff();
        var chunk = me.selection_diffs[me.current_diff],
            cursor_coords_left = codemirror_left.cursorCoords({line: chunk.origFrom - 1, ch: 0}, "local"),
            cursor_coords_right = codemirror_right.cursorCoords({line: chunk.editFrom - 1, ch: 0}, "local");

        merge_tool.scrollUnLock();
        codemirror_left.scrollTo(0, cursor_coords_left.top);
        codemirror_right.scrollTo(0, cursor_coords_right.top);
        merge_tool.scrollLock();
        var selection_right = {
                anchor: {
                    line: chunk.editFrom,
                    ch: 0
                },
                head: {
                    line: chunk.editTo,
                    ch: 0
                }
            },
            selection_left = {
                anchor: {
                    line: chunk.origFrom,
                    ch: 0
                },
                head: {
                    line: chunk.origTo,
                    ch: 0
                }
            };
        codemirror_left.setSelection(selection_left.anchor, selection_left.head);
        codemirror_right.setSelection(selection_right.anchor, selection_right.head);
    },

    checkCurrentDiff: function(){
        var me = this,
            next_diff_button = me.down('[action="codemirror-next-diff"]'),
            prev_diff_button = me.down('[action="codemirror-prev-diff"]');

        me.current_diff = (me.current_diff < -1) ? -1 : me.current_diff;
        me.current_diff = (me.current_diff > me.count_diff) ? me.count_diff : me.current_diff;

        if ( me.current_diff <= 0 ){
            prev_diff_button.setDisabled(true);
        } else {
            prev_diff_button.setDisabled(false);
        }
        if ( me.current_diff >= me.count_diff ){
            next_diff_button.setDisabled(true);
        } else {
            next_diff_button.setDisabled(false);
        }
    },

    goToLine: function(call_button){
        var me = this,
            merge_tool = me.merge_tool,
            codemirror_left = merge_tool.leftOriginal(),
            codemirror_right = merge_tool.editor();

        Ext.create('Ext.window.Window',{
            autoShow: true,
            title: 'Go to Line',
            modal: true,
            resizable: false,
            alignTarget: call_button,
            defaultAlign: 't',
            width: 200,
            layout: 'fit',
            items: [
                {
                    xtype: 'numberfield',
                    fieldLabel: 'Line number',
                    labelWidth: '50%',
                    //padding: 5,
                    margin: 5,
                    allowBlank: false,
                    minValue: 1,
                    msgTarget: 'side'
                }
            ],
            buttons: [
                {
                    text: 'Go',
                    listeners: {
                        click: function(button){
                            var wind = button.up('window'),
                                number = wind.down('numberfield');

                            if (number.isValid()) {
                                var line = number.getValue() - 1,
                                    left_pos = codemirror_left.cursorCoords({line: line, ch: 0}, 'local'),
                                    right_pos = codemirror_right.cursorCoords({line: line, ch: 0}, 'local');
                                codemirror_left.scrollTo(0, left_pos.top);
                                codemirror_right.scrollTo(0, right_pos.top);
                                wind.close();
                            }
                        }
                    }
                },
                {
                    text: 'Cancel',
                    listeners: {
                        click: function(button){
                            button.up('window').close();
                        }
                    }
                }
            ]
        });
    },

    find: function(side){
        var me = this,
            merge_tool = me.merge_tool,
            codemirror_left = merge_tool.leftOriginal(),
            codemirror_right = merge_tool.editor();

        if (side == 'left'){
            codemirror_left.execCommand('findPersistent');
        } else {
            codemirror_right.execCommand('findPersistent');
        }
    },

    /**
     * Setup text on left panel
     * @param text_left
     */
    setLeftText: function(text_left){
        var me = this;
        me.setTexts(text_left, me.textRight);
    },

    /**
     * Setup text on right panel
     * @param text_right
     */
    setRightText: function(text_right){
        var me = this;
        me.setTexts(me.textLeft, text_right);
    },

    /**
     * Setup text on left and right panels
     * @param text_left
     * @param text_right
     */
    setTexts: function(text_left, text_right){
        var me = this;
        me.textLeft = text_left;
        me.textRight = text_right;
        me.initCodeMirror();
    }
});
