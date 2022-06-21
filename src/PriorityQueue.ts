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
class PriorityQueue<T> implements IPriorityQueue<T> {
    
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
    private _heap: Array<number> = [];

    /**
     * Number of child nodes
     * @defaultValue is `4` optimal for most scenarios
     */
    private readonly _k: number = 4;

    /**
     * Count elements of heap. Exectly that value has return by {@link count} accessor.
     * Please, use {@link count} instead of read value directly.
     * 
     * @remarks Note, it's not the same as lenght of heap. Our implementataion of priority queue
     * never pop or trim array-back of heap, except calling {@link shrink} and represent 
     * elements of memmory in non-obvious way. 
     */
    private _heap_size: number = 0;

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
    private _elems: Array<T> = [];

    /**
     * Length of {@link _elems}. May be deprecated furthure.
     */
    private _elems_size: number = 0;

    /**
     * Stack of indexes of dequeued elements, which not replaced.
     * 
     * @remarks This is solution to memory leak by repetative enqueue-dequeue long sequence. (Index+1) of
     * last added element is saved in {@link _exited_indexes_count}
     */
    private _exited_indexes: Array<number> = [];

    /**
     * Count or (Index+1) of last added element to Stack {@link _exited_indexes}
     */
    private _exited_indexes_count: number = 0;

    /** @inheritDoc IPriorityQueue.count */
    public get count(): number {
        return this._heap_size;
    }

    /** @inheritDoc IPriorityQueue.unorderedItems */
    public get unorderedItems(): Array<T> {
        let result: Array<T> = [];

        // helper set for constant time check index of already dequed elements
        // cause we never pop elements from array, we need slice from 0 to last
        let exited_set: Set<number> = new Set(this._exited_indexes.slice(0, this._exited_indexes_count));

        // add element to result iff it present in queue
        this._elems.forEach((v, i) => {
            if(!exited_set.has(i)) 
                result.push(v);
        });
        return result;
    }

    /**
     * Construcor of priority queue. It accpets as arguments array of elemnts with associated priority (default empty)
     * and number of child nodes (default 4)
     * 
     * @param range - sequence of elements
     * @param k - number of child nodes (recommended 4 or 8)
     */
    constructor(range: Array<IElementPriorityPair<T>> = [], k: number = 4) {
        this._k = k;
        this._heap_size = range.length;
        this._elems_size = this._heap_size;

        // assign even elemets of _heap priority
        // odd elements - link to value that stored in
        // _elems
        for(let i = 0; i < this._heap_size; i++) {
            this._heap[i*2] = range[i].priority;
            this._heap[i*2+1] = i;
            this._elems[i] = range[i].element;
        }

        // Heapify all internal nodes starting from last
        // non-leaf node all the way upto the root node
        // and calling restore down on each
        for(let i = Math.floor((this._heap_size - 1) / k); i >= 0; i--)
            this._restoreDown(i);
    }

    /**
     * Method for restore min-heap property for brench.
     * 
     * @param index - top-node (min-node) index
     */
    private _restoreDown(index: number) {
 
        // child array to store indexes of all
        // the children of given node
        let child: Array<number> = [];
        while (true) {

            // child[i]=-MAX_SAFE_INTEGER if the node is a leaf
            for(let i = 1; i <= this._k; i++)
                child[i] = ((this._k * index + i) < this._heap_size) ? (this._k * index + i) : Number.MAX_SAFE_INTEGER;

            // min_child stores the minimum child and
            // min_child_index holds its index
            let min_child: number = Number.MAX_SAFE_INTEGER;
            let min_child_index: number = 0;

            // loop through k children to find the minimum of all
            // the children of a given node
            for(let i = 1; i <= this._k; i++) {
                if (child[i] != Number.MAX_SAFE_INTEGER &&
                    this._heap[child[i]*2] < min_child)
                {
                    min_child_index = child[i];
                    min_child = this._heap[child[i]*2];
                }
            }

            // leaf node
            if (min_child == Number.MAX_SAFE_INTEGER)
                break;

            // swap only if the key of min_child_index
            // is greater than the key of node
            // remember about even (priority) / odd (link to value) meaning
            if (this._heap[index*2] > this._heap[min_child_index*2])
            {
                [this._heap[index*2], this._heap[min_child_index*2]] = [this._heap[min_child_index*2], this._heap[index*2]];
                [this._heap[index*2+1], this._heap[min_child_index*2+1]] = [this._heap[min_child_index*2+1], this._heap[index*2+1]];
            }
            index = min_child_index;
        }
    }

    /**
     * Restores a given node up in the heap. 
     * 
     * @param index - index of element. 
     */
    private _restoreUp(index: number) {

        // parent stores the index of the parent variable
        // of the node
        let parent: number = Math.floor((index - 1) / this._k);

        // Loop should only run till root node in case the
        // element inserted is the minimum restore up will
        // send it to the root node
        while (parent >= 0) {

            // remember about even (priority) / odd (link to value) meaning
            if (this._heap[index*2] < this._heap[parent*2]) {
                [this._heap[index*2], this._heap[parent*2]] = [this._heap[parent*2], this._heap[index*2]];
                [this._heap[index*2+1], this._heap[parent*2+1]] = [this._heap[parent*2+1], this._heap[index*2+1]];
                index = parent;
                parent = Math.floor((index - 1) / this._k);
            }

            // node has been restored at the correct position
            else
                break;
        }
    }

    /**
     * Helper method that add T element in queue.
     * 
     * @remarks Under the hood method work with {@link _exited_indexes} for replace
     * dequeued elemets in {@link _elems}
     * 
     * @param elem - T element which add to queue
     * @returns index of this element in {@link _elems}
     */
    private _addElem(elem: T): number {
        let index: number;

        // if we have unused index into allocated range
        // replace value of it elemnt and then return this index
        // else expand _elem array to carry new value
        if(this._exited_indexes_count > 0) {
            this._exited_indexes_count--;
            index = this._exited_indexes[this._exited_indexes_count];
        } else {
            index = this._elems_size;
            this._elems_size++;
        }
        this._elems[index] = elem;
        return index;
    }

    /** @inheritDoc IPriorityQueue.clear */
    public clear(): void {
        this._heap = [];
        this._heap_size = 0;
        this._elems = [];
        this._elems_size = 0;
        this._exited_indexes = [];
        this._exited_indexes_count = 0;
    }

    /**
     * Free currently unused memmory.
     * 
     * @remarks Under the hood proceed copying arrays, so its time consupmtion.
     */
    public shrink(): void {
        let heap: Array<number> = [];
        let elems: Array<T> = [];

        // copy _heap and _elems with reordering last one
        for(let i = 0; i < this._heap_size; i++) {
            heap[i*2] = this._heap[i*2];
            elems[i] = this._elems[this._heap[i*2+1]];
            heap[i*2+1] = i;
        }
        this._heap = heap;
        this._elems = elems;
        this._elems_size = this._heap_size;
        this._exited_indexes = [];
        this._exited_indexes_count = 0;
    }

    /** @inheritDoc IPriorityQueue.enqueue */
    public enqueue(elem: T, priority: number): void {
        let index: number;
        index = this._addElem(elem);
        this._heap[this._heap_size*2] = priority;
        this._heap[this._heap_size*2+1] = index;
        this._heap_size++;
        this._restoreUp(this._heap_size - 1);
    }

    /** 
     * @inheritDoc IPriorityQueue.dequeue
     * 
     * @throws {@link InvalidOperationException}
     * This exception is thrown if queue out of elements. 
     */
    public dequeue(): T {
        if(this._heap_size == 0)
            throw new InvalidOperationException('The queue is empty.');
        let max: number = this._heap[1];
        this._heap_size--;

        // mark index of dequed element for further reuse
        this._exited_indexes[this._exited_indexes_count] = max;
        this._exited_indexes_count++;
        this._heap[0] = this._heap[this._heap_size*2];
        this._heap[1] = this._heap[this._heap_size*2+1];
        this._restoreDown(0);
        let result: T = this._elems[max];
        return result;
    }

    /** @inheritDoc IPriorityQueue.peek */
    public peek(): T {
        if(this._heap_size == 0)
            throw new InvalidOperationException('The queue is empty.');
        return this._elems[this._heap[1]];
    }

    /** 
     * @inheritDoc IPriorityQueue.enqueueDequeue
     * 
     * @throws {@link InvalidOperationException}
     * This exception is thrown if queue out of elements.
     */
    public enqueueDequeue(elem: T, priority: number): T {
        let result: T;
        if(priority <= this._heap[0]) {
            result = elem;
        } else {
            result = this._elems[this._heap[1]];
            this._heap[0] = priority;
            this._elems[this._heap[1]] = elem;
            this._restoreDown(0);
        }
        return result;
    }

    /** 
     * @inheritDoc IPriorityQueue.dequeueEnqueue
     * 
     * @throws {@link InvalidOperationException}
     * This exception is thrown if queue out of elements.
     */
    public dequeueEnqueue(elem: T, priority: number): T {
        if(this._heap_size == 0)
            throw new InvalidOperationException('The queue is empty.');
        let result: T;
        result = this._elems[this._heap[1]];
        this._heap[0] = priority;
        this._elems[this._heap[1]] = elem;
        this._restoreDown(0);
        return result;
    }

    /** @inheritDoc IPriorityQueue.enqueueRange */
    public enqueueRange(range: Array<IElementPriorityPair<T>>): void {
        if(range.length < this._heap_size / Math.log2(this._heap_size)) {
            range.forEach(pair => {
                this.enqueue(pair.element, pair.priority);
            });
        } else {
            // TODO: optimize here
            let index: number;
            for(let i = 0; i < range.length; i++) {
                index = this._addElem(range[i].element);
                this._heap[(this._heap_size+i)*2] = range[i].priority;
                this._heap[(this._heap_size+i)*2+1] = index;
            }
            for(let i = Math.floor((this._heap_size - 1) / this._k); i >= 0; i--)
                this._restoreDown(i);
        }
    } 
}

export { PriorityQueue, IPriorityQueue, IElementPriorityPair, InvalidOperationException }