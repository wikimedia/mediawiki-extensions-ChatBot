import Source, { SourceData } from "../model/Source";

export interface ReferenceDocumentMeta {
	extension: string;
	prefixed_title: string;
	sections?: string[];
	file_name?: string;
	basename: string;
	namespace: number;
	namespace_text: string;
	uri: string;
}

export default class SourceFactory {

	public static createFromJson( data: SourceData, docRefId: number = 0 ): Source {
		// docRefId will get auto populated with array index of the sources array, due to
		// how its called. So, just offset the index by 1 to start at 1 instead of 0.
		return new Source( data, docRefId + 1 );
	}
}
