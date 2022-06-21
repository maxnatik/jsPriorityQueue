import { IElementPriorityPair } from "./IElementPriorityPair";
import { InvalidOperationException } from "./InvalidOperationException";
import { IPriorityQueue } from "./IPriorityQueue";
/**
 * Fast implementation of priority queue / min-heap with C#-like interface.
 * Represents a collection of items that have a value and a priority.
 * On dequeue, the item with the lowest priority value is removed.
 *
 * @typeParam T - Specifies the type of elements in the queue.
 *
 * @remarks Implements based on an array-backed, k-ary min-heap after studying
 * {@link https://arxiv.org/abs/1403.0252} and {@link https://www.geeksforgeeks.org/k-ary-heap/}
 * and some investigations of optimize for js. Primary goal was create ultra-fast js-native
 * queue for general purpose shortest path problem algorithm. Pairing heap may be still
 * faster than k-ary heap, further investigation will be.
 *
 * About performance: queue faster than other implementations e.g. {@link https://github.com/ignlg/heap-js}
 * from about 1.5x on low-depth (< 1000 elements) > 10:1 enqueue : dequeue mix workload
 * to about 8x-10x on 10^7 depth queue with 2:1 1:1 mix workload. Real-world boost is excepted 3x performance
 * on short-live queue. Optimal value of k in most scearios is 4. But feel free to increase to 8 or even 16.
 *
 * Speed up cost some limitations and expenses. Therefore this queue consumes additional memory, doesnt
 * free it, support only real-valued priority and work as min-heap. So, some tips:
 *
 * - After long sequence of dequeue operations good think to use {@link shrink} funcrion to free space if
 * you mind continue work with queue.
 * - If you need reverse ordering, you may multiply priority by -1.
 */
declare class PriorityQueue<T> implements IPriorityQueue<T> {
    /**
     * Array of pairs of numbers: priority and link to elemnt in {@link _elems}. Don't use direclty.
     * If you need access to enumerable elements in queue, please, use {@link unorderedItems} instead.
     *
     * @remarks Even element in _heap represent a priority of associated element, link to which contained
     * into odd element. The {@link _heap_size} controll numbers of such pair. So, in a moment heap
     * contained on array slice [0.._heap_size*2-1], where _heap[i*2] is piroirty of elemnt _heap[i*2+1].
     * - Parent of the node at index i (except root node) is located at index (i-1)*2/k
     * - Children of the node at index i are at indices (k*i)*2+1 , (k*i)*2+2 …. (k*i)*2+k
     * - he last non-leaf node of a heap of size n is located at index (n-2)*2/k
     */
    private _heap;
    /**
     * Number of child nodes
     * @defaultValue is `4` optimal for most scenarios
     */
    private readonly _k;
    /**
     * Count elements of heap. Exectly that value has return by {@link count} accessor.
     * Please, use {@link count} instead of read value directly.
     *
     * @remarks Note, it's not the same as lenght of heap. Our implementataion of priority queue
     * never pop or trim array-back of heap, except calling {@link shrink} and represent
     * elements of memmory in non-obvious way.
     */
    private _heap_size;
    /**
     * Array containing T elements.
     * If you need access to elements in queue, please, use {@link unorderedItems} instead.
     *
     * @remarks Don't ever interact with it directly. If do, note, {@link _elems_size} represent
     * size of array. It exactly the same. But not netiher actually count of elements nor hint
     * about what index could be used. {@link _exited_indexes} mark indexes of dequeued elemnts.
     * So {@link _elems} without {@link _exited_indexes} is exactly returned value by {@link unorderedItems}.
     * These elements linked by indexes from odd indexes of {@link _heap}
     */
    private _elems;
    /**
     * Length of {@link _elems}. May be deprecated furthure.
     */
    private _elems_size;
    /**
     * Stack of indexes of dequeued elements, which not replaced.
     *
     * @remarks This is solution to memory leak by repetative enqueue-dequeue long sequence. (Index+1) of
     * last added element is saved in {@link _exited_indexes_count}
     */
    private _exited_indexes;
    /**
     * Count or (Index+1) of last added element to Stack {@link _exited_indexes}
     */
    private _exited_indexes_count;
    /** @inheritDoc IPriorityQueue.count */
    get count(): number;
    /** @inheritDoc IPriorityQueue.unorderedItems */
    get unorderedItems(): Array<T>;
    /**
     * Construcor of priority queue. It accpets as arguments array of elemnts with associated priority (default empty)
     * and number of child nodes (default 4)
     *
     * @param range - sequence of elements
     * @param k - number of child nodes (recommended 4 or 8)
     */
    constructor(range?: Array<IElementPriorityPair<T>>, k?: number);
    /**
     * Method for restore min-heap property for brench.
     *
     * @param index - top-node (min-node) index
     */
    private _restoreDown;
    /**
     * Restores a given node up in the heap.
     *
     * @param index - index of element.
     */
    private _restoreUp;
    /**
     * Helper method that add T element in queue.
     *
     * @remarks Under the hood method work with {@link _exited_indexes} for replace
     * dequeued elemets in {@link _elems}
     *
     * @param elem - T element which add to queue
     * @returns index of this element in {@link _elems}
     */
    private _addElem;
    /** @inheritDoc IPriorityQueue.clear */
    clear(): void;
    /**
     * Free currently unused memmory.
     *
     * @remarks Under the hood proceed copying arrays, so its time consupmtion.
     */
    shrink(): void;
    /** @inheritDoc IPriorityQueue.enqueue */
    enqueue(elem: T, priority: number): void;
    /**
     * @inheritDoc IPriorityQueue.dequeue
     *
     * @throws {@link InvalidOperationException}
     * This exception is thrown if queue out of elements.
     */
    dequeue(): T;
    /** @inheritDoc IPriorityQueue.peek */
    peek(): T;
    /**
     * @inheritDoc IPriorityQueue.enqueueDequeue
     *
     * @throws {@link InvalidOperationException}
     * This exception is thrown if queue out of elements.
     */
    enqueueDequeue(elem: T, priority: number): T;
    /**
     * @inheritDoc IPriorityQueue.dequeueEnqueue
     *
     * @throws {@link InvalidOperationException}
     * This exception is thrown if queue out of elements.
     */
    dequeueEnqueue(elem: T, priority: number): T;
    /** @inheritDoc IPriorityQueue.enqueueRange */
    enqueueRange(range: Array<IElementPriorityPair<T>>): void;
}
export { PriorityQueue, IPriorityQueue, IElementPriorityPair, InvalidOperationException };
