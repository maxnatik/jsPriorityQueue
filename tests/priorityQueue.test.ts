import { Console, count } from 'console';
//import { IElementPriorityPair } from '../src/IElementPriorityPair';
import { PriorityQueue, InvalidOperationException, IElementPriorityPair } from '../src/PriorityQueue';
//import { InvalidOperationException } from '../src/InvalidOperationException';

class Pair implements IElementPriorityPair<number> {
    element: number;
    priority: number;

    constructor(elem: number, priority: number) {
        this.element = elem;
        this.priority = priority;
    }
}

const cycles: number = 10000;

function arrayEquals(a: Array<any>, b: Array<any>) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function prepareQueue(): PriorityQueue<number> {
    let queue = new PriorityQueue<number>();
    let r: number;
    for(let i = 0; i < cycles; i++) {
        r = Math.random();
        queue.enqueue(r, r);
    }
    for(let i = 0; i < cycles / 10; i++) {
        queue.dequeue();
    }
    return queue;
}

describe('testing queue basic functionality', () => {
    test('sorting prepared sequence', () => {
        let queue = new PriorityQueue<string>();
        let prepared_values: Array<string> = ['a', 'b', 'c', 'd', 'e', 'f'];
        let prepared_priority: Array<number> = [3, -1, 7, 2, 4, 6];
        for(let i = 0; i < prepared_values.length; i++) {
            queue.enqueue(prepared_values[i], prepared_priority[i] ?? 1);
        }
        let res: Array<string> = [];
        for(let i = 0; i < 6; i++) {
          res.push(queue.dequeue());
        }
        let answ: Array<string> = ['b', 'd', 'a', 'e', 'f', 'c'];
    });

    test('sorting random sequence', () => {
        let queue = new PriorityQueue<number>();
        let ar: Array<number> = [];
        for(let i = 0; i < cycles; i++) {
          ar[i] = Math.random();
          queue.enqueue(ar[i], ar[i]);
        }
        let res: Array<number> = [];
        for(let i = 0; i < cycles; i++) {
          res.push(queue.dequeue());
        }
        ar.sort(function(a, b){return a-b});
        expect(arrayEquals(ar, res)).toBe(true);
    });

    test('construct queue from array', () => {
        let ar: Array<number> = [];
        let preq: Array<Pair> = [];
        for(let i = 0; i < cycles; i++) {
            ar[i] = Math.random();
            preq.push(new Pair(ar[i], ar[i]))
        }
        let queue = new PriorityQueue<number>(preq);
        let res: Array<number> = [];
        for(let i = 0; i < cycles; i++) {
          res.push(queue.dequeue());
        }
        ar.sort(function(a, b){return a-b});
        expect(arrayEquals(ar, res)).toBe(true);
    })

    test('count items', () => {
        let queue = prepareQueue();
        let answer = Math.floor(0.9 * cycles);
        expect(queue.count).toEqual(answer);
    });

    test('unordered items (heap) must be return properly', () => {
        let queue = new PriorityQueue<number>();
        let ar: Array<number> = [];
        for(let i = 0; i < cycles; i++) {
          ar[i] = Math.random();
          queue.enqueue(ar[i], ar[i]);
        }
        ar.sort(function(a, b){return a-b});
        ar = ar.slice(1000);
        for(let i = 0; i < 1000; i++) {
            queue.dequeue();
        }
        expect(ar).toEqual(queue.unorderedItems.sort(function(a, b){return a-b}));
    });
});

describe('testing enqueue / dequeue / peek functionality', () => {
    let queue = prepareQueue();

    test('peek and dequeue return same element', () => {
        let peeked = queue.peek();
        let dequeued = queue.dequeue();
        expect(peeked).toEqual(dequeued);
    });

    test('element with great priority will be added not on top of heap', () => {
        let before = queue.peek();
        let priority = 5;
        queue.enqueue(priority, priority);
        let after = queue.peek();
        expect(before).toEqual(after);
        expect(queue.unorderedItems.find((v) => v == priority)).toEqual(priority);
    });

    test('element with least priority will be added on top of heap', () => {
        let priority = -1;
        queue.enqueue(priority, priority);
        let after = queue.peek();
        expect(after).toEqual(priority);
    });

    test('Peek with empty queue must throw exepction', () => {
        let queue = new PriorityQueue<number>();
        expect(() => queue.peek()).toThrow(InvalidOperationException);
    });

    test('Dequeue with empty queue must throw exepction', () => {
        let queue = new PriorityQueue<number>();
        expect(() => queue.dequeue()).toThrow(InvalidOperationException);
    });
});

describe('testing clear functionality', () => {
    test('testing clear functionality', () => {
        let queue = prepareQueue();
        let peek = queue.peek();
        expect(peek).not.toBe(undefined);
        expect(queue.unorderedItems).not.toEqual([]);
        queue.clear();
        expect(() => queue.peek()).toThrow(InvalidOperationException);
        expect(queue.unorderedItems).toEqual([]);
        for(let i = 10; i > 0; i--) {
            queue.enqueue(i, i);
        }
        peek = queue.peek();
        expect(peek).toBe(1);
    });
});

describe('queue expanded functionality', () => {
    let queue = prepareQueue();

    test('EnqueueDequeue with greatest priority element', () => {
        let peek = queue.peek();
        let priority = 5;
        let dequeued = queue.enqueueDequeue(priority, priority);
        expect(peek).toEqual(dequeued);
        expect(queue.unorderedItems.find((v) => v == priority)).toEqual(priority);
    });

    test('EnqueueDequeue with least priority element', () => {
        let peek = queue.peek();
        let priority = -1;
        let dequeued = queue.enqueueDequeue(priority, priority);
        expect(peek).not.toEqual(dequeued);
        expect(dequeued).toEqual(priority);
        expect(peek).toEqual(queue.peek());
    });

    test('DequeueEnqueue with greatest priority element', () => {
        let peek = queue.peek();
        let priority = 5;
        let dequeued = queue.dequeueEnqueue(priority, priority);
        expect(peek).toEqual(dequeued);
        expect(queue.unorderedItems.find((v) => v == priority)).toEqual(priority);
        peek = queue.peek();
        expect(peek).not.toEqual(priority);
    });

    test('DequeueEnqueue with least priority element', () => {
        let peek = queue.peek();
        let priority = -1;
        let dequeued = queue.dequeueEnqueue(priority, priority);
        expect(peek).toEqual(dequeued);
        expect(dequeued).not.toEqual(priority);
        peek = queue.peek();
        expect(peek).toEqual(priority);
    });

    test('DequeueEnqueue with empty queue must throw exepction', () => {
        let queue = new PriorityQueue<number>();
        expect(() => queue.dequeueEnqueue(1, 1)).toThrow(InvalidOperationException);
    });

    test('EnqueueRange elements', () => {
        let curr = queue.unorderedItems;
        let ar: Array<number> = [];
        for(let i = 0; i < cycles; i++) {
          ar[i] = Math.random();
          queue.enqueue(ar[i], ar[i]);
        }
        ar = ar.concat(curr);
        let res: Array<number> = [];
        expect(queue.count).toEqual(19000);
        while(queue.count != 0) {
            res.push(queue.dequeue());     
        }
        ar.sort(function(a, b){return a-b});
        expect(ar.length).toEqual(res.length);
        expect(arrayEquals(ar, res)).toBe(true);
    });

    test('shrink functionality', () => {
        let queue = prepareQueue();
        let ar = queue.unorderedItems.sort(function(a, b){return a-b});
        queue.shrink();
        queue.enqueue(-1, -1);
        expect(queue.dequeue()).toEqual(-1);
        let res: Array<number> = [];
        while(queue.count != 0) {
            res.push(queue.dequeue());     
        }
        expect(arrayEquals(ar, res)).toEqual(true);
    });
});