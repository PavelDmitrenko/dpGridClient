interface IBaseGridForm {
	DataLoaded(data?: any): void;
	ReloadRows(rows: Array<number>): void;
	RemoveRow(rowId: number): void;
	FocusRow(rowId: number): void;
	ReloadGrid(): void;
	OnInitGrid(): void;
	GridComplete():void;
	SetLabel(columnName: string, text: string): void;
	readonly GridElement: JQuery;
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

interface IDpGridFilter {
	ColumnName: string;
	Value: any;
}

interface IDpGridRow {
	html: JQuery;
	id: number | string;
}

interface IGridSettings {
	GridId: string;
	UrlData?: string;
	UrlColumns?: string;
	Columns?: Array<JQueryJqGridColumn>;
	Data?: Array<any>;
	ShowPager?: boolean;
	ShowFilters?: boolean;
	AddButton?: IGridAddButtonSettings;
	RowAttr?:() => void;
	ColumnsStatesSettings?: IDpGridColumnsStatesSettings;
}

interface IDpGridColumnsStatesSettings {
	urlSave:string;
	urlLoad:string;
}


interface IGridAddButtonSettings {
	ShowButton?: boolean;
	OnClick?: () => void;
}