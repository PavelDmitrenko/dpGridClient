/// <reference path="../../typings/jquery/jquery.d.ts" />

class Footer {

	private readonly _gridInstance;

	TotalToShow: number;
	 
	private readonly _container: JQuery;
	private readonly _ctrlSelected: JQuery;
	private readonly _ctrlRecsCount: JQuery;
	private readonly _ctrlArrowNext: JQuery;
	private readonly _ctrlArrowPrev: JQuery;
	private readonly _ctrlPageCount: JQuery;

	private _timeoutId: number;

	constructor(gridInstance: GridForm) {

		this._container = $("<div/>").attr("id", `gridpager`);

		const pager = $("<div id='cont'>" +
			"<span id='selected'></span>" +
			"<span id='pager'>" +
			"<span id='prev'>Q</span>" +
			"<span id='nums'></span>" +
			"<span id='next'>R</span>" +
			"</span>" +
			"<span id='recCount'></span>" +
			"</div>");

		this._container.append(pager);
		gridInstance.Container.append(this._container);

		this._gridInstance = gridInstance;

		this._ctrlSelected = this._container.find("#selected");
		this._ctrlArrowNext = this._container.find("#next");
		this._ctrlArrowPrev = this._container.find("#prev");
		this._ctrlRecsCount = this._container.find("#recCount");
		this._ctrlPageCount = this._container.find("#nums");

		this._container.find("#cont").show();

		this._ctrlArrowNext.on("click", () => {
			this._NextPage();
		});

		this._ctrlArrowPrev.on("click", () => {
			this._PrevPage();
		});

		$(document).bind("keydown", "ctrl+right", () => {
			this._NextPage();
		});

		$(document).bind("keydown", "ctrl+left", () => {
			this._PrevPage();
		});

	}

	public SetSelected(c: number) {
		if (this._timeoutId !== null) {
			clearTimeout(this._timeoutId);
		};

		this._timeoutId = setTimeout(() => {
			this._ctrlSelected.html(c.toString());
		}, 500);
	}

	Recalc(obj: any) {

		const curPage = parseInt(obj.page);

		const totalPages = parseInt(obj.total);
		const totalRecords = parseInt(obj.records);
		const curRecord = totalRecords;

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

	}

	private _NextPage() {

		if (this._ctrlArrowNext.hasClass("disabled"))
			return;

		this._gridInstance.NextPage();

	}

	private _PrevPage() {

		if (this._ctrlArrowPrev.hasClass("disabled"))
			return;

		this._gridInstance.PrevPage();

	}

}
