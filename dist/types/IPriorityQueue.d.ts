import { IElementPriorityPair } from "./IElementPriorityPair";
/**
 * C#-like Priority Queue interface
 * Class that implemets those interface must represent a collection of items
 * that have a value and a real-valued priority. On dequeue, the item with the extreme (minimal) priority value is removed.
 *
 * @typeParam T - Specifies the type of elements in the queue.
 */
export interface IPriorityQueue<T> {
    /**
     * Gets the number of elements contained in the queue
     */
    get count(): number;
    /**
     * Gets a collection that enumerates the elements of the queue in an unordered manner.
     */
    get unorderedItems(): Array<T>;
    /**
     * Removes all items from the queue
     */
    clear(): void;
    /**
     * Adds the specified element with associated priority to the queue
     *
     * @param elem - specified element
     * @param priority - his priority
     */
    enqueue(elem: T, priority: number): void;
    /**
     * Removes and returns the extreme (minimal) element from the queue
     *
     * @returns The extreme (minimal) element
     */
    dequeue(): T;
    /**
     * Returns the extreme (minimal) element from the queue without removing it.
     *
     * @returns The extreme (minimal) element
     */
    peek(): T;
    /**
     * Adds the specified element with associated priority to the queue,
     * and immediately removes the extreme (minimal) element, returning the result.
     *
     * @param elem - specified element
     * @param priority - his priority
     *
     * @returns The extreme (minimal) element
     */
    enqueueDequeue(elem: T, priority: number): T;
    /**
     * Removes the extreme (minimal) element and immediately adds the specified element
     * with associated priority to the queue, returning the result.
     *
     * @param elem - specified element
     * @param priority - his priority
     *
     * @returns The extreme (minimal) element
     */
    dequeueEnqueue(elem: T, priority: number): T;
    /**
     * Enqueues a sequence of elements pairs to the queue, all associated with the specified priority.
     *
     * @param range - sequence of elements
     */
    enqueueRange(range: Array<IElementPriorityPair<T>>): void;
}
