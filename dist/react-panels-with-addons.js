/*
 * react-panels
 * https://github.com/Theadd/react-panels
 *
 * Copyright (c) 2015 R.Beltran https://github.com/Theadd
 * Licensed under the MIT license.
 */

(function() {


var Utils = {
  pixelsOf: function (value) {
    var val = parseInt(value) || 0
    return (val) ? String(val) + "px" : "0";
  }
};

var FloatingPanel = React.createClass({
  displayName: 'FloatingPanel',

  getDefaultProps: function () {
    return {
      "left": 0,
      "top": 0,
      "width": 420,
      "style": {}
    };
  },

  getInitialState: function () {
    this._pflag = true;

    return {
      left: parseInt(this.props.left),
      top: parseInt(this.props.top),
      width: parseInt(this.props.width)
    };
  },

  getSelectedIndex: function () {
    return this.refs.panel.getSelectedIndex();
  },

  setSelectedIndex: function (index) {
    this.refs.panel.setSelectedIndex(index);
    this._pflag = true;
    this.forceUpdate();
  },

  dragStart: function (e) {
    this.panelBounds = {
      startLeft: this.state.left,
      startTop: this.state.top,
      startPageX: e.pageX,
      startPageY: e.pageY
    };

    try {
      var img = document.createElement("img");
      img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABmJLR0QA/wD/AP+gvaeTAAAADUlEQVQI12NgYGBgAAAABQABXvMqOgAAAABJRU5ErkJggg==";
      img.width = 1;
      e.dataTransfer.setData('text/plain', "Panel");
      e.dataTransfer.setDragImage(img, -1000, -1000);
    } catch (err) { /* Fix for IE */ }

    window.addEventListener('dragover', this.dragOver);
  },

  dragEnd: function() {
    delete this.panelBounds;
    window.removeEventListener('dragover', this.dragOver);
  },

  dragOver: function(e) {
    if (this.panelBounds || false) {
      var left = this.panelBounds.startLeft + (e.pageX - this.panelBounds.startPageX),
        top = this.panelBounds.startTop + (e.pageY - this.panelBounds.startPageY);
      this.setState({ left: left, top: top });
    }
  },

  render: function() {
    var self = this,
      transform = "translate3d(" + Utils.pixelsOf(self.state.left) + ", " + Utils.pixelsOf(self.state.top) + ", 0)",
      wrapperStyle = React.addons.update({
        WebkitTransform: transform,
        MozTransform: transform,
        msTransform: transform,
        transform: transform,
        width: Utils.pixelsOf(self.state.width),
        position: "absolute"
      }, {$merge: self.props.style});

    if (self._pflag) {
      var props = React.addons.update(self.props, {$merge: {style: {}}});
      delete props.style;

      self.inner = (
        React.createElement(Panel, React.__spread({},  props, {ref: "panel", onDragStart: self.dragStart, onDragEnd: self.dragEnd, floating: true}), 
          self.props.children
        )
      );
      self._pflag = false;
    }

    return (
      React.createElement("div", {className: "react-panel-wrapper", style: wrapperStyle}, 
        self.inner
      )
    );
  }

});

var Panel = React.createClass({
  displayName: 'Panel',

  getDefaultProps: function () {
    return {
      "icon": false,
      "title": "",
      "selectedIndex": 0,
      "autocompact": true,
      "floating": false,
      "onDragStart": null,
      "onDragEnd": null,
      "maxTitleWidth": 130
    };
  },

  getInitialState: function () {
    return {
      selectedIndex: parseInt(this.props.selectedIndex),
      compacted: (this.props.autocompact)
    };
  },

  getSelectedIndex: function () {
    return this.state.selectedIndex;
  },

  setSelectedIndex: function (index) {
    this.setState({selectedIndex: parseInt(index)});
    this.forceUpdate();
  },

  _getIcon: function () {
    var icon = null;

    if (this.props.icon) {
      icon = (
        React.createElement("span", {className: "panel-icon"}, 
          React.createElement("i", {className: this.props.icon})
        )
      );
    }

    return icon;
  },

  handleClick: function (event, index) {
    if (typeof this.props.onTabClick === "function") {
      if (this.props.onTabClick(index, this) !== false) {
        this.setSelectedIndex(index);
      }
    } else {
      this.setSelectedIndex(index);
    }
  },

  componentDidMount: function () {
    var tabsStart = this.refs['tabs-start'].getDOMNode(),
      tabsEnd = this.refs['tabs-end'].getDOMNode(),
      using = this.refs.tabs.getDOMNode().offsetWidth,
      total = tabsEnd.offsetLeft - (tabsStart.offsetLeft + tabsStart.offsetWidth);

    if (using * 2 <= total) {   // TODO: ... * 2 is obviously not what it should be
      this.setState({compacted: false});
    }
  },

  componentWillReceiveProps: function(nextProps) {
    var childs = React.Children.count(this.props.children),
      next_childs = React.Children.count(nextProps.children);

    if (next_childs > childs && this.props.autocompact && !this.state.compacted) {
      var tabsStart = this.refs['tabs-start'].getDOMNode(),
        tabsEnd = this.refs['tabs-end'].getDOMNode(),
        using = this.refs.tabs.getDOMNode().offsetWidth,
        total = tabsEnd.offsetLeft - (tabsStart.offsetLeft + tabsStart.offsetWidth),
        maxTabWidth = this.props.maxTitleWidth + 35;

      if (using + maxTabWidth >= total) {
        this.setState({compacted: true});
      }
    } else {
      // TODO
    }
  },

  handleDragStart: function (e) {
    if (typeof this.props.onDragStart === "function") {
      this.props.onDragStart(e);
    }
  },

  handleDragEnd: function () {
    if (typeof this.props.onDragEnd === "function") {
      this.props.onDragEnd();
    }
  },

  render: function() {
    var self = this,
      classes = "react-panel" + ((typeof this.props.theme === "string") ? " " + this.props.theme : ""),
      icon = this._getIcon(),
      title = (this.props.title.length) ? (
        React.createElement("div", {className: "panel-title-box", style: {maxWidth: Utils.pixelsOf(this.props.maxTitleWidth)}}, React.createElement("div", {className: "panel-title"}, this.props.title))
      ) : null,
      draggable = (this.props.floating) ? "true" : "false";

    var tabIndex = 0,
      selectedIndex = this.getSelectedIndex(),
      tabButtons = [],
      tabs = [];

    React.Children.forEach(self.props.children, function(child) {
      var ref = "tabb-" + tabIndex,
        tabRef = "tab-" + tabIndex,
        showTitle = true,
        props = {
          "icon": child.props.icon,
          "title": child.props.title,
          "pinned": child.props.pinned
        };

      if (self.state.compacted) {
        if (!(props.pinned || selectedIndex == tabIndex)) {
          showTitle = false;
        }
      }

      tabButtons.push(
        React.createElement(TabButton, {key: tabIndex, title: props.title, icon: props.icon, selectedIndex: selectedIndex, 
          index: tabIndex, ref: ref, showTitle: showTitle, maxTitleWidth: self.props.maxTitleWidth, onClick: self.handleClick})
      );

      tabs.push(
        React.addons.cloneWithProps(child, {
          // key: (typeof child.key !== "undefined") ? child.key : tabIndex,
          key: tabIndex,
          ref: tabRef,  // TODO: Remove if not being used
          selectedIndex: selectedIndex,
          index: tabIndex
        })
      );
      ++tabIndex;
    });

    return (
      React.createElement("div", {className: classes}, 
        React.createElement("header", {draggable: draggable, onDragEnd: self.handleDragEnd, onDragStart: self.handleDragStart, ref: "header"}, 
          icon, 
          title, 
          React.createElement("div", {className: "panel-tabs-start", ref: "tabs-start"}), 
          React.createElement("ul", {className: "panel-tabs", ref: "tabs"}, 
            tabButtons
          ), 
          React.createElement("div", {className: "panel-tabs-end", ref: "tabs-end"})
        ), 
        React.createElement("div", {className: "panel-body"}, 
          tabs
        )
      )
    );
  }

});


var TabButton = React.createClass({displayName: "TabButton",

  getDefaultProps: function () {
    return {
      "icon": "",
      "title": "",
      "index": 0,
      "selectedIndex": false,
      "showTitle": true,
      "maxTitleWidth": 130
    };
  },

  handleClick: function (event) {
    event.preventDefault();
    this.props.onClick(event, this.props.index);
  },

  render: function() {
    var icon = null,
      titleStyle = {maxWidth: Utils.pixelsOf(this.props.maxTitleWidth)},
      selected = (this.props.selectedIndex == this.props.index),
      title = "",
      tabClasses = "panel-tab";

    if (this.props.showTitle && this.props.title.length) {
      title = (React.createElement("div", {className: "panel-title"}, this.props.title));
    } else {
      titleStyle = {
        marginLeft: 0
      };
    }
    tabClasses += (selected) ? " active" : "";

    if (this.props.icon) {
      icon = (
        React.createElement("div", {className: "panel-icon"}, 
          React.createElement("i", {className: this.props.icon})
        )
      );
    }

    return (
      React.createElement("li", {className: tabClasses, onClick: this.handleClick}, 
        React.createElement("div", {title: this.props.title}, 
          icon, " ", React.createElement("div", {className: "panel-title-box", style: titleStyle}, title)
        )
      )
    );
  }
});


var Tab = React.createClass({displayName: "Tab",

  getDefaultProps: function () {
    return {
      "icon": "",
      "title": "",
      "index": 0,
      "selectedIndex": 0,
      "pinned": false,
      "showToolbar": true,
      "panelComponentType": "Tab"
    };
  },

  getInitialState: function () {
    this._internalValues = {};
    this._wrapped = false;
    return {};
  },

  setInternalValues: function (values) {
    // TODO, FIXME: newly added tabs appear stacked in main tab until we select another tab
    this._wrapped = true;
    this._internalValues = values;
  },

  getSelectedIndex: function () {
    if (this._wrapped) {
      return this._internalValues.selectedIndex;
    } else {
      return this.props.selectedIndex;
    }
  },

  getIndex: function () {
    if (this._wrapped) {
      return this._internalValues.index;
    } else {
      return this.props.index;
    }
  },

  render: function() {
    var self = this,
      numChilds = React.Children.count(this.props.children),
      vIndex = 0,
      tabStyle = {
        display: (this.getSelectedIndex() == this.getIndex()) ? "block" : "none"
      }, toolbarStyle = {
        display: (this.props.showToolbar) ? "block" : "none"
      },
      tabClasses = "panel-tab",
      hasToolbar = false;

    var innerContent = React.Children.map(self.props.children, function(child) {
      var type = (vIndex == 0 && numChilds >= 2) ? 0 : 1;   // 0: Toolbar, 1: Content, 2: Footer
      if (React.isValidElement(child) && (typeof child.props.panelComponentType !== "undefined")) {
        switch (String(child.props.panelComponentType)) {
          case "Toolbar": type = 0; break;
          case "Content": type = 1; break;
          case "Footer": type = 2; break;
        }
      }
      switch (type) {
        case 0:
          hasToolbar = true;
          return (React.createElement("div", {className: "panel-toolbar", key: vIndex++, style: toolbarStyle}, child));
        case 1: return (React.createElement("div", {className: "panel-content", key: vIndex++}, child));
        case 2: return (React.createElement("div", {className: "panel-footer", key: vIndex++}, child));
      }
    });
    tabClasses += (this.props.showToolbar && hasToolbar) ? " with-toolbar" : "";

    return (
      React.createElement("div", {className: tabClasses, style: tabStyle}, 
        innerContent
      )
    );
  }

});

var Mixins = {
  Toolbar: {
    getDefaultProps: function () {
      return {
        panelComponentType: "Toolbar"
      };
    }
  },
  Content: {
    getDefaultProps: function () {
      return {
        panelComponentType: "Content"
      };
    }
  },
  Footer: {
    getDefaultProps: function () {
      return {
        panelComponentType: "Footer"
      };
    }
  },
  TabWrapper: {
    getDefaultProps: function () {
      return {
        panelComponentType: "TabWrapper",
        icon: "",
        title: "",
        pinned: false
      };
    },
    getInitialState: function () {
      this._propagated = false;
      return {};
    },
    componentWillReceiveProps: function(nextProps) {
      if (!this._propagated || this.props.index != nextProps.index || this.props.selectedIndex != nextProps.selectedIndex) {
        this._propagated = true;
        this._reactInternalInstance._renderedComponent._instance.setInternalValues({
          selectedIndex: nextProps.selectedIndex,
          index: nextProps.index
        });
        this.forceUpdate();
      }
    }
  }
};

var Toolbar = React.createClass({
  displayName: 'Toolbar',
  mixins: [Mixins.Toolbar],

  render: function () {
    return (
      React.createElement("div", null, 
        this.props.children
      )
    );
  }

});


var Content = React.createClass({
  displayName: 'Content',
  mixins: [Mixins.Content],

  render: function () {
    return (
      React.createElement("div", null, 
        this.props.children
      )
    );
  }

});

var Footer = React.createClass({
  displayName: 'Footer',
  mixins: [Mixins.Footer],

  render: function () {
    return (
      React.createElement("div", null, 
        this.props.children
      )
    );
  }

});

var PanelAddons = {};


/**
 * Requires: jQuery + jQuery niceScroll plugin
 */
var ScrollableTabContent = React.createClass({
  displayName: 'ScrollableTabContent',
  mixins: [Mixins.Content],

  getDefaultProps: function () {
    return {
      "height": 250,
      "opts": {
        cursorcolor: "rgb(139, 128, 102)",
        cursoropacitymin: 0.25,
        cursoropacitymax: 0.5,
        cursorwidth: 9,
        cursorminheight: 60
      }
    };
  },

  componentDidMount: function () {
    $(this.refs.content.getDOMNode()).niceScroll(this.refs.wrapper.getDOMNode(), this.props.opts);
  },

  render: function() {
    var contentStyle = {
      height: Utils.pixelsOf(this.props.height),
      paddingRight: Utils.pixelsOf((this.props.opts.cursorwidth || 5) + 4),
      overflow: "scroll"
    };
    return (
      React.createElement("div", {ref: "content", style: contentStyle}, 
        React.createElement("div", {ref: "wrapper"}, 
          this.props.children
        )
      )
    );
  }

});

PanelAddons.ScrollableTabContent = ScrollableTabContent;


window.ReactPanels = {
  Panel: Panel,
  FloatingPanel: FloatingPanel,
  Tab: Tab,
  Mixins: Mixins,
  Toolbar: Toolbar,
  Content: Content,
  Footer: Footer,
  addons: PanelAddons
};

}());