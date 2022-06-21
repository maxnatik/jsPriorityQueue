/**
 * Interface that carry value-priority pair
 * 
 * @typeParam T - Specifies the type of elements in the queue. 
 */
export interface IElementPriorityPair<T> {
    element: T;
    priority: number;
}