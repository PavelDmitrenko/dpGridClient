/// <reference path="../dpgrid.ts" />



class GridSelector {

	private _shift: boolean;
	private _ctrl: boolean;

	private readonly _gridInstance: GridForm;

	constructor(gridInstance: GridForm) {
		this._gridInstance = gridInstance;
		this._shift = false;
		this._ctrl = false;

		$((document) as any).on("keydown", e => {
			
			if (e.shiftKey) {
				this._shift = true;
				this._ctrl = false;
			}
			else {
				this._shift = false;
			};

			if (e.ctrlKey) {
				this._shift = false;
				this._ctrl = true;
			}
			else {
				this._ctrl = false;
			};
		})
			.on("keyup", e => {
				this._shift = false;
				this._ctrl = false;
			});
	}

	public SelectAll() {
		this._GetRows().addClass("gridrow__selected");
	}


	public SelectRows(rowIds: Array<number>) {
		const rows = this._GetRows();

		const stringArray = rowIds.map( (x) => {
			return x.toString();
		});

		rows.each((ind, el) => {

			const $el = $(el);
			const id = $el.attr("id");

			if (stringArray.indexOf(id) !== -1) {
				$(el).addClass("gridrow__selected");
			}
		});
	}


	public GetSelected(): Array<number> {

		var arr = new Array();

		const sel = this._gridInstance.Container.find(".ui-jqgrid-bdiv tbody > tr.gridrow__selected:not(.jqgroup):not(.jqgfirstrow)");

		sel.each((ind, el) => {
			const idz = $((el) as any).attr("id");
			const intVal = parseInt(idz);
			arr.push(intVal);
		});

		return arr;
	}

	private _GetRows() {
		return this._gridInstance.Container.find(".ui-jqgrid-bdiv tbody > tr:not(.jqgfirstrow):not(.jqgroup)");
	}

	public RightClickInvoke(rowid: number) {

		const row = this._gridInstance.Container.find(`#${rowid}`);
		const curSel = row.hasClass("gridrow__selected");

		if (!curSel) {
			const anythingSelected = this._SelectedCount();

			if (anythingSelected === 0) {
				row.addClass("gridrow__selected");
			}
			else {
				this._ClearSelection();
				row.addClass("gridrow__selected");
			};
		}

	}

	private _SelectedCount(): number {
		return this._gridInstance.Container.find("tbody > tr.gridrow__selected").length;
	}

	private _ClearSelection() {
		this._gridInstance.Container.find("tbody > tr.gridrow__selected").removeClass("gridrow__selected");
	}

	public GridClick(rowid: number) {

		const curRow = this._gridInstance.Container.find(`#${rowid}`);

		let prevSel = 0;

		if (!this._shift && !this._ctrl) {
			prevSel = rowid;
			this._ClearSelection();
			curRow.addClass("gridrow__selected");
		};


		if (this._ctrl) {
			prevSel = rowid;
			if (curRow.hasClass("gridrow__selected")) {
				curRow.removeClass("gridrow__selected");
			}
			else {
				curRow.addClass("gridrow__selected");
			};
		};

		if (this._shift) {

			const prevSelEl = this._gridInstance.RowsContainer.find(`#${prevSel}`);
			const newSelEl = curRow;

			const prevselIndex = prevSelEl.index();
			const newselIndex = newSelEl.index();


			if (prevselIndex < newselIndex) {
				prevSelEl.nextUntil(curRow).addBack().addClass("gridrow__selected");
				newSelEl.addClass("gridrow__selected");
			};

			if (prevselIndex > newselIndex) {
				newSelEl.nextUntil(prevSelEl).addBack().addClass("gridrow__selected");
			};

		};

		this._RefreshCounter();

	}


	public AttachLasso() {

		this._gridInstance.Container.selectable({
			filter: "tr",
			delay: 30,
			selecting: (event, ui) => {
				$(ui.selecting).addClass("gridrow__selected");
				this._RefreshCounter();
			},

			unselecting: (event, ui) => {
				$(ui.unselecting).removeClass("gridrow__selected");
				this._RefreshCounter();
			},

			selected: (event, ui) => {

			}
		});

	}

	private _RefreshCounter() {
		this._gridInstance.Footer.SetSelected(this._SelectedCount());
	}

}

