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

interface IDpGridRow {
	html: JQuery;
	id:number|string;
}

interface IGridSettings {
	GridId: string;
	UrlData: string;
	UrlColumns: string;
	ShowPager?: boolean;
}