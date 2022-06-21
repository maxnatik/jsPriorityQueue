/**
 * Special class exception primarly for throwing in situations when
 * dequeue / peek method calls on empty queue.
 */
export class InvalidOperationException implements Error {
    
    /**
     * Name of exception
     * 
     * @defaultValue `InvalidOperationExcenption`
     */
    name: string = 'InvalidOperationExcenption';

    /**
     * Detailed information about exception.
     */
    message: string;

    /**
     * Default constructor 
     * 
     * @param msg could provide some details about why exception happend
     */
    constructor(msg: string) {
        this.message = msg;
    }
}