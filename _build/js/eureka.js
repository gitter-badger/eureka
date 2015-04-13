var Eureka = function (opts) {
    this.headers = opts.headers;
    
    opts = extend({}, {
        useLocalStorage: true,
        editable: true
    }, opts);
    var currentView = 'view-a';
    var navTreeHidden = false;
    var currentDirectory = undefined;
    var mediaSource = 0;
    if (opts.useLocalStorage && typeof (Storage) !== "undefined") {
        if (typeof localStorage.getItem('currentView') == "string" && localStorage.getItem('currentView').length)
            currentView = localStorage.getItem('currentView');
        navTreeHidden = localStorage.getItem('navTreeHidden') === "true" ? true : false;
        if (typeof localStorage.getItem('currentDirectory') == "string" && localStorage.getItem('currentDirectory').length)
            currentDirectory = localStorage.getItem('currentDirectory');
        if (typeof localStorage.getItem('mediaSource') !== undefined)
            mediaSource = localStorage.getItem('mediaSource');
    }
    var defaults = {
        currentView: currentView,
        navTreeHidden: navTreeHidden,
        currentDirectory: currentDirectory,
        directoryRequestURL:'fakepi/listdirectory.php',
        listSourceRequestURL:'fakepi/listsource.php',
        listSourcesRequestURL:'fakepi/listsources.php',
    };
    this.opts = extend({}, defaults, opts);
    this.opts.headers = this.headers;
    // model notifies the controller of updates
    var eurekaModel = new EurekaModel(this.opts);
    // view paints the DOM and listens to it
    var eurekaView = new EurekaView({});
    this.model = eurekaModel;
    this.view = eurekaView;
    // controller updates the model and the view
    var eurekaController = new EurekaController({
        model: eurekaModel,
        view: eurekaView
    });
    eurekaModel.setController(eurekaController);
    eurekaView.setController(eurekaController);
    // fire up the view and add listeners
    eurekaView.init();
    eurekaView.paint();
    eurekaController.init();
    if (currentDirectory !== undefined)
        eurekaModel.setCurrentDirectory(currentDirectory, false);
    if (mediaSource !== undefined)
        eurekaModel.setCurrentMediaSource(mediaSource, false);
    // cheap way to trigger the eurekaViewChange event
    eurekaModel.setCurrentView(eurekaModel.getCurrentView());
    if (currentDirectory !== undefined || mediaSource !== undefined)
        this.fetch();
};
Eureka.prototype.fetch = function () {
    this.model.setCurrentDirectory(this.model.getCurrentDirectory());
    this.model.setCurrentMediaSource(this.model.getCurrentMediaSource());
};
/*          ___
/'\_/`\            /\ \        /\_ \
/\      \    ___    \_\ \     __\//\ \
\ \ \__\ \  / __`\  /'_` \  /'__`\\ \ \
\ \ \_/\ \/\ \L\ \/\ \L\ \/\  __/ \_\ \_
\ \_\\ \_\ \____/\ \___,_\ \____\/\____\
\/_/ \/_/\/___/  \/__,_ /\/____/\/___*/
var EurekaMediaSourceDTO = function (opts) {
    this.id = null;
    this.title = null;
    opts = extend({}, {}, opts);
    this.opts = opts;
    if (this.opts.id !== undefined)
        this.id = this.opts.id;
    if (this.opts.title !== undefined)
        this.title = this.opts.title;
};
EurekaMediaSourceDTO.prototype.getID = function () {
    return this.id;
};
EurekaMediaSourceDTO.prototype.setID = function (id) {
    this.id = id;
};
EurekaMediaSourceDTO.prototype.getTitle = function () {
    return this.title;
};
EurekaMediaSourceDTO.prototype.setTitle = function (title) {
    this.title = title;
};
var EurekaModel = function (opts) {
    //if(EurekaModel.instance !== undefined) return EurekaModel.instance;
    var headers = opts.headers;
    var defaults = {
        locale: 'en-US',
        debug: false,
        mediaSource: 0,
        currentDirectory: '',
        currentView: undefined,
        uid: 'media-browser_0',
        useLocalStorage: true,
        navTreeHidden: undefined
    };
    this.controller = null;
    this.selected = null;
    this.sources = [];
    this.opts = extend({}, defaults, opts);
    this.opts.headers = headers;
    if (typeof (Storage) === "undefined")
        this.opts.useLocalStorage = false;
};
EurekaModel.prototype.getMediaSourceDTOByID = function (id) {
    for (var i = 0; i < this.sources.length; i++) {
        var source = this.sources[i];
        if (source.getID() == id) {
            return source;
        }
    }
    return null;
};
EurekaModel.prototype.getController = function () {
    return this.controller;
};
EurekaModel.prototype.setController = function (controller) {
    this.controller = controller;
};
EurekaModel.prototype.getNavTreeHidden = function () {
    return this.opts.navTreeHidden;
};
EurekaModel.prototype.setNavTreeHidden = function (navTreeHidden) {
    this.opts.navTreeHidden = navTreeHidden;
    if (this.opts.useLocalStorage)
        localStorage.setItem('navTreeHidden', navTreeHidden);
};
EurekaModel.prototype.getUID = function () {
    return this.opts.uid;
};
EurekaModel.prototype.setUID = function (uid) {
    this.opts.uid = uid;
};
EurekaModel.prototype.renameFile = function (fileName, newFilename) {
    var e = new Event('EurekaFileRename');
    e.data = {
        fileName: fileName,
        newFilename: newFilename,
        cd: this.getController().getModel().getCurrentMediaSource(),
        cs: this.getController().getModel().getCurrentDirectory(),
        path: this.getController().getModel().getCurrentDirectory() + fileName,
        newPath: this.getController().getModel().getCurrentDirectory() + newFilename
    };
    this.getController().getView().getElement().dispatchEvent(e);
};
EurekaModel.prototype.setCurrentMediaSource = function (currentMediaSource, dispatch) {
    if (dispatch === undefined)
        dispatch = true;
    this.opts.mediaSource = currentMediaSource;
    if (dispatch === false)
        return;
    var e = new Event('eurekaMediaSourceChange');
    e.currentMediaSource = currentMediaSource;
    this.getController().getView().getElement().dispatchEvent(e);
};
EurekaModel.prototype.getCurrentMediaSource = function () {
    return this.opts.mediaSource;
};
EurekaModel.prototype.setCurrentDirectory = function (currentDirectory, dispatch) {
    if (dispatch === undefined)
        dispatch = true;
    this.opts.currentDirectory = currentDirectory;
    if (this.opts.useLocalStorage)
        localStorage.setItem('currentDirectory', currentDirectory);
    if (dispatch === false)
        return;
    var e = new Event('eurekaCurrentDirectoryChange');
    e.currentDirectory = currentDirectory;
    this.getController().getView().getElement().dispatchEvent(e);
};
EurekaModel.prototype.getCurrentDirectory = function () {
    return this.opts.currentDirectory;
};
EurekaModel.prototype.setCurrentView = function (currentView, dispatch) {
    if (dispatch === undefined)
        dispatch = true;
    this.opts.currentView = currentView;
    if (this.opts.useLocalStorage)
        localStorage.setItem('currentView', currentView);
    if (dispatch === false)
        return;
    var e = new Event('eurekaViewChange');
    e.currentView = currentView;
    this.getController().getView().getElement().dispatchEvent(e);
};
EurekaModel.prototype.getCurrentView = function () {
    return this.opts.currentView;
};
EurekaModel.prototype.setLocale = function (locale) {
    this.opts.locale = locale;
};
EurekaModel.prototype.getLocale = function () {
    return this.opts.locale;
};
EurekaModel.prototype.setSources = function (sources, dispatch) {
    if (dispatch === undefined)
        dispatch = true;
    this.sources = sources;
    if (dispatch === false)
        return;
    var e = new Event('MediaSourcesListChange');
    e.data = sources;
    this.getController().getView().getElement().dispatchEvent(e);
};
EurekaModel.prototype.setMediaSourcesData = function (data) {
    data = JSON.parse(data);
    var results = data.results;
    var sources = [];
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var mediaSourceDTO = new EurekaMediaSourceDTO({
            id: result.id,
            title: result.name
        });
        sources.push(mediaSourceDTO);
    }
    this.setSources(sources);
};
EurekaModel.prototype.deleteFile = function (filename, tr) {
    var that = this;
    var e = new Event('EurekaUnlink');
    e.data = {
        filename: tr.getAttribute('data-filename'),
        timestamp: tr.getAttribute('data-timestamp'),
        src: tr.querySelector('.image img').getAttribute('src'),
        dimensions: [tr.getAttribute('data-dimensions-w'), tr.getAttribute('data-dimensions-h')],
        filesize: parseInt(tr.getAttribute('data-filesize-bytes'))
    };
    that.getController().getView().getElement().dispatchEvent(e);
};
EurekaModel.prototype.setChoosenMediaItem = function (filename) {
    var that = this;
    var tr = getEurekaRowByFileName(filename); // #more reliable than tr.eureka__row.focused
    var e = new Event('EurekaFoundIt');
    e.data = {
        filename: filename,
        timestamp: tr.getAttribute('data-timestamp'),
        src: tr.querySelector('.image img').getAttribute('src'),
        dimensions: [tr.getAttribute('data-dimensions-w'), tr.getAttribute('data-dimensions-h')],
        filesize: parseInt(tr.getAttribute('data-filesize-bytes'))
    };
    that.getController().getView().getElement().dispatchEvent(e);
    function getEurekaRowByFileName(filename) {
        var trs = that.getController().getView().getElement().querySelectorAll('tr.eureka__row');
        for (var i = 0; i < trs.length; i++) {
            var tr = trs[i];
            if (tr.getAttribute('data-filename') == filename)
                return tr;
        }
        return false;
    }
};
EurekaModel.prototype.getSelected = function () {
    return this.selected;
};
EurekaModel.prototype.setSelected = function (filename) {
    this.selected = filename;
};
EurekaModel.prototype.getXHRHeaders = function() {
    return this.opts.headers;
}
EurekaModel.prototype.getListDirectoryRequestURL = function() {
  return this.opts.directoryRequestURL;
};

EurekaModel.prototype.getListSourceRequestURL = function() {
  return this.opts.listSourceRequestURL;
};

EurekaModel.prototype.getListSourcesRequestURL = function() {
  return this.opts.listSourcesRequestURL;
};
/*  __
/\ \/\ \  __
\ \ \ \ \/\_\     __   __  __  __
\ \ \ \ \/\ \  /'__`\/\ \/\ \/\ \
 \ \ \_/ \ \ \/\  __/\ \ \_/ \_/ \
  \ `\___/\ \_\ \____\\ \___x___/'
   `\/__/  \/_/\/____/ \/__//_*/
var EurekaView = function (opts) {
    opts = opts !== undefined ? opts : {};
    //if(typeof opts.model !== 'object') throw new Error('EurekaView requires an instance of EurekaModel to be supplied as opts.model in the constructor')
    this.opts = opts;
};
EurekaView.prototype.getController = function () {
    return this.controller;
};
EurekaView.prototype.setController = function (controller) {
    this.controller = controller;
};
EurekaView.prototype.assignFooterProceedListeners = function () {
    var that = this;
    that.getElement().parentNode.querySelector('footer.proceed button.cta').addEventListener('click', function (e) {
        e.preventDefault();
        that.getController().getModel().setChoosenMediaItem(that.getController().getModel().getSelected());
    });
};
EurekaView.prototype.init = function () {
    var that = this;
    function showSidebar() {
        var tog = document.getElementById('media-browser_0__pathbrowser_toggle');
        var el = document.getElementById(tog.getAttribute('data-toggle-target'));
        el.classList.remove('hidden');
        document.querySelectorAll('#media-browser_0 .browse-select')[0].classList.add('tablet-p-hidden');
        that.getController().getModel().setNavTreeHidden(false);
        var toggle = document.getElementById('media-browser_0__pathbrowser_toggle').getElementsByTagName("i")[0];
        toggle.classList.remove('fa-toggle-right');
        toggle.classList.remove('icon-toggle-right');
        toggle.classList.add('fa-toggle-left');
        toggle.classList.add('icon-toggle-left');
        tog.title = tog.getAttribute('data-title-close');
    }
    function hideSidebar() {
        var tog = document.getElementById('media-browser_0__pathbrowser_toggle');
        var el = document.getElementById(tog.getAttribute('data-toggle-target'));
        el.classList.add('hidden');
        document.querySelectorAll('#media-browser_0 .browse-select')[0].classList.remove('tablet-p-hidden');
        that.getController().getModel().setNavTreeHidden(true);
        var toggle = document.getElementById('media-browser_0__pathbrowser_toggle').getElementsByTagName("i")[0];
        toggle.classList.add('fa-toggle-right');
        toggle.classList.add('icon-toggle-right');
        toggle.classList.remove('fa-toggle-left');
        toggle.classList.remove('icon-toggle-left');
        tog.title = tog.getAttribute('data-title-open');
    }
    document.getElementById('media-browser_0__pathbrowser_toggle').addEventListener('click', function (e) {
        var el = document.getElementById(this.getAttribute('data-toggle-target'));
        e.preventDefault();
        if (el.classList.contains('hidden')) {
            showSidebar();
        }
        else {
            hideSidebar();
        }
    });
    this.assignViewButtonListeners();
    this.assignFooterProceedListeners();
    this.assignBrowsingSelectOptGroupListeners();
    this.getElement().querySelector('.eureka__topbar-nav .view-btns a[data-view="' + this.getController().getModel().getCurrentView() + '"]').dispatchEvent(new Event('click'));
    if (this.getController().getModel().getNavTreeHidden() === true) {
        hideSidebar();
    }
};
EurekaView.prototype.assignBrowsingSelectOptGroupListeners = function () {
    var that = this;
    var select = document.getElementById(that.getController().getModel().getUID() + '__browsing').querySelector('select');
    select.addEventListener('change', function (e) {
        var option = getSelectedOption(this.querySelectorAll('option'));
        var optgroup = getClosest(option, 'optgroup');
        var source = optgroup.getAttribute('data-source');
        that.getController().getModel().setCurrentMediaSource(source, false);
        that.getController().getModel().setCurrentDirectory(option.getAttribute('value'));
        function getSelectedOption(options) {
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                if (option.selected)
                    return option;
            }
            return null;
        }
    });
};
EurekaView.prototype.assignViewButtonListeners = function () {
    var model = this.getController().getModel();
    function setCurrent(el) {
        var anchors = document.querySelectorAll(".eureka__topbar-nav .view-btns a[data-view]");
        for (var i = 0; i < anchors.length; i++) {
            var anchor = anchors[i];
            anchor.classList.remove('current');
        }
        el.classList.add('current');
    }
    var anchors = document.querySelectorAll(".eureka__topbar-nav .view-btns a[data-view]");
    for (var i = 0; i < anchors.length; i++) {
        var current = anchors[i];
        current.addEventListener('click', function (e) {
            e.preventDefault();
            var that = this;
            var _v = this.getAttribute('data-view');
            var classes = ['view-a', 'view-b', 'view-c', 'view-d'];
            for (var _i = 0; _i < classes.length; _i++) {
                var c = classes[_i];
                document.getElementById(that.getAttribute('data-view-target')).classList.remove(c);
            }
            document.getElementById(that.getAttribute('data-view-target')).classList.add(_v);
            setCurrent(that);
            model.setCurrentView(_v);
        }, true);
    }
};
EurekaView.prototype.assignARIAKeyListeners = function () {
    var that = this;
    // ARIA focus support for non-contextual rows
    (function () {
        function setFocused(el) {
            var rows = document.querySelectorAll(".eureka-table tbody > tr:not(.contextual)");
            for (var i = 0; i < rows.length; i++) {
                var current = rows[i];
                if (el !== current && current.classList.contains("focused"))
                    current.classList.remove('focused');
            }
            el.classList.add('focused');
            var _cta = that.getProceedFooter().querySelector('button.cta');
            _cta.removeAttribute('disabled');
            _cta.classList.remove('muted');
            that.getController().getModel().setSelected(el.getAttribute('data-filename'));
        }
        function handleBlur(el) {
            var contextual = document.getElementById('eureka_contextual__' + el.getAttribute('data-safe-filename'));
            contextual.focus();
            //that.getProceedFooter().querySelector('button.cta').classList.add('muted');
            that.getProceedFooter().querySelector('button.cta').classList.remove('go');
        }
        var rows = document.querySelectorAll(".eureka-table tbody > tr:not(.contextual)");
        for (var i = 0; i < rows.length; i++) {
            var current = rows[i];
            current.addEventListener('focus', function (e) {
                e.preventDefault();
                //var _as = document.querySelectorAll(".eureka-table tbody > tr:not(.contextual)");
                setFocused(this);
            }, false);
            current.addEventListener('blur', function (e) {
                handleBlur(this);
            }, false);
        }
    }());
};
EurekaView.prototype.assignSortBtnListeners = function () {
    var sortBtns = document.querySelectorAll('.eureka-table th .fa-sort');
    for (var i = 0; i < sortBtns.length; i++) {
        var sortBtn = sortBtns[i];
        sortBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // toggle between 0 and 1
            this.setAttribute('data-sort-asc', Math.abs(parseInt(this.getAttribute('data-sort-asc')) - 1));
            var sortby = this.getAttribute('data-sortby');
            var sortASC = (this.getAttribute('data-sort-asc') == "1") ? true : false;
            var rows = [];
            var rs = document.querySelectorAll('.eureka-table tbody > tr:not(.contextual)');
            for (var i = 0; i < rs.length; i++) {
                rows.push(rs[i]);
            }
            switch (sortby) {
                case 'dimensions':
                    rows.sort(function (a, b) {
                        return (parseInt(a.getAttribute('data-dimensions-w')) * parseInt(a.getAttribute('data-dimensions-h'))) - (parseInt(b.getAttribute('data-dimensions-w')) * parseInt(b.getAttribute('data-dimensions-h')));
                    });
                    break;
                case 'filesize':
                    rows.sort(function (a, b) {
                        return parseInt(a.getAttribute('data-filesize-bytes')) - parseInt(b.getAttribute('data-filesize-bytes'));
                    });
                    break;
                case 'editedon':
                    rows.sort(function (a, b) {
                        return parseInt(a.getAttribute('data-timestamp')) - parseInt(b.getAttribute('data-timestamp'));
                    });
                    break;
                default:
                    rows.sort(function (a, b) {
                        if (a.getAttribute('data-filename') > b.getAttribute('data-filename'))
                            return 1;
                        if (a.getAttribute('data-filename') < b.getAttribute('data-filename'))
                            return -1;
                        return 0;
                    });
                    break;
            }
            if (!sortASC) {
                rows.reverse();
            }
            var s = '';
            for (var _i = 0; _i < rows.length; _i++) {
                var row = rows[_i];
                s += row.outerHTML;
            }
            document.querySelectorAll('.eureka-table tbody')[0].innerHTML = s;
        });
    }
};
EurekaView.prototype.assignFilterListeners = function () {
    var that = this;
    function unFilterView() {
        var rows = document.querySelectorAll(".eureka-table tbody > tr:not(.contextual)");
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            row.classList.remove('hidden');
        }
        document.getElementById(that.getController().getModel().getUID()).querySelector('.eureka-table > table > tbody').classList.remove('filtered');
    }
    function filterView(value) {
        var rows = that.getElement().querySelectorAll(".eureka-table tbody > tr:not(.contextual)");
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var show = false;
            var tokens = [row.getAttribute('data-filename')];
            if (row.getAttribute('data-tokens')) tokens = tokens.concat(row.getAttribute('data-tokens').split('||'));

            (function(){
                for (var _i = 0; _i < tokens.length; _i++) {
                    var token = tokens[_i];
                    if (value.length && (token == value || token.indexOf(value) > -1)) {
                        show = true;
                        break;
                    }
                }
            })();

            if (!show) {
                row.classList.add('hidden');
                row.classList.remove('visible');
            }
            else {
                row.classList.add('visible');
                row.classList.remove('hidden');
            }
            document.getElementById(that.getController().getModel().getUID()).querySelector('.eureka-table > table > tbody').classList.add('filtered');
        }
    }
    var input = document.getElementById('media-browser_0__filter-images');
    input.addEventListener("input", function (e) {
        if (this.value) {
            filterView(this.value);
        }
        else {
            unFilterView();
        }
    }, false);
};
EurekaView.prototype.populateTree = function (data) {
    var s = '';
    function PrintResults(results, ul) {
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var split = result.path.split('/');
            split = split.filter(function (n) { return (n !== undefined && n != ""); });
            var displayPath = split.join('/');
            var li = document.createElement('li');
            var folder = document.createElement('a');
            folder.classList.add('folder');
            var fa = document.createElement('i');
            fa.classList.add('fa');
            fa.classList.add('icon');
            fa.classList.add('fa-folder');
            fa.classList.add('icon-folder');
            fa.classList.add('folder');
            folder.appendChild(fa);
            folder.innerHTML += '&nbsp;';
            var path = document.createElement('a');
            path.innerHTML = displayPath;
            path.setAttribute('title', 'Browse ' + result.path);
            path.setAttribute('data-cd', result.path);
            path.classList.add('path');
            li.appendChild(folder);
            li.appendChild(path);
            if (result.children !== undefined && result.children.length) {
                var _ul = document.createElement("ul");
                PrintResults(result.children, _ul);
                li.appendChild(_ul);
            }
            ul.appendChild(li);
        }
    }
    data = JSON.parse(data);
    var results = data.results;
    var _ul = document.querySelector('#media-browser_0__pathbrowser nav.tree > ul');
    this.emptyTree();
    _ul.innerHTML = '';
    PrintResults(results, _ul);
    this.assignTreeListeners();
};
EurekaView.prototype.getElement = function () {
    return document.getElementById(this.getController().getModel().getUID());
};
EurekaView.prototype.getProceedFooter = function () {
    return this.getElement().parentNode.querySelector('footer.proceed');
};
EurekaView.prototype.handleTreePathClicked = function (el) {
    var that = this;
    function deactivatePaths() {
        var paths = document.querySelectorAll("nav.tree a.path");
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            var li = getClosest(path, 'li');
            li.classList.remove('active');
        }
    }
    var source = that.getController().getModel().getCurrentMediaSource();
    ajax.get(that.getController().getModel().getListDirectoryRequestURL(), { s: source, dir: el.getAttribute('data-cd'), headers:that.getController().getModel().getXHRHeaders() }, function (data) {
        that.paintJSON(data);
    });
    var li = getClosest(el, 'li');
    deactivatePaths();
    li.classList.add('active');
};
EurekaView.prototype.assignTreeListeners = function () {
    var that = this;
    var paths = document.querySelectorAll("nav.tree a.path");
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        path.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            that.handleTreePathClicked(this);
        });
    }
    this.assignTreeFolderListeners();
    this.assignSelectListeners();
};
EurekaView.prototype.assignMediaBrowserOptGroupListeners = function () {
    var that = this;
    var select = document.querySelector('#media-browser_0__browsing select');
    select.addEventListener('change', function () {
        var selected = getSelectedOption(select); //querySelector('option:selected') errors out
        // update the model to reflect the now current media source
        that.getController().getModel().setCurrentMediaSource(getClosest(selected, 'optgroup').getAttribute('data-source'));
        // fetch current media source's directories
        ajax.get(that.getController().getModel().getListSourceRequestURL(), { s: that.getController().getModel().getCurrentMediaSource(), headers:that.getController().getModel().getXHRHeaders() }, function (data) {
            that.getController().getView().populateTree(data);
        });
    });
};
EurekaView.prototype.assignTreeFolderListeners = function () {
    var folders = document.querySelectorAll("nav.tree a.folder");
    for (var i = 0; i < folders.length; i++) {
        var folder = folders[i];
        folder.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var _icon = this.querySelector('.fa');
            var _closing = _icon.classList.contains('fa-folder-open');
            var li = getClosest(this, 'li');
            if (_closing) {
                _icon.classList.remove('fa-folder-open');
                _icon.classList.remove('icon-folder-open');
                _icon.classList.add('fa-folder');
                _icon.classList.add('icon-folder');
                li.classList.remove('open');
            }
            else {
                _icon.classList.remove('fa-folder');
                _icon.classList.remove('icon-folder');
                _icon.classList.add('fa-folder-open');
                _icon.classList.add('icon-folder-open');
                li.classList.add('open');
            }
        });
    }
};
EurekaView.prototype.assignSelectListeners = function () {
    var that = this;
    var mediaSourceSelect = document.getElementById('media-browser_0__mediasource-select');
    mediaSourceSelect.addEventListener('change', function () {
        that.getController().getModel().setCurrentMediaSource(this.value);
        ajax.get(that.getController().getModel().getListSourceRequestURL(), { s: that.getController().getModel().getCurrentMediaSource().toString(), headers:that.getController().getModel().getXHRHeaders() }, function (data) {
            that.getController().getView().populateTree(data);
        });
    });
};
EurekaView.prototype.emptyTree = function () {
    var paths = document.querySelectorAll("nav.tree a.path");
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        path.removeEventListener('click');
        path.remove();
    }
};
EurekaView.prototype.assignDraggableListeners = function () {
    var kindaDraggables = document.querySelectorAll('*[sorta-draggable="true"]');
    for (var i = 0; i < kindaDraggables.length; i++) {
        var kindaDraggable = kindaDraggables[i];
        kindaDraggable.addEventListener('blur', function (e) {
            this.parentNode.draggable = false;
        });
        kindaDraggable.addEventListener('focus', function (e) {
            this.parentNode.draggable = false;
        });
    }
};
EurekaView.prototype.paint = function () {
    this.assignMediaBrowserOptGroupListeners();
    this.assignFilterListeners();
    this.assignSortBtnListeners();
    this.assignARIAKeyListeners();
    this.assignContextualClickListeners();
    this.assignDraggableListeners();
    //this.assignContextualRowListeners();
};
EurekaView.prototype.paintTree = function (data) {
    data = JSON.parse(data);
    var tree = this.getElement().querySelector('nav.tree');
    var results = data.results;
    function printTreeNavResults(results, ul) {
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var li = document.createElement('li');
            var folder = document.createElement('a');
            folder.innerHTML = '&nbsp;';
            folder.classList.add('folder');
            var folderOpenIcon = document.createElement('i');
            folderOpenIcon.classList.add('fa');
            folderOpenIcon.classList.add('icon');
            folderOpenIcon.classList.add('fa-folder');
            folderOpenIcon.classList.add('icon-folder');
            folder.appendChild(folderOpenIcon);
            var path = document.createElement('a');
            path.classList.add('path');
            path.setAttribute('href', '#');
            path.setAttribute('title', 'Browse ' + result.path);
            path.setAttribute('data-cd', result.path);
            path.innerHTML = ' ' + result.path;
            li.appendChild(folder);
            li.appendChild(path);
            if (result.children !== undefined && result.children.length) {
                var _ul = document.createElement("ul");
                printTreeNavResults(result.children, _ul);
                li.appendChild(_ul);
            }
            ul.appendChild(li);
        }
    }
    tree.innerHTML = '';
    var ul = document.createElement('ul');
    tree.appendChild(ul);
    printTreeNavResults(results, ul);
    this.assignTreeListeners();
};
EurekaView.prototype.paintJSON = function (data) {
    var that = this;
    data = JSON.parse(data);
    var model = this.getController().getModel();
    model.setCurrentMediaSource(data.cs, false);
    model.setCurrentDirectory(data.cd, false);
    var results = data.results;
    var tbodyHTML = '';
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var filename = result.filename;
        var safeFileName = filename.replace(/[!\"#$%&'\(\)\*\+,\.\/:;<=>\?\@\[\\\]\^`\{\|\}~]/g, '');
        var src = result.src;
        var filesize = result.filesize;
        var dimensions = result.dimensions;
        var editedon = parseInt(result.editedon);
        var tr = document.createElement("tr");
        tr.classList.add('eureka__row');
        //tr.setAttribute('contenteditable', true);
        tr.setAttribute('tabindex', "0");
        tr.setAttribute('data-tokens', '');
        tr.setAttribute('data-filename', filename);
        tr.setAttribute('data-safe-filename', safeFileName);
        tr.setAttribute('data-dimensions-w', dimensions.split('x')[0]);
        tr.setAttribute('data-dimensions-h', dimensions.split('x')[1]);
        tr.setAttribute('data-filesize-bytes', filesize);
        tr.setAttribute('data-timestamp', editedon);
        var td = document.createElement("td");
        td.setAttribute('contenteditable', false);
        td.classList.add('eureka__row-image');
        var imgD = document.createElement('div');
        imgD.classList.add('image');
        var img = document.createElement('img');
        img.setAttribute('src', src);
        imgD.appendChild(img);
        var code = document.createElement('code');
        code.setAttribute('contenteditable', true);
        code.setAttribute('tabindex', '-1');
        code.setAttribute('sorta-draggable', true);
        code.innerHTML = filename;
        td.appendChild(imgD);
        td.appendChild(code);
        function createCode(html) {
            var tag = document.createElement('code');
            tag.innerHTML = html;
            return tag;
        }
        var tdDimensionCell = document.createElement('td');
        tdDimensionCell.classList.add('eureka__row-dimensions');
        tdDimensionCell.appendChild(createCode(dimensions));
        var tdFilesizeCell = document.createElement('td');
        tdFilesizeCell.classList.add('eureka__row-filesize');
        tdFilesizeCell.appendChild(createCode(formatFileSize(filesize)));
        var tdEditedOnCell = document.createElement('td');
        tdEditedOnCell.classList.add('eureka__row-editedon');
        tdEditedOnCell.appendChild(createCode(new Date(editedon * 1000).toLocaleDateString(model.getLocale(), {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })));
        tr.appendChild(td);
        tr.appendChild(tdDimensionCell);
        tr.appendChild(tdFilesizeCell);
        tr.appendChild(tdEditedOnCell);
        tbodyHTML += tr.outerHTML;
        
        function createContextualRow() {
            var tr = document.createElement('tr');
            tr.classList.add('contextual');
            tr.setAttribute('id', 'eureka_contextual__' + safeFileName);
            //tr.setAttribute('tabindex','0');
            var td = document.createElement('td');
            td.setAttribute('colspan', '4');
            function createFlexibleNav() {
                var nav = document.createElement('nav');
                nav.classList.add('flexible_row');
                nav.classList.add('contextual__nav');
                function createExpandBtn() {
                    var a = document.createElement('a');
                    a.classList.add('expand');
                    a.setAttribute('href', src);
                    a.setAttribute('target', '_blank');
                    a.setAttribute('tabindex', '0');
                    var fa = document.createElement('i');
                    fa.classList.add('fa');
                    fa.classList.add('icon');
                    fa.classList.add('fa-expand');
                    fa.classList.add('icon-expand');
                    a.appendChild(fa);
                    a.innerHTML += ' Expand';
                    return a;
                }
                function createChooseBtn() {
                    var a = document.createElement('a');
                    a.classList.add('choose');
                    a.setAttribute('href', src);
                    a.setAttribute('target', '_blank');
                    a.setAttribute('tabindex', '0');
                    var fa = document.createElement('i');
                    fa.classList.add('fa');
                    fa.classList.add('icon');
                    fa.classList.add('fa-check-circle-o');
                    fa.classList.add('icon-check-circle-o');
                    a.appendChild(fa);
                    a.innerHTML += ' Choose';
                    return a;
                }
                function createRenameBtn() {
                    var a = document.createElement('a');
                    a.classList.add('rename');
                    //a.setAttribute('href',src);
                    a.setAttribute('target', '_blank');
                    a.setAttribute('tabindex', '0');
                    var fa = document.createElement('i');
                    fa.classList.add('fa');
                    fa.classList.add('icon');
                    fa.classList.add('fa-edit');
                    fa.classList.add('icon-edit');
                    a.appendChild(fa);
                    a.innerHTML += ' Rename';
                    return a;
                }
                function createTrashBtn() {
                    var a = document.createElement('a');
                    a.classList.add('dangerous');
                    a.classList.add('trash');
                    a.setAttribute('target', '_blank');
                    a.setAttribute('tabindex', '0');
                    var fa = document.createElement('i');
                    fa.classList.add('fa');
                    fa.classList.add('icon');
                    fa.classList.add('fa-trash');
                    fa.classList.add('icon-trash');
                    a.appendChild(fa);
                    a.innerHTML += ' Delete';
                    return a;
                }
                nav.appendChild(createExpandBtn());
                nav.appendChild(createChooseBtn());
                if (that.getController().getModel().opts.editable && document.execCommand)
                    nav.appendChild(createRenameBtn()); // should probably polyfill or just juse a standard text input instead #janky? #shame?
                if (that.getController().getModel().opts.editable)
                    nav.appendChild(createTrashBtn());
                //nav.appendChild(createFlexibleNavTagForm());
                //nav.appendChild(createFlexibleNavShareForm());
                function createFlexibleNavTagForm() {
                    var form = document.createElement('form');
                    form.classList.add('tag');
                    form.setAttribute('method', 'post');
                    form.setAttribute('action', '#');
                    var label = document.createElement('label');
                    label.setAttribute('title', 'Tagging this media item will make it easier to find');
                    var fa = document.createElement('i');
                    fa.classList.add('fa');
                    fa.classList.add('icon');
                    fa.classList.add('fa-tag');
                    fa.classList.add('icon-tag');
                    label.appendChild(fa);
                    label.innerHTML += ' Tag:';
                    var input = document.createElement('input');
                    input.setAttribute('type', 'text');
                    input.setAttribute('placeholder', 'Tag this media item');
                    input.setAttribute('tabindex', '-1');
                    form.appendChild(label);
                    form.appendChild(input);
                    return form;
                }
                function createFlexibleNavShareForm() {
                    var form = document.createElement('form');
                    form.classList.add('share');
                    form.setAttribute('action', '#');
                    form.setAttribute('title', "Share " + filename + " with other");
                    form.appendChild(createMediaSourceInput());
                    form.appendChild(createMediaItemInput());
                    var button = document.createElement('button');
                    button.classList.add('nued');
                    button.setAttribute('type', 'submit');
                    button.setAttribute('tabindex', '0');
                    var fa = document.createElement('i');
                    fa.classList.add('fa');
                    fa.classList.add('icon');
                    fa.classList.add('fa-share-square-o');
                    fa.classList.add('icon-share-square-o');
                    button.appendChild(fa);
                    button.innerHTML += ' Share';
                    form.appendChild(button);
                    function createMediaSourceInput() {
                        var input = document.createElement('input');
                        input.setAttribute('type', 'hidden');
                        input.setAttribute('name', 'mediasource');
                        input.setAttribute('value', '0');
                        return input;
                    }
                    function createMediaItemInput() {
                        var input = document.createElement('input');
                        input.setAttribute('type', 'hidden');
                        input.setAttribute('name', 'mediaitem');
                        input.setAttribute('value', filename);
                        return input;
                    }
                    return form;
                }
                return nav;
            }
            td.appendChild(createFlexibleNav());
            tr.appendChild(td);
            return tr;
        }
        
        tbodyHTML += createContextualRow().outerHTML;
    }
    document.querySelector('#media-browser_0 .eureka-table > table > tbody').innerHTML = tbodyHTML;
    // bolden the correct tree item
    try {
        this.getElement().querySelector('nav.tree li.active').classList.remove('active');
    }
    catch (e) {
    }
    try {
        this.getElement().querySelector('nav.tree li > a[data-cd="' + data.cd + '"]').parentNode.classList.add('active');
    }
    catch (e) {
    }
    try {
        this.getElement().querySelector('.pathbrowser__topbar > select').value = data.cs;
    }
    catch (e) {
    }
    this.paint();
};
EurekaView.prototype.assignContextualClickListeners = function (e) {
    var that = this;
    that.assignContexualCodeFocusListeners();
    assignChooseListeners();
    assignRenameListeners();
    assignDeleteListeners();
    function assignChooseListeners() {
        var anchors = that.getElement().querySelectorAll('tr.contextual a.choose');
        for (var i = 0; i < anchors.length; i++) {
            var anchor = anchors[i];
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                handleChooseClicked(this);
            }, false);
            anchor.addEventListener('focus', function (e) {
                that.getElement().parentNode.querySelector('footer.proceed .cta').classList.add('go');
                that.getElement().parentNode.querySelector('footer.proceed .cta').disabled = false;
                that.getElement().parentNode.querySelector('footer.proceed .cta').removeAttribute('disabled');
            }, false);
            anchor.addEventListener('blur', function (e) {
                that.getElement().parentNode.querySelector('footer.proceed .cta').classList.remove('go');
                //that.getElement().parentNode.querySelector('footer.proceed .cta').disabled = true;
                //that.getElement().parentNode.querySelector('footer.proceed .cta').setAttribute('disabled','disabled');
            }, false);
            anchor.addEventListener('mouseover',function(e) {
                that.getElement().parentNode.querySelector('footer.proceed .cta').classList.add('go');
            }, false);
            anchor.addEventListener('mouseout',function(e) {
                that.getElement().parentNode.querySelector('footer.proceed .cta').classList.remove('go');
            }, false);
        }
        function handleChooseClicked(anchor) {
            var contextual = getClosest(anchor, 'tr');
            var mediaRow = contextual.previousSibling;
            that.getController().getModel().setChoosenMediaItem(mediaRow.getAttribute('data-filename'));
        }
    }
    function assignDeleteListeners() {
        var anchors = document.querySelectorAll('tr.contextual a.trash');
        for (var i = 0; i < anchors.length; i++) {
            var anchor = anchors[i];
            anchor.addEventListener('click', function (e) {
                handleTrashClicked(this);
            }, false);
            anchor.addEventListener('focus', function (e) {
                this.addEventListener('keydown', handleTrashKeyDown, false);
            }, false);
            anchor.removeEventListener('blur', function (e) {
                this.removeEventListener('keydown', handleTrashKeyDown, false);
            }, false);
        }
        function handleTrashClicked(anchor) {
            var contextual = getClosest(anchor, 'tr');
            var mediaRow = contextual.previousSibling;
            var nextRow = contextual.nextSibling;
            that.getController().getModel().deleteFile(mediaRow.getAttribute('data-filename'), mediaRow);
            mediaRow.remove();
            contextual.remove();
            try {
                nextRow.focus();
            }
            catch (e) { }
        }
        function handleTrashKeyDown(e) {
            if (e.keyCode === 13) {
                handleTrashClicked(this);
            }
        }
    }
    function assignRenameListeners() {
        var anchors = document.querySelectorAll('tr.contextual a.rename');
        for (var i = 0; i < anchors.length; i++) {
            var anchor = anchors[i];
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                var code = getCodeToFocus(this);
                selectCode(code);
            }, false);
            anchor.addEventListener('focus', function (e) {
                this.addEventListener('keydown', handleAnchorKeyDown, false);
            }, false);
            anchor.addEventListener('blur', function (e) {
                this.removeEventListener('keydown', handleAnchorKeyDown, false);
            }, false);
        }
        function handleAnchorKeyDown(e) {
            var code = getCodeToFocus(this);
            var tr = getClosest(this, '.contextual').previousSibling;
            if (e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                selectCode(code);
            }
        }
        function selectCode(code) {
            code.focus();
            try {
                code.select(); // if you think about it contenteditable nodes should probably be selectable...
            }
            catch (e) { }
            // consider selecting also
        }
        function getCodeToFocus(anchor) {
            var tr = getClosest(anchor, 'tr');
            var mediaRow = tr.previousSibling;
            var code = mediaRow.querySelector('.eureka__row-image code[contenteditable="true"]');
            return code;
        }
    }
};
EurekaView.prototype.assignContexualCodeFocusListeners = function () {
    var that = this;
    var codes = this.getElement().querySelectorAll('tr.eureka__row .eureka__row-image code[contenteditable="true"]');
    for (var i = 0; i < codes.length; i++) {
        var code = codes[i];
        code.addEventListener('focus', function () {
            this.addEventListener('keydown', handleCodeKeyPress, false);
        }, false);
        function handleCodeKeyPress(e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                var tr = this.parentNode.parentNode; // #janky? :/
                var contextual = tr.nextSibling;
                var filename = tr.getAttribute('data-filename');
                code.contentEditable = false;
                var newFilename = this.innerHTML;
                that.getController().getModel().renameFile(filename, newFilename);
                var next = contextual.querySelector('nav > a.rename');
                next.focus();
                window.getSelection().collapse(next, 0);
                return false;
            }
            return true;
        }
    }
};
// ensure the optgroups are always sorted in order of their respective media source ids
EurekaView.prototype.sortBrowseSelectOptGroupsByMediaSourceId = function (select) {
    if (select === undefined)
        select = document.getElementById(this.getController().getModel().getUID() + '__browsing').querySelector('select');
    var os = [];
    var optgrps = select.querySelectorAll('optgroup');
    for (var i = 0; i < optgrps.length; i++) {
        os.push(optgrps[i]);
    }
    var optgroups = os.sort(function (a, b) {
        return parseInt(a.getAttribute('data-source')) - parseInt(b.getAttribute('data-source'));
    });
    select.innerHTML = '';
    for (var _i = 0; _i < optgroups.length; _i++) {
        var optgroup = optgroups[_i];
        select.appendChild(optgroup);
    }
};
EurekaView.prototype.updateMediaSourceListings = function (data) {
    var that = this;
    data = JSON.parse(data);
    var id = data.cs;
    var source = this.getController().getModel().getMediaSourceDTOByID(id);
    function updateTreeSelect() {
        var select = document.getElementById(that.getController().getModel().getUID() + '__mediasource-select');
        var option = null;
        try {
            option = select.querySelector('option[value="' + id + '"]');
        }
        catch (e) { }
        if (!option) {
            option = document.createElement('option');
            option.setAttribute('value', id);
            option.innerHTML = data.title;
            select.appendChild(option);
        }
    }
    function updateTopBarSelect() {
        var select = document.getElementById(that.getController().getModel().getUID() + '__browsing').querySelector('select');
        var optgroup = null;
        try {
            optgroup = select.querySelector('optgroup[data-source="' + id + '"]');
        }
        catch (e) { }
        if (!optgroup) {
            optgroup = document.createElement('optgroup');
            optgroup.setAttribute('label', data.title);
            optgroup.setAttribute('data-source', id);
        }
        var results = data.results;
        var options = [];
        printOptGroupOptions(results);
        optgroup.innerHTML = '';
        function printOptGroupOptions(results) {
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                var option = document.createElement('option');
                option.innerHTML = result.path;
                option.setAttribute('value', result.path);
                options.push(option);
                if (result.children && result.children.length)
                    printOptGroupOptions(result.children);
            }
        }
        for (var _i = 0; _i < options.length; _i++) {
            var option = options[_i];
            optgroup.appendChild(option);
        }
        select.appendChild(optgroup);
        that.sortBrowseSelectOptGroupsByMediaSourceId(select);
    }
    updateTreeSelect();
    updateTopBarSelect();
};
/*__                    __                 ___    ___
/\  _`\                 /\ \__             /\_ \  /\_ \
\ \ \/\_\    ___     ___\ \ ,_\  _ __   ___\//\ \ \//\ \      __   _ __
\ \ \/_/_  / __`\ /' _ `\ \ \/ /\`'__\/ __`\\ \ \  \ \ \   /'__`\/\`'__\
 \ \ \L\ \/\ \L\ \/\ \/\ \ \ \_\ \ \//\ \L\ \\_\ \_ \_\ \_/\  __/\ \ \/
  \ \____/\ \____/\ \_\ \_\ \__\\ \_\\ \____//\____\/\____\ \____\\ \_\
   \/___/  \/___/  \/_/\/_/\/__/ \/_/ \/___/ \/____/\/____/\/____/ \/*/
var EurekaController = function (opts) {
    opts = opts !== undefined ? opts : {};
    this.opts = opts;
    this.view = null;
    this.model = null;
    if (this.opts.model !== undefined)
        this.setModel(this.opts.model);
    if (this.opts.view !== undefined)
        this.setView(this.opts.view);
};
EurekaController.prototype.getModel = function () {
    return this.model;
};
EurekaController.prototype.setModel = function (model) {
    this.model = model;
};
EurekaController.prototype.getView = function () {
    return this.view;
};
EurekaController.prototype.setView = function (view) {
    this.view = view;
};
EurekaController.prototype.init = function () {
    var that = this;
    var eureka = this.getView().getElement(); // we found it!
    eureka.addEventListener('eurekaViewChange', function (e) {
        that.getModel().setCurrentView(e.currentView, false);
    });
    eureka.addEventListener('eurekaCurrentDirectoryChange', function (e) {
        ajax.get(that.getModel().getListDirectoryRequestURL(), { s: that.getModel().getCurrentMediaSource(), dir: e.currentDirectory, headers:that.getModel().getXHRHeaders() }, function (data) {
            that.getView().paintJSON(data);
        });
    });
    eureka.addEventListener('eurekaMediaSourceChange', function (e) {
        ajax.get(that.getModel().getListSourceRequestURL(), { s: e.currentMediaSource, headers:that.getModel().getXHRHeaders() }, function (data) {
            that.getView().paintTree(data);
        });
    });
    that.getView().getElement().addEventListener('MediaSourcesListChange', function (e) {
        var sources = e.data;
        for (var i = 0; i < sources.length; i++) {
            var source = new EurekaMediaSourceDTO(sources[i].opts);
            var id = source.getID();
            //var title = source.getTitle();
            
            function requestMediaListings(source) {
                var id = source.getID();
                ajax.get(that.getModel().getListSourceRequestURL(), { s: id, headers:that.getModel().getXHRHeaders() }, function (data) {
                    that.getView().updateMediaSourceListings(data);
                });
            }
            requestMediaListings(source);
        }
    });
    ajax.get(that.getModel().getListSourcesRequestURL(), {headers:that.getModel().getXHRHeaders()}, function (data) {
        that.getModel().setMediaSourcesData(data);
    });
};