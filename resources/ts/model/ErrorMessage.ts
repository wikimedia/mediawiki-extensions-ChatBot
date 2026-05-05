import Message from "./Message";

export default class ErrorMessage extends Message {

	public constructor( message: string | null, timestamp: string ) {
		super( message, timestamp );

		this.addClass( 'error' );
	}
}
