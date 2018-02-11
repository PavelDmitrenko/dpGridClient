/// <reference path="../../typings/jquery/jquery.d.ts" />
var Footer = (function () {
    function Footer(gridInstance) {
        var _this = this;
        this._gridInstance = gridInstance;
        this._container = gridInstance.Container.parent().find(".mainpage__gridfooter");
        this._ctrlSelected = this._container.find("#selected");
        this._ctrlArrowNext = this._container.find("#next");
        this._ctrlArrowPrev = this._container.find("#prev");
        this._ctrlRecsCount = this._container.find("#recCount");
        this._ctrlPageCount = this._container.find("#nums");
        this._container.find("#cont").show();
        this._ctrlArrowNext.on("click", function () {
            _this._NextPage();
        });
        this._ctrlArrowPrev.on("click", function () {
            _this._PrevPage();
        });
        $(document).bind("keydown", "ctrl+right", function () {
            _this._NextPage();
        });
        $(document).bind("keydown", "ctrl+left", function () {
            _this._PrevPage();
        });
    }
    Footer.prototype.SetSelected = function (c) {
        var _this = this;
        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId);
        }
        ;
        this._timeoutId = setTimeout(function () {
            _this._ctrlSelected.html(c.toString());
        }, 500);
    };
    Footer.prototype.Recalc = function (obj) {
        var curPage = parseInt(obj.page);
        var totalPages = parseInt(obj.total);
        var totalRecords = parseInt(obj.records);
        var curRecord = totalRecords;
        if (curPage === 1)
            this._ctrlArrowPrev.addClass("disabled");
        else
            this._ctrlArrowPrev.removeClass("disabled");
        if (curPage === totalPages)
            this._ctrlArrowNext.addClass("disabled");
        else
            this._ctrlArrowNext.removeClass("disabled");
        this._ctrlRecsCount.html(curRecord.toString());
        this._ctrlPageCount.html(curPage + " / " + totalPages);
    };
    Footer.prototype._NextPage = function () {
        if (this._ctrlArrowNext.hasClass("disabled"))
            return;
        this._gridInstance.NextPage();
    };
    Footer.prototype._PrevPage = function () {
        if (this._ctrlArrowPrev.hasClass("disabled"))
            return;
        this._gridInstance.PrevPage();
    };
    return Footer;
}());
//# sourceMappingURL=footer.js.map