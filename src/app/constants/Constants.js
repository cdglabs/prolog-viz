var keyMirror = require('keymirror');

module.exports = {

  ActionTypes: keyMirror({

    DID_MOUNT: null,

    CHANGE_TEXT: null,

    HIGHLIGHT_NODE: null,

    HIGHLIGHT_TOP_LEVEL_NODE: null,

    CHANGE_CURSOR_INDEX: null,

    CHANGE_ARGS_TEXT: null,

    STEP_FORWARD: null,
    STEP_BACKWARD: null,
    SET_STEP: null,

    SET_SHOW_COMPATIBLE: null,

  }),


  PayloadSources: keyMirror({
    SERVER_ACTION: null,
    VIEW_ACTION: null
  }),

};
