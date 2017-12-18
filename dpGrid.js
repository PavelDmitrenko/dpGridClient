/// <reference path="Parts/GridSelector.ts" />
/// <reference path="parts/interfaces.ts" />
/// <reference path="parts/footer.ts" />
/// <reference path="jquery.jqgrid/typings/jqgrid/jqgrid.d.ts" />
var GridForm = (function () {
    function GridForm() {
    }
    GridForm.prototype.Init = function (settings) {
        this._settings = settings;
        this._OnInit();
    };
    GridForm.prototype.ColumnsStructureGet = function () {
        return this._ColumnsStructure;
    };
    ;
    GridForm.prototype._OnInit = function () {
        var _this = this;
        if (!this.Container)
            throw new Error("OnLoad / Не найден основной контейнер.");
        this.Grid = $("<table id='GridTable_" + this._settings.GridId + "' />");
        this.Grid.addClass("GridTable");
        var pager = $("<div/>").attr("id", "gridpager");
        this._NoData = $("<div />").addClass("grid--nodata").html("Нет данных для отображения");
        this._currentPage = 1;
        this._rowsToLoad = new Array();
        //if (this.Container.attr("class") !== "GridContainer") {
        //	grCont = this.Container.find("#GridContainer");
        //}
        //else
        //{
        var grCont = this.Container;
        //};
        if (grCont.length === 0)
            throw new Error("OnLoad / Не найден контейнер для грида.");
        grCont.append(this.Grid);
        if (this._settings.ShowPager) {
            grCont.append(pager);
        }
        $.ajax({
            url: this._settings.UrlColumns,
            success: function (data) {
                _this._ColumnsStructure = data;
                console.log("Columns");
                console.log(data);
                _this.PlaceGrid();
            }
        });
    };
    GridForm.prototype.PlaceGrid = function () {
        var _this = this;
        var opt = {
            url: this._settings.UrlData,
            datatype: "json",
            loadonce: false,
            mtype: "POST",
            ajaxGridOptions: { contentType: "application/json" },
            //grouping: true,
            //groupingView: {
            //	groupField: ['Office'],
            //	groupOrder: ['asc']
            //},
            pager: "#gridpager",
            colModel: this._ColumnsStructure,
            rowNum: 300,
            shrinkToFit: false,
            regional: "ru",
            viewrecords: true,
            gridview: true,
            scroll: false,
            rownumbers: false,
            treeGrid: false,
            multiSort: false,
            serializeGridData: function (postData) {
                return _this._PostDataSerialize(postData);
            },
            width: 500,
            loadComplete: function (data) {
                _this._DataLoaded(data);
            },
            onInitGrid: function () {
                _this._isFirstLoad = true;
                _this.OnInitGrid();
            },
            onSelectRow: function (rowid, status, e) {
                _this.Selector.GridClick(parseInt(rowid));
            }
        };
        this.Grid.jqGrid(opt);
        this.Grid.jqGrid("filterToolbar", {
            searchOnEnter: true,
            stringResult: true,
            autosearch: true,
            beforeSearch: function () {
                _this._ScrollLeft = _this.Container.find(".ui-jqgrid-bdiv:not(.frozen-bdiv)").scrollLeft();
            },
            afterSearch: function () {
                var postData = _this.Grid.jqGrid("getGridParam", "postData");
                _this.Grid.jqGrid("getGridParam", "postData");
                var filterHolder = jQuery.parseJSON(postData.filters);
                _this.Container.find(".filteredColumn").removeClass("filteredColumn");
                for (var i = 0; i < filterHolder.rules.length; i++) {
                    var colName = filterHolder.rules[i].field;
                    $("td.ui-search-input [name='" + colName + "']").each(function (ind, el) {
                        $(el).closest("th").addClass("filteredColumn");
                    });
                    $("th#GridTable_" + colName + "[role='columnheader']").addClass("filteredColumn");
                }
            }
        });
        this.Grid.closest(".ui-jqgrid").find("table.ui-search-table .clearsearchclass").each(function (indx, el) {
            $(el).html("G").attr("title", "Удалить фильтр");
        });
    };
    GridForm.prototype._PostDataSerialize = function (postData) {
        var json = JSON.stringify(this._PostDataGet(postData));
        return json;
    };
    GridForm.prototype.OnInitGrid = function () {
    };
    GridForm.prototype._PostDataGet = function (postData) {
        var obj = new Object();
        var filterHolder = "";
        if (postData.filters) {
            var rules = JSON.parse(postData.filters).rules;
            filterHolder = rules;
        }
        var Sort = new Object();
        Sort.Column = this.Grid.jqGrid("getGridParam", "sortname");
        Sort.Order = this.Grid.jqGrid("getGridParam", "sortorder");
        obj.PostData = new Object();
        obj.PostData.Filters = filterHolder;
        obj.PostData.Sort = Sort;
        obj.PostData.Page = this._currentPage;
        obj.PostData.AuxData = JSON.stringify(this.SetAuxData());
        obj.PostData.GridId = this._settings.GridId;
        obj.PostData.RowsToLoad = this._rowsToLoad;
        return obj;
    };
    GridForm.prototype.NextPage = function () {
        this._currentPage = this._currentPage + 1;
        this.ReloadGrid();
    };
    GridForm.prototype.PrevPage = function () {
        this._currentPage = this._currentPage - 1;
        this.ReloadGrid();
    };
    GridForm.prototype.ReloadRows = function (rowsIds) {
        var _this = this;
        this._LoadRows(rowsIds, function (data) {
            data.rows.forEach(function (val) {
                _this._PlaceUpdatedRow(val.id, val, null, true);
            });
            if (data.rows.length === 1) {
                _this.FocusRow(data.rows[0]);
            }
            _this._DataLoaded(data);
            _this._FixFrozeColumns();
        });
    };
    GridForm.prototype._LoadRows = function (rowIds, callback) {
        this._rowsToLoad = new Array();
        this._rowsToLoad.concat(rowIds);
        if ($.isArray(rowIds)) {
            this._rowsToLoad.concat(rowIds);
        }
        else {
            this._rowsToLoad.push(rowIds);
        }
        var postData = new Object();
        postData.RowsToLoad = this._rowsToLoad;
        var d = this._PostDataGet(postData);
        return $.ajax({
            url: "" + this._settings.UrlData,
            data: d,
            type: "POST",
            success: function (data) {
                if (callback)
                    callback(data);
            }
        });
    };
    GridForm.prototype.ReloadGrid = function () {
        this.Grid.trigger("reloadGrid");
    };
    GridForm.prototype.GetClosestRow = function (child) {
        var row = $(child).closest("tr[role='row']");
        var result = {
            html: row,
            id: row.attr("id")
        };
        return result;
    };
    GridForm.prototype.GetRow = function (rowId) {
        return this.Grid.find("tr[role='row'][id='" + rowId + "']");
    };
    GridForm.prototype._PlaceUpdatedRow = function (rowId, row, callback, animate) {
        if (callback === void 0) { callback = null; }
        if (animate === void 0) { animate = true; }
        var tableRow = this.GetRow(rowId);
        if (tableRow.length === 0) {
            this.Grid.addRowData(row.id, row, "first");
            tableRow = this.GetRow(row.id);
        }
        else {
            this.Grid.setRowData(rowId, row);
        }
        if (callback)
            callback();
        if (animate) {
            tableRow.animate({ opacity: "0.5" }, 150)
                .animate({ opacity: "1" }, 150)
                .animate({ opacity: "0.5" }, 150)
                .animate({ opacity: "1" }, 150);
        }
    };
    GridForm.prototype._FixFrozeColumns = function () {
        var bdiv = this.Container.find(".ui-jqgrid-bdiv");
        bdiv.scrollTop(bdiv.scrollTop()); // FrozenColumns Fix
    };
    GridForm.prototype.RemoveRow = function (RowId) {
        var tableRow = this.GetRow(RowId);
        //tableRow.animate({ opacity: 0.5 }, 150)
        //	.animate({ opacity: "1" }, 150)
        //	.animate({ opacity: "0.5" }, 150)
        //	.animate({ opacity: "1" },
        //	150,
        //	() => {
        //		this.Grid.jqGrid("delRowData", RowId);
        //	});
    };
    GridForm.prototype.FocusRow = function (RowId) {
        this.Grid.jqGrid("setSelection", RowId, true);
    };
    GridForm.prototype.DataLoaded = function (data) {
    };
    GridForm.prototype._DataLoaded = function (data) {
        this.RowsContainer = this.Grid.find("> tbody > tr:not(.jqgfirstrow)");
        if (this._isFirstLoad) {
            this.FirstLoaded();
            this._isFirstLoad = false;
            this.Selector = new GridSelector(this);
            this.Footer = new Footer(this);
        }
        //$("tr.jqgrow td").each((indx, el) => {
        //	if ($(el).find(".cell").length === 0) {
        //		$(el).wrapInner("<div class=\"cell\"/>");
        //	}
        //});
        if (data && data.records === 0) {
            this._EmptyGrid();
        }
        ;
        this._FixFrozeColumns();
        this.ContextMenuRowsInit();
        this.ContextMenuColumnsInit();
        this.Selector.AttachLasso();
        this.DataLoaded(data);
    };
    GridForm.prototype.FirstLoaded = function () {
        this.Container.find(".ui-jqgrid-bdiv").off("scroll").on("scroll", function (d) {
            //$.cookie(this._settings.GridId + "Scroll", d.target.scrollTop, { expires: 7, path: "/" });
        });
    };
    GridForm.prototype.SetAuxData = function () {
    };
    GridForm.prototype._EmptyGrid = function () {
        //this.Grid.addRowData(1, {}, "first");
        var haveFrozen = this.Container.find("#GridTable_frozen").length !== 0;
        var headerWidth = this.Container.find("tr[role='row'].jqg-first-row-header").width();
        if (haveFrozen) {
            var ph = $("<div />").addClass("grid--nodata__placeholder").html("&nbsp;").width(headerWidth);
            this.Container.find(".ui-jqgrid-bdiv.frozen-bdiv").prepend(this._NoData);
            this.Container.find(".ui-jqgrid-bdiv:not(.frozen-bdiv)").prepend(ph);
        }
        else {
            this._NoData.width(headerWidth);
            this.Container.find(".ui-jqgrid-bdiv").prepend(this._NoData);
        }
        ;
        this.Container.find(".ui-jqgrid-bdiv .grid--nodata").remove();
        this.Container.find(".grid--nodata__placeholder").remove();
    };
    GridForm.prototype.ContextMenuColumnsInit = function () {
        if (!this._ContextMenuColumns)
            return;
        var divMenu = this.Container.find("#contextMenuColumns");
        var tmpl = $("<div />").attr("id", "contextMenuColumns");
        if (divMenu.length === 0) {
            this.Container.append(tmpl);
        }
        else {
            divMenu.replaceWith(tmpl);
        }
        divMenu = this.Container.find("#contextMenuColumns");
        //divMenu.dxContextMenu({
        //	items: this._ContextMenuColumns.items,
        //	target: this.Container.find(this._ContextMenuColumns.selector),
        //	onItemClick: (e) => {
        //		const id = divMenu.attr("target");
        //		this._ContextMenuColumns.onSelect(e.itemData.text, id);
        //	},
        //	onPositioning: (e) => {
        //		let el = $(e.jQueryEvent.target);
        //		if (!el.is("th")) {
        //			el = el.closest("th");
        //		}
        //		divMenu.attr("target", el.attr("id"));
        //	}
        //});
    };
    GridForm.prototype.ContextMenuRowsInit = function () {
        if (!this._ContextMenuRowsItems)
            return;
        var divMenu = this.Container.find("#contextMenu");
        var tmpl = $("<div />").attr("id", "contextMenu");
        if (divMenu.length === 0) {
            this.Container.append(tmpl);
        }
        else {
            divMenu.replaceWith(tmpl);
        }
        divMenu = this.Container.find("#contextMenu");
        //divMenu.dxContextMenu({
        //	items: this._ContextMenuRowsItems,
        //	target: this.Grid.find("tr"),
        //	onItemClick: (e) => {
        //		const id = divMenu.attr("target");
        //		this.OnContextRowsClick(e.itemData.text, id);
        //	},
        //	onPositioning: (e) => {
        //		const el = $(e.jQueryEvent.target);
        //		const row = el.closest("tr[role='row']");
        //		divMenu.attr("target", row.attr("id"));
        //	}
        //});
    };
    GridForm.prototype.AdjustGridSize = function () {
        var uiJqgrid = this.Grid.closest("div.ui-jqgrid");
        var pWidth = uiJqgrid.parent().outerWidth();
        var parentHeight = uiJqgrid.parent().outerHeight();
        var headerHeight = uiJqgrid.find("div.ui-jqgrid-hdiv").outerHeight();
        var pagerHeight = uiJqgrid.find("#gridpager").outerHeight();
        pagerHeight = !pagerHeight ? 0 : pagerHeight;
        var height = parentHeight - headerHeight - pagerHeight - 2;
        var width = pWidth - 0;
        this.Grid.jqGrid("setGridWidth", width);
        this.Grid.jqGrid("setGridHeight", height);
    };
    ;
    return GridForm;
}());
//# sourceMappingURL=dpGrid.js.map