/// <reference path="../jquery.jqgrid/typings/jqgrid/jqgrid.d.ts" />

class dpGridColumnsStates {

	public ColumnSortName:string;
	public ColumnSortOrder:"asc" | "desc";

	public Data : GridSettingsModel;
	private readonly _settings : IDpGridColumnsStatesSettings;
	private readonly _gridId : string;

	constructor(gridId:string, settings:IDpGridColumnsStatesSettings)
	{
		this._gridId = gridId;
		this._settings = settings;
	}

	public Load() {
		const deferred = $.Deferred();

		if (!this._settings)
			return deferred.resolve();

		const data2send = JSON.stringify({ gridname: this._gridId });

		$.ajax({
			url: this._settings.urlLoad,
			contentType: "application/json",
			data:data2send,
			type: "POST",
			success: (data:GridSettingsModel) => {
				this.Data = data;

				if (this.Data.ColumnSortName) {
					this.ColumnSortName = this.Data.ColumnSortName.split(" ")[0];
					this.ColumnSortOrder = this.Data.ColumnSortName.split(" ")[1] as any;
				} else 
				{
					this.ColumnSortName = "";
					this.ColumnSortOrder = "asc";
				}

				deferred.resolve();
			}
		});

		return deferred;
	}

	public Save( gridParams:any) {

		if (!this._settings)
			return;

		const getColumnNamesFromColModel = () => {
			
			return $.map(gridParams.colModel, function (cm, iCol) {
				// we remove "rn", "cb", "subgrid" columns to hold the column information 
				// independent from other jqGrid parameters
				return $.inArray(cm.name, ["rn", "cb", "subgrid"]) >= 0 ? null : cm.name;
			});
		};
	
		let colItem: JQueryJqGridColumn;

		const columnsState = {
			search: gridParams.search,
			page: gridParams.page,
			rowNum: gridParams.rowNum,
			sortname: gridParams.sortname,
			sortorder: gridParams.sortorder,
			colOrder: getColumnNamesFromColModel.call(this),
			colStates: {}
		};

		const columnStates = new GridSettingsModel();
		columnStates.ColumnSortName = columnsState.sortname;
		columnStates.ColumnSortOrder = columnsState.sortorder;
		columnStates.Columns = new Array<GridSettingsColumnModel>();
		
		for (let i = 0; i < gridParams.colModel.length; i++) {
			colItem = gridParams.colModel[i];
			
			const columnOption = new GridSettingsColumnModel();
			columnOption.Name = colItem.name;
			columnOption.Width = colItem.width;
			columnOption.Visible = !colItem.hidden;
			columnStates.Columns.push(columnOption);
		}

		columnStates.GridName = this._gridId;
		const obj = { settings: columnStates };
		const data2send = JSON.stringify(obj);

		$.ajax({
			url: this._settings.urlSave,
			contentType: "application/json",
			data:data2send,
			type: "POST",
			success: (data) => {
				
			}
		});
	}
}