/*

TODO:

-- The cursor should always be visible
  * Right now I'm using node.scrollIntoView(). This is annoying b/c it always happens, even when the editor
    doesn't have focus.
  * The check to see if it's already showing doesn't seem to be right.

-- up and down arrow keys
-- selections
-- copy and paste

*/

var k = require('keymaster').noConflict();
var React = require('react');
var assign = require('object-assign');

var Classable = require('../../mixins/classable.js');
// var WindowListenable = require('../../mixins/window-listenable.js');
var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');


function getStateFromStores() {
  return {
    text : EditorStore.getText(),
    cursorPos : EditorStore.getCursorPos(),
  };
}

var nextIdNum = 0;

var Editor = React.createClass({
  mixins: [Classable],

  getInitialState: function() {
    return getStateFromStores();
  },

  getDefaultProps: function() {
    return {
      cursorRect: {
        left: 10,
        top: 10,
        height: 24,
      }
    };
  },

  componentDidMount: function() {
    EditorStore.addChangeListener(this._onChange);
    EditorActionCreators.didMount();

    this.editorID = 'editor_id_' + nextIdNum++;

    var self = this;

    k('left',               this.editorID, function() { self._cursorLeft();  return false; });
    k('right',              this.editorID, function() { self._cursorRight(); return false; });
    k('up',                 this.editorID, function() { EditorActionCreators.cursorUp();    return false; });
    k('down',               this.editorID, function() { EditorActionCreators.cursorDown();  return false; });
    k('home, command+left', this.editorID, function() { EditorActionCreators.home();        return false; });
    k('end, command+right', this.editorID, function() { EditorActionCreators.end();         return false; });
    k('backspace',          this.editorID, function() { EditorActionCreators.backspace();   return false; });
    k('enter',              this.editorID, function() { EditorActionCreators.keyPress('\n');  return false; });
  },

  componentWillUnmount: function() {
    EditorStore.removeChangeListener(this._onChange);
  },

  /**
   * Event handler for 'change' events coming from the stores
   */
  _onChange: function() {
    this.setState(getStateFromStores());
  },

  _cursorLeft: function() {
    EditorActionCreators.updateCursor(this.state.cursorPos-1);
  },

  _cursorRight: function() {
    EditorActionCreators.updateCursor(this.state.cursorPos+1);
  },

  _onBlur: function() {
    k.setScope('');
  },

  _onFocus: function() {
    k.setScope(this.editorID);
  },

  _onKeyPress: function(e) {
    if (e.charCode > 0 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // this.insert(String.fromCharCode(e.charCode));
      EditorActionCreators.keyPress(String.fromCharCode(e.charCode));
    } else {
      e.stopPropagation();
    }
  },

  _onMouseDown: function() {
    // var target = this.getNodeAt(e.clientX, e.clientY);
    // var pos = this.getCursorPosFor(target, e.clientX, e.clientY);
    // if (pos >= 0) {
    //   this.setCursorPos(pos);
    // }

    // console.log('down');

  },

  render: function() {
    var classes = this.getClasses('editor', {
      // 'editor': true,
    });

    return (
      <div className={classes}
        onBlur={this._onBlur} onFocus={this._onFocus} onKeyPress={this._onKeyPress} onMouseDown={this._onMouseDown}
        tabIndex={0}>
        <Cursor top={this.props.cursorRect.top} left={this.props.cursorRect.left} height={this.props.cursorRect.height}/>
        {this.props.children}

      </div>
      );
    }
});

module.exports = Editor;
