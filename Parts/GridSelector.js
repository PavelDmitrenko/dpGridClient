/// <reference path="../dpgrid.ts" />
var GridSelector = (function () {
    function GridSelector(gridInstance) {
        var _this = this;
        this._gridInstance = gridInstance;
        this._shift = false;
        this._ctrl = false;
        $((document)).on("keydown", function (e) {
            if (e.shiftKey) {
                _this._shift = true;
                _this._ctrl = false;
            }
            else {
                _this._shift = false;
            }
            ;
            if (e.ctrlKey) {
                _this._shift = false;
                _this._ctrl = true;
            }
            else {
                _this._ctrl = false;
            }
            ;
        })
            .on("keyup", function (e) {
            _this._shift = false;
            _this._ctrl = false;
        });
    }
    GridSelector.prototype.SelectAll = function () {
        this._GetRows().addClass("gridrow__selected");
    };
    GridSelector.prototype.GetSelected = function () {
        var arr = new Array();
        var sel = this._gridInstance.Container.find(".ui-jqgrid-bdiv tbody > tr.gridrow__selected:not(.jqgroup):not(.jqgfirstrow)");
        sel.each(function (ind, el) {
            var idz = $((el)).attr("id");
            var intVal = parseInt(idz);
            arr.push(intVal);
        });
        return arr;
    };
    GridSelector.prototype._GetRows = function () {
        return this._gridInstance.Container.find(".ui-jqgrid-bdiv tbody > tr:not(.jqgfirstrow):not(.jqgroup)");
    };
    GridSelector.prototype.RightClickInvoke = function (rowid) {
        var row = this._gridInstance.Container.find("#" + rowid);
        var curSel = row.hasClass("gridrow__selected");
        if (!curSel) {
            var anythingSelected = this._SelectedCount();
            if (anythingSelected === 0) {
                row.addClass("gridrow__selected");
            }
            else {
                this._ClearSelection();
                row.addClass("gridrow__selected");
            }
            ;
        }
    };
    GridSelector.prototype._SelectedCount = function () {
        return this._gridInstance.Container.find("tbody > tr.gridrow__selected").length;
    };
    GridSelector.prototype._ClearSelection = function () {
        this._gridInstance.Container.find("tbody > tr.gridrow__selected").removeClass("gridrow__selected");
    };
    GridSelector.prototype.GridClick = function (rowid) {
        var curRow = this._gridInstance.Container.find("#" + rowid);
        var prevSel = 0;
        if (!this._shift && !this._ctrl) {
            prevSel = rowid;
            this._ClearSelection();
            curRow.addClass("gridrow__selected");
        }
        ;
        if (this._ctrl) {
            prevSel = rowid;
            if (curRow.hasClass("gridrow__selected")) {
                curRow.removeClass("gridrow__selected");
            }
            else {
                curRow.addClass("gridrow__selected");
            }
            ;
        }
        ;
        if (this._shift) {
            var prevSelEl = this._gridInstance.RowsContainer.find("#" + prevSel);
            var newSelEl = curRow;
            var prevselIndex = prevSelEl.index();
            var newselIndex = newSelEl.index();
            if (prevselIndex < newselIndex) {
                prevSelEl.nextUntil(curRow).addBack().addClass("gridrow__selected");
                newSelEl.addClass("gridrow__selected");
            }
            ;
            if (prevselIndex > newselIndex) {
                newSelEl.nextUntil(prevSelEl).addBack().addClass("gridrow__selected");
            }
            ;
        }
        ;
        this._RefreshCounter();
    };
    GridSelector.prototype.AttachLasso = function () {
        var _this = this;
        this._gridInstance.Container.selectable({
            filter: "tr",
            delay: 30,
            selecting: function (event, ui) {
                $(ui.selecting).addClass("gridrow__selected");
                _this._RefreshCounter();
            },
            unselecting: function (event, ui) {
                $(ui.unselecting).removeClass("gridrow__selected");
                _this._RefreshCounter();
            },
            selected: function (event, ui) {
            }
        });
    };
    GridSelector.prototype._RefreshCounter = function () {
        this._gridInstance.Footer.SetSelected(this._SelectedCount());
    };
    return GridSelector;
}());
//# sourceMappingURL=GridSelector.js.map