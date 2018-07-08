/// <reference path="parts/columnsstates.ts" />
/// <reference path="Parts/GridSelector.ts" />
/// <reference path="parts/interfaces.ts" />
/// <reference path="parts/footer.ts" />
/// <reference path="jquery.jqgrid/typings/jqgrid/jqgrid.d.ts" />


class GridForm implements IBaseGridForm {

	public Footer: Footer;
	public Selector: GridSelector;
	public Container: JQuery;

	private _currentPage: number;
	private _rowsToLoad: Array<any> ;

	private _isFirstLoad: boolean;
	private _settings: IGridSettings;

	private _UrlExport: string;
	private _ColumnsStructure: JQueryJqGridColumn[];
	private _ScrollLeft: number;
	private _FiltersLocal: Array<IDpGridFilter>;
	private _columnsStates: dpGridColumnsStates;

	private _Grid: JQuery;
	protected ShowPager: boolean;
	public RowsContainer: JQuery;
	private _NoData: JQuery;

	private _ContextMenuRowsItems: any;
	private _ContextMenuColumns: IContextMenu;

	protected OnContextRowsClick: (itemName: string, targetId) => void;
	protected OnContextColumnsClick: (itemName: string, targetId) => void;

	public get GridElement(): JQuery {
		return this._Grid;
	}

	public Init(settings: IGridSettings) {
		this._settings = settings;
		this._columnsStates = new dpGridColumnsStates(this._settings.GridId, this._settings.ColumnsStatesSettings);
		this._OnInit();
	}

	protected ColumnsStructureGet() {
		return this._ColumnsStructure;
	};


	private _OnInit() {

		if (!this.Container)
			throw new Error("OnLoad / Не найден основной контейнер.");

		this._NoData = $("<div />").addClass("grid--nodata").html("Нет данных для отображения");
		this._currentPage = 1;
		this._rowsToLoad = new Array();
		this._FiltersLocal = new Array<IDpGridFilter>();

		if (this.Container.hasClass("dpGrid")) {
			//	grCont = this.Container.find("#GridContainer");
		}
		else {
			this.Container.addClass("dpGrid");
		};

		if (this._Grid) {
			this.ReloadGrid();
		} else {
			this._Grid = $(`<table id='GridTable_${this._settings.GridId}' />`);
			this._Grid.addClass("GridTable");
			this.Container.append(this._Grid);

			if (this._settings.ShowPager) {
				this.Footer = new Footer(this);
			};

			$.when(this._columnsStates.Load())
				.then(() => {

					if (!this._settings.Columns) {
						$.ajax({
							url: this._settings.UrlColumns,
							success: (data) => {
								//data[2].firstsortorder = "asc";
								this._ColumnsStructure = data;
								console.log("Columns");
								console.log(data);
								this._PlaceGrid();
							}
						});

					}
					else {
						this._ColumnsStructure = this._settings.Columns;
						this._PlaceGrid();
					}
			});
		}

	}

	private _PlaceGrid(): void {

		const opt: JQueryJqGridOptions = {

			url: this._settings.UrlData,
			datatype: "json",
			loadonce: false,
			mtype: "POST",
			ajaxGridOptions: { contentType: "application/json" },
			colModel: this._ColumnsStructure,
			rowNum: 300,
			shrinkToFit: false,
			regional: "ru",
			viewrecords: true,
			gridview: true,
			scroll: false,
			rownumbers: false,
			sortable: true,
			treeGrid: false,
			multiSort: false,
			sortname:this._columnsStates.ColumnSortName,
			sortorder: this._columnsStates.ColumnSortOrder,
			serializeGridData: (postData) => {
				return this._PostDataSerialize(postData);
			},

			rowattr: (rd) => {
				//return { "data-mydata": JSON.stringify(rd) };
				if (this._settings.RowAttr) {

				}
				return {"class": "myAltRowClass"};
			},

			width: 500,

			loadComplete: (data) => {
				this._DataLoaded(data);
			},

			gridComplete: () => {
				this._GridComplete();
			},

			onInitGrid: () => {
				this._isFirstLoad = true;
				this.OnInitGrid();
			},
			
			onSortCol: (colName, colIndex,sortorder) => 
			{
				this._SaveColumnsStates();
			},

			onSelectRow: (rowid: string, status: any, e: Event) => {
				this.Selector.GridClick(parseInt(rowid));
			}
		};

		//this._Grid.jqGrid('setGridParam', { sortname: 'ClientName,', sortorder: 'desc' });
		//this._Grid.jqGrid('sortGrid','colName', false, 'asc');

		// Data source is array
		if (this._settings.Data) {
			opt.url = null;
			opt.data = this._settings.Data;
			opt.loadonce = true;
			opt.datatype = "local";
			opt.localReader = {
				repeatitems: true
			}
		}

		this._Grid.jqGrid(opt);

		if (this._settings.ShowFilters) {
			this._Grid.jqGrid("filterToolbar", {
				searchOnEnter: true,
				stringResult: true,
				autosearch: true,

				beforeSearch: () => {
					this._ScrollLeft = this.Container.find(".ui-jqgrid-bdiv:not(.frozen-bdiv)").scrollLeft();
				},

				afterSearch: () => {
					const postData = this._Grid.jqGrid("getGridParam", "postData");
					this._Grid.jqGrid("getGridParam", "postData");
					const filterHolder = jQuery.parseJSON(postData.filters);
					this.Container.find(".filteredColumn").removeClass("filteredColumn");

					for (let i = 0; i < filterHolder.rules.length; i++) {
						const colName = filterHolder.rules[i].field;

						$(`td.ui-search-input [name='${colName}']`).each((ind, el) => {
							$(el).closest("th").addClass("filteredColumn");
						});

						$(`th#GridTable_${this._settings.GridId}_${colName}[role='columnheader']`).addClass("filteredColumn");
					}
				}
			});
		}

		this._Grid.closest(".ui-jqgrid").find("table.ui-search-table .clearsearchclass").each((indx, el) => {
			$(el).html("G").attr("title", "Удалить фильтр");
		});

		this.AdjustGridSize();

	}

	private _SaveColumnsStates(): void {
		const gridParams = this._Grid.jqGrid("getGridParam");
		this._columnsStates.Save(gridParams);
	}

	private _PostDataSerialize(postData: any) {
		const json = JSON.stringify(this._PostDataGet(postData));
		return json;
	}

	OnInitGrid() {

	}

	protected FilterAdd(filter: IDpGridFilter) {
		let filterExists: boolean = false;

		for (let i = 0; i < this._FiltersLocal.length; i++) {
			if (this._FiltersLocal[i].ColumnName === filter.ColumnName) {
				filterExists = true;
				this._FiltersLocal[i] = filter;
			}
		}

		if (!filterExists)
			this._FiltersLocal.push(filter);
	}

	protected OnBeforeFilterPost(filters: Array<IGridJqFilter>) {

	}

	public SetLabel(columnName: string, text: string) {
		this._Grid.jqGrid("setLabel", columnName, text);
	}

	private _PostDataGet(postData: any) {

		const obj: any = new Object();

		let filterHolder = new Array<IGridJqFilter>();

		if (postData.filters) {
			const rules = JSON.parse(postData.filters).rules;
			filterHolder = rules;
		}

		const Sort: any = new Object();
		Sort.Column = this._Grid.jqGrid("getGridParam", "sortname");
		Sort.Order = this._Grid.jqGrid("getGridParam", "sortorder");



		obj.PostData = new Object();
		obj.PostData.Sort = Sort;
		obj.PostData.Page = this._currentPage;

		obj.PostData.AuxData = JSON.stringify(this.SetAuxData());
		obj.PostData.GridId = this._settings.GridId;

		obj.PostData.RowsToLoad = this._rowsToLoad;

		this.OnBeforeFilterPost(filterHolder);
		this._FiltersLocal.forEach((val) => {
			filterHolder.push({
				field: val.ColumnName,
				data: val.Value,
				op: "bw"
			});
		});

		obj.PostData.Filters = filterHolder;

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


	public ReloadRows(rowsIds: Array<any> | any): void {

		const array = [];

		if ($.isArray(rowsIds)) {
			array.push(...rowsIds);
		} else {
			array.push(rowsIds);
		}

		this._LoadRows(array, (data) => {

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

	private _LoadRows(rowIds: Array<any>, callback: (rows) => void) {

		this._rowsToLoad = [];

		if ($.isArray(rowIds)) {
			this._rowsToLoad.push(...rowIds);
		} else {
			this._rowsToLoad.push(rowIds );
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

	public ReloadGrid() {

		if (this._settings.Data) {
			this._Grid.jqGrid("setGridParam", { data: this._settings.Data });
		}

		this._Grid.trigger("reloadGrid");
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
		return this._Grid.find(`tr[role='row'][id='${rowId}']`);
	}

	private _PlaceUpdatedRow(rowId: number, row: any, callback = null, animate: boolean = true) {

		let tableRow = this.GetRow(rowId);

		if (tableRow.length === 0) {
			this._Grid.addRowData(row.id, row, "first");
			tableRow = this.GetRow(row.id);
		} else {
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
		this._Grid.jqGrid("setSelection", RowId, true);
	}

	DataLoaded(data?: any) {

	}

	
	public GridComplete() {

	}

	private _GridComplete() {
		this.GridComplete();
	}

	private _DataLoaded(data?: any) {

		this.RowsContainer = this._Grid.find("> tbody > tr:not(.jqgfirstrow)");

		if (this._isFirstLoad) {
			this.FirstLoaded();
			this._isFirstLoad = false;

			this.Selector = new GridSelector(this);

		}

		if (this._settings.AddButton && this._settings.AddButton.ShowButton) {

			const butCont = $(this.Container.find("table > thead th[role='columnheader']").first());

			butCont.html("A").addClass("button--add");

			butCont.off("click").on("click", (el) => {
				console.log(el);
				this._settings.AddButton.OnClick();
			});

		}

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

		const uiJqgrid = this._Grid.closest("div.ui-jqgrid");

		const pWidth = uiJqgrid.parent().outerWidth();

		const parentHeight = this.Container.parent().outerHeight();
		//const parentHeight = uiJqgrid.parent().outerHeight();

		const headerHeight = uiJqgrid.find("div.ui-jqgrid-hdiv").outerHeight();

		let pagerHeight = this.Container.find(`#gridpager`).outerHeight();
		pagerHeight = !pagerHeight ? 0 : pagerHeight;

		const height = parentHeight - headerHeight - pagerHeight - 2;
		const width = pWidth - 0;

		this._Grid.jqGrid("setGridWidth", width);
		this._Grid.jqGrid("setGridHeight", height);
	};


}
