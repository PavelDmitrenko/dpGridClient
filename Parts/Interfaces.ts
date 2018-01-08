interface IBaseGridForm {
	PlaceGrid(): void;
	DataLoaded(data?: any): void;
	ReloadRows(rows: Array<number>): void;
	RemoveRow(rowId: number): void;
	FocusRow(rowId: number): void;
	ReloadGrid(): void;
	OnInitGrid():void;
}

interface IContextMenu {
	items: Array<any>;
	selector: string;
	onSelect: (action, id) => void;
}

interface IGridJqFilter {
	data: string;
	field: string;
	op: string;
}

interface IGridFilter {
	ColumnName: string;
	Value: any;
}

interface IDpGridRow {
	html: JQuery;
	id:number|string;
}

interface IGridSettings {
	GridId: string;
	UrlData: string;
	UrlColumns: string;
	ShowPager?: boolean;
	ShowFilters?: boolean;
	AddButton?:IGridAddButtonSettings;
}

interface IGridAddButtonSettings {
	ShowButton?: boolean;
	OnClick?:()=>void;
}