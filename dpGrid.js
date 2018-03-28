/// <reference path="Parts/GridSelector.ts" />
/// <reference path="parts/interfaces.ts" />
/// <reference path="parts/footer.ts" />
/// <reference path="jquery.jqgrid/typings/jqgrid/jqgrid.d.ts" />
var GridForm = /** @class */ (function () {
    function GridForm() {
    }
    Object.defineProperty(GridForm.prototype, "GridElement", {
        get: function () {
            return this._Grid;
        },
        enumerable: true,
        configurable: true
    });
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
        this._NoData = $("<div />").addClass("grid--nodata").html("Нет данных для отображения");
        this._currentPage = 1;
        this._rowsToLoad = new Array();
        this._FiltersLocal = new Array();
        if (this.Container.hasClass("dpGrid")) {
            //	grCont = this.Container.find("#GridContainer");
        }
        else {
            this.Container.addClass("dpGrid");
        }
        ;
        if (this._Grid) {
            this.ReloadGrid();
        }
        else {
            this._Grid = $("<table id='GridTable_" + this._settings.GridId + "' />");
            this._Grid.addClass("GridTable");
            this.Container.append(this._Grid);
            if (this._settings.ShowPager) {
                this.Footer = new Footer(this);
            }
            ;
            if (!this._settings.Columns) {
                $.ajax({
                    url: this._settings.UrlColumns,
                    success: function (data) {
                        _this._ColumnsStructure = data;
                        console.log("Columns");
                        console.log(data);
                        _this._PlaceGrid();
                    }
                });
            }
            else {
                this._ColumnsStructure = this._settings.Columns;
                this._PlaceGrid();
            }
        }
    };
    GridForm.prototype._PlaceGrid = function () {
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
            //pager: `#gridpager_${this._settings.GridId}`,
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
            rowattr: function (rd) {
                return { "data-mydata": JSON.stringify(rd) };
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
        this._Grid.jqGrid(opt);
        if (this._settings.ShowFilters) {
            this._Grid.jqGrid("filterToolbar", {
                searchOnEnter: true,
                stringResult: true,
                autosearch: true,
                beforeSearch: function () {
                    _this._ScrollLeft = _this.Container.find(".ui-jqgrid-bdiv:not(.frozen-bdiv)").scrollLeft();
                },
                afterSearch: function () {
                    var postData = _this._Grid.jqGrid("getGridParam", "postData");
                    _this._Grid.jqGrid("getGridParam", "postData");
                    var filterHolder = jQuery.parseJSON(postData.filters);
                    _this.Container.find(".filteredColumn").removeClass("filteredColumn");
                    for (var i = 0; i < filterHolder.rules.length; i++) {
                        var colName = filterHolder.rules[i].field;
                        $("td.ui-search-input [name='" + colName + "']").each(function (ind, el) {
                            $(el).closest("th").addClass("filteredColumn");
                        });
                        $("th#GridTable_" + _this._settings.GridId + "_" + colName + "[role='columnheader']").addClass("filteredColumn");
                    }
                }
            });
        }
        this._Grid.closest(".ui-jqgrid").find("table.ui-search-table .clearsearchclass").each(function (indx, el) {
            $(el).html("G").attr("title", "Удалить фильтр");
        });
        this.AdjustGridSize();
    };
    GridForm.prototype._PostDataSerialize = function (postData) {
        var json = JSON.stringify(this._PostDataGet(postData));
        return json;
    };
    GridForm.prototype.OnInitGrid = function () {
    };
    GridForm.prototype.FilterAdd = function (filter) {
        var filterExists = false;
        for (var i = 0; i < this._FiltersLocal.length; i++) {
            if (this._FiltersLocal[i].ColumnName === filter.ColumnName) {
                filterExists = true;
                this._FiltersLocal[i] = filter;
            }
        }
        if (!filterExists)
            this._FiltersLocal.push(filter);
    };
    GridForm.prototype.OnBeforeFilterPost = function (filters) {
    };
    GridForm.prototype.SetLabel = function (columnName, text) {
        this._Grid.jqGrid("setLabel", columnName, text);
    };
    GridForm.prototype._PostDataGet = function (postData) {
        var obj = new Object();
        var filterHolder = new Array();
        if (postData.filters) {
            var rules = JSON.parse(postData.filters).rules;
            filterHolder = rules;
        }
        var Sort = new Object();
        Sort.Column = this._Grid.jqGrid("getGridParam", "sortname");
        Sort.Order = this._Grid.jqGrid("getGridParam", "sortorder");
        obj.PostData = new Object();
        obj.PostData.Sort = Sort;
        obj.PostData.Page = this._currentPage;
        obj.PostData.AuxData = JSON.stringify(this.SetAuxData());
        obj.PostData.GridId = this._settings.GridId;
        obj.PostData.RowsToLoad = this._rowsToLoad;
        this.OnBeforeFilterPost(filterHolder);
        this._FiltersLocal.forEach(function (val) {
            filterHolder.push({
                field: val.ColumnName,
                data: val.Value,
                op: "bw"
            });
        });
        obj.PostData.Filters = filterHolder;
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
        this._rowsToLoad = [];
        if ($.isArray(rowIds)) {
            (_a = this._rowsToLoad).push.apply(_a, rowIds);
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
        var _a;
    };
    GridForm.prototype.ReloadGrid = function () {
        this._Grid.trigger("reloadGrid");
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
        return this._Grid.find("tr[role='row'][id='" + rowId + "']");
    };
    GridForm.prototype._PlaceUpdatedRow = function (rowId, row, callback, animate) {
        if (callback === void 0) { callback = null; }
        if (animate === void 0) { animate = true; }
        var tableRow = this.GetRow(rowId);
        if (tableRow.length === 0) {
            this._Grid.addRowData(row.id, row, "first");
            tableRow = this.GetRow(row.id);
        }
        else {
            this._Grid.setRowData(rowId, row);
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
        this._Grid.jqGrid("setSelection", RowId, true);
    };
    GridForm.prototype.DataLoaded = function (data) {
    };
    GridForm.prototype._DataLoaded = function (data) {
        var _this = this;
        this.RowsContainer = this._Grid.find("> tbody > tr:not(.jqgfirstrow)");
        if (this._isFirstLoad) {
            this.FirstLoaded();
            this._isFirstLoad = false;
            this.Selector = new GridSelector(this);
        }
        if (this._settings.AddButton && this._settings.AddButton.ShowButton) {
            var butCont = $(this.Container.find("table > thead th[role='columnheader']").first());
            butCont.html("A").addClass("button--add");
            butCont.off("click").on("click", function (el) {
                console.log(el);
                _this._settings.AddButton.OnClick();
            });
        }
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
        var uiJqgrid = this._Grid.closest("div.ui-jqgrid");
        var pWidth = uiJqgrid.parent().outerWidth();
        var parentHeight = this.Container.parent().outerHeight();
        //const parentHeight = uiJqgrid.parent().outerHeight();
        var headerHeight = uiJqgrid.find("div.ui-jqgrid-hdiv").outerHeight();
        var pagerHeight = this.Container.find("#gridpager").outerHeight();
        pagerHeight = !pagerHeight ? 0 : pagerHeight;
        var height = parentHeight - headerHeight - pagerHeight - 2;
        var width = pWidth - 0;
        this._Grid.jqGrid("setGridWidth", width);
        this._Grid.jqGrid("setGridHeight", height);
    };
    ;
    return GridForm;
}());
//# sourceMappingURL=dpGrid.js.map