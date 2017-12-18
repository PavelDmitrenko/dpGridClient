﻿
/// <reference path="Parts/GridSelector.ts" />
/// <reference path="parts/interfaces.ts" />
/// <reference path="../../typings/jqgrid/jqgrid.d.ts" />
/// <reference path="parts/footer.ts" />


class GridForm implements IBaseGridForm {

	public Footer: Footer;
	public Selector: GridSelector;
	public Container: JQuery;

	private _currentPage: number;
	private _rowsToLoad: Array<number>;

	private _isFirstLoad: boolean;
	private _settings: IGridSettings;

	private _UrlExport: string;
	private _ColumnsStructure: JQueryJqGridColumn[];
	private _ScrollLeft: number;
 
	public Grid: JQuery;
	protected ShowPager: boolean;
	public RowsContainer: JQuery;
	private _NoData: JQuery;

	private _ContextMenuRowsItems: any;
	private _ContextMenuColumns: IContextMenu;

	protected OnContextRowsClick: (itemName: string, targetId) => void;
	protected OnContextColumnsClick: (itemName: string, targetId) => void;

	public Init(settings: IGridSettings) {
		this._settings = settings;
		this._OnInit();
	}

	protected ColumnsStructureGet() {
		return this._ColumnsStructure;
	};

	private _OnInit() {

		if (!this.Container)
			throw new Error("OnLoad / Не найден основной контейнер.");

		this.Grid = $(`<table id='GridTable_${this._settings.GridId}' />`);
		this.Grid.addClass("GridTable");

		const pager = $("<div/>").attr("id", "gridpager");
		this._NoData = $("<div />").addClass("grid--nodata").html("Нет данных для отображения");
		this._currentPage = 1;
		this._rowsToLoad = new Array();

		//if (this.Container.attr("class") !== "GridContainer") {
		//	grCont = this.Container.find("#GridContainer");
		//}
		//else
		//{
		let grCont = this.Container;
		//};

		if (grCont.length === 0)
			throw new Error("OnLoad / Не найден контейнер для грида.");

		grCont.append(this.Grid);

		if (this._settings.ShowPager) {
			grCont.append(pager);
		}

		$.ajax({
			url: this._settings.UrlColumns,
			success: (data) => {
				this._ColumnsStructure = data;
				console.log("Columns");
				console.log(data);
				this.PlaceGrid();
			}
		});


	}

	PlaceGrid(): void {

		const opt: JQueryJqGridOptions = {
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
			multiSort:false,
			serializeGridData: (postData) => {
				return this._PostDataSerialize(postData);
			},

			width: 500,

			loadComplete: (data) => {
				this._DataLoaded(data);
			},

			onInitGrid: () => {
				this._isFirstLoad = true;
				this.OnInitGrid();
			
			},

			onSelectRow: (rowid: string, status: any, e: Event) => {
				this.Selector.GridClick(parseInt(rowid));
			}
		};

		this.Grid.jqGrid(opt);

		this.Grid.jqGrid("filterToolbar", {
			searchOnEnter: true,
			stringResult: true,
			autosearch: true,

			beforeSearch: () => {
				this._ScrollLeft = this.Container.find(".ui-jqgrid-bdiv:not(.frozen-bdiv)").scrollLeft();
			},

			afterSearch: () => {
				const postData = this.Grid.jqGrid("getGridParam", "postData");
				this.Grid.jqGrid("getGridParam", "postData");
				const filterHolder = jQuery.parseJSON(postData.filters);
				this.Container.find(".filteredColumn").removeClass("filteredColumn");

				for (let i = 0; i < filterHolder.rules.length; i++) {
					const colName = filterHolder.rules[i].field;

					$(`td.ui-search-input [name='${colName}']`).each((ind, el) => {
						$(el).closest("th").addClass("filteredColumn");
					});

					$(`th#GridTable_${colName}[role='columnheader']`).addClass("filteredColumn");
				}
			}
		});

		this.Grid.closest(".ui-jqgrid").find("table.ui-search-table .clearsearchclass").each((indx, el) => {
			$(el).html("G").attr("title", "Удалить фильтр");
		});

	}

	private _PostDataSerialize(postData: any) {

		const json = JSON.stringify(this._PostDataGet(postData));
		return json;
	}

	OnInitGrid() {
	
	}

	private _PostDataGet(postData: any) {

		const obj: any = new Object();

		let filterHolder = "";

		if (postData.filters) {
			const rules = JSON.parse(postData.filters).rules;
			filterHolder = rules;
		}

		const Sort: any = new Object();
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
	}


	NextPage() {
		this._currentPage = this._currentPage + 1;
		this.ReloadGrid();
	}

	PrevPage() {
		this._currentPage = this._currentPage - 1;
		this.ReloadGrid();
	}


	ReloadRows(rowsIds: Array<number> | number): void {

		this._LoadRows(rowsIds, (data) => {

			data.rows.forEach((val) => {
				this._PlaceUpdatedRow(val.id, val, null, true);
			});

			if (data.rows.length === 1) {
				this.FocusRow(data.rows[0]);
			}

			this._DataLoaded(data);

			this._FixFrozeColumns();

		});
	}

	private _LoadRows(rowIds: Array<number> | number, callback: (rows) => void) {

		this._rowsToLoad = new Array();

		this._rowsToLoad.concat(rowIds);
		if ($.isArray(rowIds)) {
			this._rowsToLoad.concat(rowIds);
		} else {
			(this._rowsToLoad as any).push(rowIds);
		}

		const postData: any = new Object();
		postData.RowsToLoad = this._rowsToLoad;
		const d = this._PostDataGet(postData);

		return $.ajax({
			url: `${this._settings.UrlData}`,
			data: d,
			type: "POST",
			success: (data) => {
				if (callback)
					callback(data);
			}
		});

	}

	ReloadGrid() {
		this.Grid.trigger("reloadGrid");
	}


	GetClosestRow(child: JQuery | Element): IDpGridRow {
		const row = $(child).closest(`tr[role='row']`);

		const result: IDpGridRow = {
			html: row,
			id: row.attr("id")
		};

		return result;
	}

	public GetRow(rowId: number): JQuery {
		return this.Grid.find(`tr[role='row'][id='${rowId}']`);
	}

	private _PlaceUpdatedRow(rowId: number, row: any, callback = null, animate: boolean = true) {

		let tableRow = this.GetRow(rowId);

		if (tableRow.length === 0) {
			this.Grid.addRowData(row.id, row, "first");
			tableRow = this.GetRow(row.id);
		} else {
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
	}

	private _FixFrozeColumns() {
		const bdiv = this.Container.find(".ui-jqgrid-bdiv");
		bdiv.scrollTop(bdiv.scrollTop()); // FrozenColumns Fix
	}

	RemoveRow(RowId: number) {

		const tableRow = this.GetRow(RowId);

		//tableRow.animate({ opacity: 0.5 }, 150)
		//	.animate({ opacity: "1" }, 150)
		//	.animate({ opacity: "0.5" }, 150)
		//	.animate({ opacity: "1" },
		//	150,
		//	() => {
		//		this.Grid.jqGrid("delRowData", RowId);
		//	});

	}

	FocusRow(RowId: number) {
		this.Grid.jqGrid("setSelection", RowId, true);
	}

	DataLoaded(data?: any) {

	}

	private _DataLoaded(data?: any) {

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
		};

		this._FixFrozeColumns();
		this.ContextMenuRowsInit();
		this.ContextMenuColumnsInit();

		this.Selector.AttachLasso();
		this.DataLoaded(data);
	}



	FirstLoaded() {
		this.Container.find(".ui-jqgrid-bdiv").off("scroll").on("scroll", (d) => {
			//$.cookie(this._settings.GridId + "Scroll", d.target.scrollTop, { expires: 7, path: "/" });
		});
	}

	SetAuxData() {

	}

	private _EmptyGrid() {
		//this.Grid.addRowData(1, {}, "first");
		const haveFrozen = this.Container.find("#GridTable_frozen").length !== 0;
		const headerWidth = this.Container.find("tr[role='row'].jqg-first-row-header").width();

		if (haveFrozen) {
			const ph = $("<div />").addClass("grid--nodata__placeholder").html("&nbsp;").width(headerWidth);
			this.Container.find(".ui-jqgrid-bdiv.frozen-bdiv").prepend(this._NoData);
			this.Container.find(".ui-jqgrid-bdiv:not(.frozen-bdiv)").prepend(ph);
		} else {
			this._NoData.width(headerWidth);
			this.Container.find(".ui-jqgrid-bdiv").prepend(this._NoData);
		};

		this.Container.find(".ui-jqgrid-bdiv .grid--nodata").remove();
		this.Container.find(".grid--nodata__placeholder").remove();
	}



	ContextMenuColumnsInit() {

		if (!this._ContextMenuColumns)
			return;

		var divMenu: JQuery = this.Container.find("#contextMenuColumns");
		const tmpl = $("<div />").attr("id", "contextMenuColumns");

		if (divMenu.length === 0) {
			this.Container.append(tmpl);
		} else {
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

	}

	ContextMenuRowsInit() {

		if (!this._ContextMenuRowsItems)
			return;

		var divMenu: JQuery = this.Container.find("#contextMenu");
		const tmpl = $("<div />").attr("id", "contextMenu");

		if (divMenu.length === 0) {
			this.Container.append(tmpl);
		} else {
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

	}

	
	AdjustGridSize() {
		 
		const uiJqgrid = this.Grid.closest("div.ui-jqgrid");

		const pWidth = uiJqgrid.parent().outerWidth();

		const parentHeight = uiJqgrid.parent().outerHeight();

		const headerHeight = uiJqgrid.find("div.ui-jqgrid-hdiv").outerHeight();

		let pagerHeight = uiJqgrid.find("#gridpager").outerHeight();
		pagerHeight = !pagerHeight ? 0 : pagerHeight;

		const height = parentHeight - headerHeight - pagerHeight - 2;
		const width = pWidth - 0;

		this.Grid.jqGrid("setGridWidth", width);
		this.Grid.jqGrid("setGridHeight", height);
	};


}