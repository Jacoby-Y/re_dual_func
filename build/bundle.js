
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    //#region | Setup

    const w = writable;

    const to_store = {};
    //#endregion

    // export const name = writable(get_or("name", "joey"));
    // name.subscribe((v)=> to_store.name = v);

    //#region | Mana Stuffs
    let mana = w(0); //w(1e+8); //-! DEBUG VALUE | 
    let mana_click = w({
    	cost: 25,
    	val: 1,
    });
    let mana_idle = w({
    	cost: 100,
    	val: 0,
    });
    let mana_bonus = w({
    	cost: 1000,
    	val: 0,
    });
    let mana_combo = w({
    	unlock: 7500,
    	unlocked: false,
    	cost: 1000,
    	val: 0,
    });
    let mana_prestige = w({
    	cost: 1e+6,
    	times: 0,
    	seconds: 0,
    	fastest: Infinity,
    });
    //#endregion

    //#region | Power Stuffs
    let power_progress = w({
    	max: 1e+5,
    	val: 0,
    });
    let power = w(0);
    let ichor = w(0);
    let unlocked_ichor = w(false);
    let power_cost = w(1e+3);
    let power_discount = w({
    	amount: 0,
    	cost: 2,
    });
    let cores = w({
    	planet: 0, // Worth 1 ichor
    	realm: 0, // Worth ?
    	universe: 0, // Worth ?
    	
    });
    let mana_ichor_bonus = w({
    	amount: 0,
    	cost: 1,
    });
    //#endregion

    const max_entry = w(0);

    //#region | Post-Setup
    window.onbeforeunload = ()=>{
    	Object.keys(to_store).forEach( key => {
    		localStorage[key] = JSON.stringify(to_store[key]);
    		console.log(localStorage[key]);
    	});
    };
    //#endregion

    /** @param {Number} num */
    const exp = (pow=1)=> (10 ** pow);
    const round = (num, pow=1)=> Math.round(num * exp(pow))/exp(pow);
    const floor = (num, pow=1)=> Math.floor(num * exp(pow))/exp(pow);
    const toExp = (num, place)=>{
      let pow = Math.floor(Math.log10(num));
    	place = 10**place;
      return (Math.floor(num/(10**pow)*place)/place + `e${pow}`);
    };
    const sci = (num, place=1)=> num >= 1000 ? toExp(num, place).replace("+", "") : round(num);
    const fix_big_num = (num, place)=>{
      const l = Math.floor(Math.log10(num));
      return Math.round(num / ((10**l)/(10**place)))*((10**l)/(10**place));
    };

    /* src/components/Mana.svelte generated by Svelte v3.46.4 */
    const file$4 = "src/components/Mana.svelte";

    // (188:2) {#if $per_click.val > 1}
    function create_if_block_9(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$idle*/ ctx[4].cost) + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Base Mana/Sec +5 ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text(" Mana");
    			attr_dev(b, "class", "svelte-13k4gcl");
    			add_location(b, file$4, 187, 72, 5033);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$4, 187, 27, 4988);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*idle_buy*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$idle*/ 16 && t1_value !== (t1_value = sci(/*$idle*/ ctx[4].cost) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(188:2) {#if $per_click.val > 1}",
    		ctx
    	});

    	return block;
    }

    // (190:2) {#if $idle.val > 0}
    function create_if_block_8(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$bonus*/ ctx[3].cost) + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Bonus to Base Mana +25% ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text(" Mana");
    			attr_dev(b, "class", "svelte-13k4gcl");
    			add_location(b, file$4, 189, 75, 5174);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$4, 189, 22, 5121);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*bonus_buy*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$bonus*/ 8 && t1_value !== (t1_value = sci(/*$bonus*/ ctx[3].cost) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(190:2) {#if $idle.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (192:2) {#if $bonus.val > 0}
    function create_if_block_6(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*$combo*/ ctx[7].unlocked == false) return create_if_block_7;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(192:2) {#if $bonus.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (195:3) {:else}
    function create_else_block$2(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$combo*/ ctx[7].cost) + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Combo Bonus +1% ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text(" Mana");
    			attr_dev(b, "class", "svelte-13k4gcl");
    			add_location(b, file$4, 195, 49, 5450);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$4, 195, 4, 5405);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*combo_buy*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$combo*/ 128 && t1_value !== (t1_value = sci(/*$combo*/ ctx[7].cost) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(195:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (193:3) {#if $combo.unlocked == false}
    function create_if_block_7(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$combo*/ ctx[7].unlock) + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Unlock Click Combo ");
    			b = element("b");
    			t1 = text(t1_value);
    			t2 = text(" Mana");
    			attr_dev(b, "class", "svelte-13k4gcl");
    			add_location(b, file$4, 193, 55, 5348);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$4, 193, 4, 5297);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*combo_unlock*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$combo*/ 128 && t1_value !== (t1_value = sci(/*$combo*/ ctx[7].unlock) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(193:3) {#if $combo.unlocked == false}",
    		ctx
    	});

    	return block;
    }

    // (204:2) {#if $bonus.val > 0}
    function create_if_block_5(ctx) {
    	let t0_value = sci(/*$bonus*/ ctx[3].val * 100) + "";
    	let t0;
    	let t1;
    	let br;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text("% Bonus Bonus");
    			br = element("br");
    			add_location(br, file$4, 203, 59, 5621);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$bonus*/ 8 && t0_value !== (t0_value = sci(/*$bonus*/ ctx[3].val * 100) + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(204:2) {#if $bonus.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (205:2) {#if $combo.unlocked}
    function create_if_block_4(ctx) {
    	let t0;
    	let t1_value = sci(Math.min(/*combo_perc*/ ctx[1], 100) * /*$combo*/ ctx[7].val) + "";
    	let t1;
    	let t2;
    	let t3_value = /*$combo*/ ctx[7].val + "";
    	let t3;
    	let t4;
    	let br;

    	const block = {
    		c: function create() {
    			t0 = text("* ");
    			t1 = text(t1_value);
    			t2 = text("% Combo (+");
    			t3 = text(t3_value);
    			t4 = text("%/Click)");
    			br = element("br");
    			add_location(br, file$4, 204, 99, 5730);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*combo_perc, $combo*/ 130 && t1_value !== (t1_value = sci(Math.min(/*combo_perc*/ ctx[1], 100) * /*$combo*/ ctx[7].val) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$combo*/ 128 && t3_value !== (t3_value = /*$combo*/ ctx[7].val + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(205:2) {#if $combo.unlocked}",
    		ctx
    	});

    	return block;
    }

    // (206:2) {#if $prestige.times > 0}
    function create_if_block_3(ctx) {
    	let t0;
    	let t1_value = sci(/*$prestige*/ ctx[6].times * 0.5 * 100) + "";
    	let t1;
    	let t2;
    	let br;

    	const block = {
    		c: function create() {
    			t0 = text("* ");
    			t1 = text(t1_value);
    			t2 = text("% Prestige Bonus");
    			br = element("br");
    			add_location(br, file$4, 205, 78, 5819);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$prestige*/ 64 && t1_value !== (t1_value = sci(/*$prestige*/ ctx[6].times * 0.5 * 100) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(206:2) {#if $prestige.times > 0}",
    		ctx
    	});

    	return block;
    }

    // (207:2) {#if $mana_ichor_bonus.amount > 0}
    function create_if_block_2(ctx) {
    	let t0;
    	let t1_value = sci(/*$mana_ichor_bonus*/ ctx[8].amount) + "";
    	let t1;
    	let t2;
    	let br;

    	const block = {
    		c: function create() {
    			t0 = text("* ");
    			t1 = text(t1_value);
    			t2 = text("% Ichor Bonus");
    			br = element("br");
    			add_location(br, file$4, 206, 83, 5912);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$mana_ichor_bonus*/ 256 && t1_value !== (t1_value = sci(/*$mana_ichor_bonus*/ ctx[8].amount) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(207:2) {#if $mana_ichor_bonus.amount > 0}",
    		ctx
    	});

    	return block;
    }

    // (210:1) {#if $prestige.times > 0 || $combo.unlocked}
    function create_if_block_1$2(ctx) {
    	let button;
    	let t0;
    	let t1_value = /*$prestige*/ ctx[6].seconds + "";
    	let t1;
    	let t2;

    	let t3_value = (isFinite(/*$prestige*/ ctx[6].fastest)
    	? /*$prestige*/ ctx[6].fastest + 's'
    	: "N/A") + "";

    	let t3;
    	let t4;
    	let b;
    	let t5_value = sci(/*$prestige*/ ctx[6].cost) + "";
    	let t5;
    	let t6;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Prestige ( ");
    			t1 = text(t1_value);
    			t2 = text("s | Best: ");
    			t3 = text(t3_value);
    			t4 = text(" ) ");
    			b = element("b");
    			t5 = text(t5_value);
    			t6 = text(" Mana");
    			attr_dev(b, "class", "svelte-13k4gcl");
    			add_location(b, file$4, 209, 194, 6124);
    			attr_dev(button, "id", "prestige");
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$4, 209, 46, 5976);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    			append_dev(button, t2);
    			append_dev(button, t3);
    			append_dev(button, t4);
    			append_dev(button, b);
    			append_dev(b, t5);
    			append_dev(b, t6);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*do_prestige*/ ctx[19], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$prestige*/ 64 && t1_value !== (t1_value = /*$prestige*/ ctx[6].seconds + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$prestige*/ 64 && t3_value !== (t3_value = (isFinite(/*$prestige*/ ctx[6].fastest)
    			? /*$prestige*/ ctx[6].fastest + 's'
    			: "N/A") + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*$prestige*/ 64 && t5_value !== (t5_value = sci(/*$prestige*/ ctx[6].cost) + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(210:1) {#if $prestige.times > 0 || $combo.unlocked}",
    		ctx
    	});

    	return block;
    }

    // (215:2) {#if $bonus.val > 0}
    function create_if_block$3(ctx) {
    	let t0;
    	let t1_value = sci(/*get_bonus*/ ctx[0] * 100 - 100) + "";
    	let t1;
    	let t2;
    	let br;
    	let t3;
    	let hr;

    	const block = {
    		c: function create() {
    			t0 = text("+");
    			t1 = text(t1_value);
    			t2 = text("% Efficiency");
    			br = element("br");
    			t3 = space();
    			hr = element("hr");
    			add_location(br, file$4, 214, 60, 6409);
    			attr_dev(hr, "class", "svelte-13k4gcl");
    			add_location(hr, file$4, 214, 65, 6414);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*get_bonus*/ 1 && t1_value !== (t1_value = sci(/*get_bonus*/ ctx[0] * 100 - 100) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(215:2) {#if $bonus.val > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let h30;
    	let t0;
    	let t1_value = sci(/*$mana*/ ctx[12]) + "";
    	let t1;
    	let t2;
    	let button;
    	let t3;
    	let b;
    	let t4_value = sci(/*$per_click*/ ctx[5].cost) + "";
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div0;
    	let t10;
    	let h31;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let div2;
    	let h32;
    	let t17;
    	let div1;
    	let t18;
    	let h33;
    	let t19;
    	let t20_value = sci(/*get_per_click*/ ctx[9]) + "";
    	let t20;
    	let t21;
    	let br;
    	let t22;
    	let t23_value = sci(/*get_per_sec*/ ctx[10]) + "";
    	let t23;
    	let t24;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$per_click*/ ctx[5].val > 1 && create_if_block_9(ctx);
    	let if_block1 = /*$idle*/ ctx[4].val > 0 && create_if_block_8(ctx);
    	let if_block2 = /*$bonus*/ ctx[3].val > 0 && create_if_block_6(ctx);
    	let if_block3 = /*$bonus*/ ctx[3].val > 0 && create_if_block_5(ctx);
    	let if_block4 = /*$combo*/ ctx[7].unlocked && create_if_block_4(ctx);
    	let if_block5 = /*$prestige*/ ctx[6].times > 0 && create_if_block_3(ctx);
    	let if_block6 = /*$mana_ichor_bonus*/ ctx[8].amount > 0 && create_if_block_2(ctx);
    	let if_block7 = (/*$prestige*/ ctx[6].times > 0 || /*$combo*/ ctx[7].unlocked) && create_if_block_1$2(ctx);
    	let if_block8 = /*$bonus*/ ctx[3].val > 0 && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h30 = element("h3");
    			t0 = text("Mana: ");
    			t1 = text(t1_value);
    			t2 = space();
    			button = element("button");
    			t3 = text("Base Mana/Click +1 ");
    			b = element("b");
    			t4 = text(t4_value);
    			t5 = text(" Mana");
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			if (if_block2) if_block2.c();
    			t9 = space();
    			div0 = element("div");
    			t10 = space();
    			h31 = element("h3");
    			if (if_block3) if_block3.c();
    			t11 = space();
    			if (if_block4) if_block4.c();
    			t12 = space();
    			if (if_block5) if_block5.c();
    			t13 = space();
    			if (if_block6) if_block6.c();
    			t14 = space();
    			if (if_block7) if_block7.c();
    			t15 = space();
    			div2 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Buy Max";
    			t17 = space();
    			div1 = element("div");
    			t18 = space();
    			h33 = element("h3");
    			if (if_block8) if_block8.c();
    			t19 = space();
    			t20 = text(t20_value);
    			t21 = text(" Mana/Click");
    			br = element("br");
    			t22 = space();
    			t23 = text(t23_value);
    			t24 = text(" Mana/Sec");
    			attr_dev(h30, "id", "mana-txt");
    			attr_dev(h30, "class", "svelte-13k4gcl");
    			add_location(h30, file$4, 183, 2, 4765);
    			attr_dev(b, "class", "svelte-13k4gcl");
    			add_location(b, file$4, 185, 54, 4890);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$4, 185, 2, 4838);
    			attr_dev(div0, "id", "gap");
    			add_location(div0, file$4, 200, 1, 5518);
    			attr_dev(h31, "id", "extra-info");
    			attr_dev(h31, "class", "svelte-13k4gcl");
    			add_location(h31, file$4, 202, 1, 5541);
    			attr_dev(h32, "id", "max");
    			attr_dev(h32, "class", "svelte-13k4gcl");
    			add_location(h32, file$4, 211, 35, 6209);
    			attr_dev(div1, "id", "combo");
    			set_style(div1, "height", Math.min(/*combo_perc*/ ctx[1], 100) + "%");
    			attr_dev(div1, "class", "svelte-13k4gcl");
    			add_location(div1, file$4, 211, 82, 6256);
    			attr_dev(div2, "id", "click");
    			attr_dev(div2, "class", "svelte-13k4gcl");
    			add_location(div2, file$4, 211, 1, 6175);
    			add_location(br, file$4, 215, 33, 6458);
    			attr_dev(h33, "id", "info");
    			attr_dev(h33, "class", "svelte-13k4gcl");
    			add_location(h33, file$4, 213, 1, 6334);
    			set_style(main, "grid-template-rows", "repeat(" + /*main_rows*/ ctx[11] + ", max-content) 1fr repeat(2, max-content)");
    			attr_dev(main, "class", "svelte-13k4gcl");
    			add_location(main, file$4, 181, 0, 4647);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h30);
    			append_dev(h30, t0);
    			append_dev(h30, t1);
    			append_dev(main, t2);
    			append_dev(main, button);
    			append_dev(button, t3);
    			append_dev(button, b);
    			append_dev(b, t4);
    			append_dev(b, t5);
    			append_dev(main, t6);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t7);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t8);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t9);
    			append_dev(main, div0);
    			append_dev(main, t10);
    			append_dev(main, h31);
    			if (if_block3) if_block3.m(h31, null);
    			append_dev(h31, t11);
    			if (if_block4) if_block4.m(h31, null);
    			append_dev(h31, t12);
    			if (if_block5) if_block5.m(h31, null);
    			append_dev(h31, t13);
    			if (if_block6) if_block6.m(h31, null);
    			append_dev(main, t14);
    			if (if_block7) if_block7.m(main, null);
    			append_dev(main, t15);
    			append_dev(main, div2);
    			append_dev(div2, h32);
    			/*h32_binding*/ ctx[22](h32);
    			append_dev(div2, t17);
    			append_dev(div2, div1);
    			append_dev(main, t18);
    			append_dev(main, h33);
    			if (if_block8) if_block8.m(h33, null);
    			append_dev(h33, t19);
    			append_dev(h33, t20);
    			append_dev(h33, t21);
    			append_dev(h33, br);
    			append_dev(h33, t22);
    			append_dev(h33, t23);
    			append_dev(h33, t24);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*per_click_buy*/ ctx[14], false, false, false),
    					listen_dev(div2, "click", /*click*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$mana*/ 4096 && t1_value !== (t1_value = sci(/*$mana*/ ctx[12]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$per_click*/ 32 && t4_value !== (t4_value = sci(/*$per_click*/ ctx[5].cost) + "")) set_data_dev(t4, t4_value);

    			if (/*$per_click*/ ctx[5].val > 1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_9(ctx);
    					if_block0.c();
    					if_block0.m(main, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$idle*/ ctx[4].val > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_8(ctx);
    					if_block1.c();
    					if_block1.m(main, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$bonus*/ ctx[3].val > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_6(ctx);
    					if_block2.c();
    					if_block2.m(main, t9);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*$bonus*/ ctx[3].val > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_5(ctx);
    					if_block3.c();
    					if_block3.m(h31, t11);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*$combo*/ ctx[7].unlocked) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_4(ctx);
    					if_block4.c();
    					if_block4.m(h31, t12);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*$prestige*/ ctx[6].times > 0) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_3(ctx);
    					if_block5.c();
    					if_block5.m(h31, t13);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*$mana_ichor_bonus*/ ctx[8].amount > 0) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_2(ctx);
    					if_block6.c();
    					if_block6.m(h31, null);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (/*$prestige*/ ctx[6].times > 0 || /*$combo*/ ctx[7].unlocked) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);
    				} else {
    					if_block7 = create_if_block_1$2(ctx);
    					if_block7.c();
    					if_block7.m(main, t15);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (dirty & /*combo_perc*/ 2) {
    				set_style(div1, "height", Math.min(/*combo_perc*/ ctx[1], 100) + "%");
    			}

    			if (/*$bonus*/ ctx[3].val > 0) {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);
    				} else {
    					if_block8 = create_if_block$3(ctx);
    					if_block8.c();
    					if_block8.m(h33, t19);
    				}
    			} else if (if_block8) {
    				if_block8.d(1);
    				if_block8 = null;
    			}

    			if (dirty & /*get_per_click*/ 512 && t20_value !== (t20_value = sci(/*get_per_click*/ ctx[9]) + "")) set_data_dev(t20, t20_value);
    			if (dirty & /*get_per_sec*/ 1024 && t23_value !== (t23_value = sci(/*get_per_sec*/ ctx[10]) + "")) set_data_dev(t23, t23_value);

    			if (dirty & /*main_rows*/ 2048) {
    				set_style(main, "grid-template-rows", "repeat(" + /*main_rows*/ ctx[11] + ", max-content) 1fr repeat(2, max-content)");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			/*h32_binding*/ ctx[22](null);
    			if (if_block8) if_block8.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $bonus;
    	let $idle;
    	let $per_click;
    	let $prestige;
    	let $combo;
    	let $mana;
    	let $mana_ichor_bonus;
    	let $max_entry;
    	validate_store(mana_bonus, 'bonus');
    	component_subscribe($$self, mana_bonus, $$value => $$invalidate(3, $bonus = $$value));
    	validate_store(mana_idle, 'idle');
    	component_subscribe($$self, mana_idle, $$value => $$invalidate(4, $idle = $$value));
    	validate_store(mana_click, 'per_click');
    	component_subscribe($$self, mana_click, $$value => $$invalidate(5, $per_click = $$value));
    	validate_store(mana_prestige, 'prestige');
    	component_subscribe($$self, mana_prestige, $$value => $$invalidate(6, $prestige = $$value));
    	validate_store(mana_combo, 'combo');
    	component_subscribe($$self, mana_combo, $$value => $$invalidate(7, $combo = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(12, $mana = $$value));
    	validate_store(mana_ichor_bonus, 'mana_ichor_bonus');
    	component_subscribe($$self, mana_ichor_bonus, $$value => $$invalidate(8, $mana_ichor_bonus = $$value));
    	validate_store(max_entry, 'max_entry');
    	component_subscribe($$self, max_entry, $$value => $$invalidate(24, $max_entry = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Mana', slots, []);
    	let { max_buy } = $$props;

    	//#region | Per Click
    	const click = () => {
    		set_store_value(mana, $mana += get_per_click, $mana);
    		get_combo();
    	};

    	const per_click_buy = () => {
    		if ($max_entry == 0) set_store_value(max_entry, $max_entry = 1, $max_entry);
    		if ($mana < $per_click.cost) return;
    		set_store_value(mana, $mana -= $per_click.cost, $mana);
    		set_store_value(mana_click, $per_click.cost = Math.ceil($per_click.cost * 1.15), $per_click);
    		set_store_value(mana_click, $per_click.val++, $per_click);
    		mana_click.set($per_click);
    		if (max_buy) per_click_buy();
    	};

    	let get_per_click = 0;

    	// const click_main = (clicked)=>{
    	// 	const t = clicked.target;
    	// 	if (t.tagName.toLowerCase() == "button" || t.parentElement.tagName.toLowerCase() == "button") {
    	// 		calc_click();
    	// 	}
    	// }
    	let deci = 0;

    	mana.subscribe(v => {
    		if (Math.floor(v) != v) {
    			deci += v - Math.floor(v);
    			let add = 0;

    			if (deci >= 1) {
    				add = Math.floor(deci);
    				deci -= Math.floor(deci);
    			}

    			set_store_value(mana, $mana = Math.floor(v) + add, $mana);
    		}
    	});

    	//#endregion
    	//#region | Idle
    	let get_per_sec = $idle.val;

    	let idle_loop = setInterval(
    		() => {
    			set_store_value(mana, $mana += get_per_sec / 5, $mana);
    		},
    		200
    	);

    	const idle_buy = () => {
    		if ($max_entry == 1) set_store_value(max_entry, $max_entry = 2, $max_entry);
    		if ($mana < $idle.cost) return;
    		set_store_value(mana, $mana -= $idle.cost, $mana);
    		set_store_value(mana_idle, $idle.cost = Math.ceil($idle.cost * 1.15), $idle);
    		set_store_value(mana_idle, $idle.val += 5, $idle);
    		mana_idle.set($idle);
    		if (max_buy) idle_buy();
    	};

    	//#endregion
    	//#region | Bonus
    	let get_bonus = 0;

    	// $: console.log(get_bonus);
    	// p1 * p2 * p3 | bonus * combo * prestige
    	// $: console.log(`1 + (${$bonus.val <= 0 ? 1 : $bonus.val} * ${1 + (Math.min(combo_perc, 100) * $combo.val)/100}) * ${1 + $prestige.times * 0.5}`)
    	// $: console.log(`Total bonus: ${get_bonus}, bonus.val: ${$bonus.val}, combo_perc: ${combo_perc}, combo.val: ${$combo.val}, prestige.times: ${$prestige.times}`);
    	// $: get_bonus = 1 + $bonus.val;
    	const bonus_buy = () => {
    		// if ($max_entry == 2) $max_entry = 3;
    		if ($mana < $bonus.cost) return;

    		set_store_value(mana, $mana -= $bonus.cost, $mana);
    		set_store_value(mana_bonus, $bonus.cost = Math.ceil($bonus.cost * 1.25), $bonus);
    		set_store_value(mana_bonus, $bonus.val += 0.25, $bonus);
    		mana_bonus.set($bonus);
    		if (max_buy) bonus_buy();
    	};

    	//#endregion
    	//#region | Combo
    	let combo_perc = 0;

    	const combo_loop = setInterval(
    		() => {
    			if (combo_perc >= 0) $$invalidate(1, combo_perc -= 1);
    			if (combo_perc < 0) $$invalidate(1, combo_perc = 0);
    		},
    		333
    	);

    	const get_combo = () => {
    		if (!$combo.unlocked) return;
    		$$invalidate(1, combo_perc++, combo_perc);
    		if (combo_perc > 100) $$invalidate(1, combo_perc = 120);
    	};

    	const combo_unlock = () => {
    		if ($mana < $combo.unlock) return;
    		set_store_value(mana, $mana -= $combo.unlock, $mana);
    		set_store_value(mana_combo, $combo.unlocked = true, $combo);
    		set_store_value(mana_combo, $combo.val = 1, $combo);
    		mana_combo.set($combo);
    	};

    	const combo_buy = () => {
    		if ($mana < $combo.cost) return;
    		set_store_value(mana, $mana -= $combo.cost, $mana);
    		set_store_value(mana_combo, $combo.cost = Math.round($combo.cost * 1.25), $combo);
    		set_store_value(mana_combo, $combo.val++, $combo);
    		mana_combo.set($combo);
    		if (max_buy) combo_buy();
    	};

    	//#endregion
    	//#region | Prestige
    	const prest_loop = setInterval(
    		() => {
    			set_store_value(mana_prestige, $prestige.seconds++, $prestige);
    		},
    		1000
    	);

    	const reset_mana = () => {
    		set_store_value(mana, $mana = 0, $mana);
    		mana_click.update(v => (v.cost = 25, v.val = 1, v));
    		mana_idle.update(v => (v.cost = 100, v.val = 0, v));
    		mana_bonus.update(v => (v.cost = 1000, v.val = 0, v));
    		mana_combo.update(v => (v.cost = 1000, v.val = 0, v.unlocked = false, v.unlock = 7500, v));
    		mana_prestige.update(v => (v.cost = 1e+6, v.times = 0, v));
    	};

    	const do_prestige = () => {
    		if ($mana < $prestige.cost) return;
    		set_store_value(mana, $mana = 0, $mana); //2e+6; //-! DEBUG VALUE
    		set_store_value(mana_click, $per_click.cost = 25, $per_click);
    		set_store_value(mana_click, $per_click.val = 1, $per_click);
    		set_store_value(mana_idle, $idle.cost = 100, $idle);
    		set_store_value(mana_idle, $idle.val = 0, $idle);
    		set_store_value(mana_bonus, $bonus.cost = 1000, $bonus);
    		set_store_value(mana_bonus, $bonus.val = 0, $bonus);
    		set_store_value(mana_combo, $combo.unlocked = false, $combo);
    		set_store_value(mana_combo, $combo.cost = 1000, $combo);
    		set_store_value(mana_combo, $combo.val = 0, $combo);
    		$$invalidate(1, combo_perc = 0);
    		set_store_value(mana_prestige, $prestige.times++, $prestige);
    		set_store_value(mana_prestige, $prestige.cost *= 1.2, $prestige);
    		set_store_value(mana_prestige, $prestige.cost = fix_big_num($prestige.cost, 1), $prestige);
    		if ($prestige.seconds < $prestige.fastest) set_store_value(mana_prestige, $prestige.fastest = $prestige.seconds, $prestige);
    		set_store_value(mana_prestige, $prestige.seconds = 0, $prestige);
    	}; // console.log(`mana: ${$mana}, prest cost: ${$prestige.cost}`);

    	//#endregion
    	//#region | Main
    	let main_rows = 0;

    	//#endregion
    	// $: console.log($mana);
    	// $: console.log("Max buying: " + max_buy);
    	let max_text = null;

    	const writable_props = ['max_buy'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Mana> was created with unknown prop '${key}'`);
    	});

    	function h32_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			max_text = $$value;
    			($$invalidate(2, max_text), $$invalidate(20, max_buy));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('max_buy' in $$props) $$invalidate(20, max_buy = $$props.max_buy);
    	};

    	$$self.$capture_state = () => ({
    		max_buy,
    		max_entry,
    		mana,
    		per_click: mana_click,
    		idle: mana_idle,
    		bonus: mana_bonus,
    		combo: mana_combo,
    		prestige: mana_prestige,
    		mana_ichor_bonus,
    		sci,
    		fix_big_num,
    		click,
    		per_click_buy,
    		get_per_click,
    		deci,
    		get_per_sec,
    		idle_loop,
    		idle_buy,
    		get_bonus,
    		bonus_buy,
    		combo_perc,
    		combo_loop,
    		get_combo,
    		combo_unlock,
    		combo_buy,
    		prest_loop,
    		reset_mana,
    		do_prestige,
    		main_rows,
    		max_text,
    		$bonus,
    		$idle,
    		$per_click,
    		$prestige,
    		$combo,
    		$mana,
    		$mana_ichor_bonus,
    		$max_entry
    	});

    	$$self.$inject_state = $$props => {
    		if ('max_buy' in $$props) $$invalidate(20, max_buy = $$props.max_buy);
    		if ('get_per_click' in $$props) $$invalidate(9, get_per_click = $$props.get_per_click);
    		if ('deci' in $$props) deci = $$props.deci;
    		if ('get_per_sec' in $$props) $$invalidate(10, get_per_sec = $$props.get_per_sec);
    		if ('idle_loop' in $$props) idle_loop = $$props.idle_loop;
    		if ('get_bonus' in $$props) $$invalidate(0, get_bonus = $$props.get_bonus);
    		if ('combo_perc' in $$props) $$invalidate(1, combo_perc = $$props.combo_perc);
    		if ('main_rows' in $$props) $$invalidate(11, main_rows = $$props.main_rows);
    		if ('max_text' in $$props) $$invalidate(2, max_text = $$props.max_text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$bonus, combo_perc, $combo, $prestige, $mana_ichor_bonus*/ 458) {
    			$$invalidate(0, get_bonus = ($bonus.val <= 0 ? 1 : 1 + $bonus.val) * (1 + Math.min(combo_perc, 100) * $combo.val / 100) * (1 + $prestige.times * 0.5) * (1 + $mana_ichor_bonus.amount / 100));
    		}

    		if ($$self.$$.dirty & /*$per_click, get_bonus*/ 33) {
    			$$invalidate(9, get_per_click = $per_click.val * get_bonus);
    		}

    		if ($$self.$$.dirty & /*$idle, get_bonus*/ 17) {
    			$$invalidate(10, get_per_sec = $idle.val * get_bonus);
    		}

    		if ($$self.$$.dirty & /*$per_click, $idle, $bonus*/ 56) {
    			{
    				let total = 2;
    				if ($per_click.val > 1) total++;
    				if ($idle.val > 0) total++;
    				if ($bonus.val > 0) total++;
    				$$invalidate(11, main_rows = total);
    			}
    		}

    		if ($$self.$$.dirty & /*max_text, max_buy*/ 1048580) {
    			{
    				if (max_text != null) {
    					if (max_buy) $$invalidate(2, max_text.style.display = "block", max_text); else $$invalidate(2, max_text.style.display = "none", max_text);
    				}
    			}
    		}
    	};

    	return [
    		get_bonus,
    		combo_perc,
    		max_text,
    		$bonus,
    		$idle,
    		$per_click,
    		$prestige,
    		$combo,
    		$mana_ichor_bonus,
    		get_per_click,
    		get_per_sec,
    		main_rows,
    		$mana,
    		click,
    		per_click_buy,
    		idle_buy,
    		bonus_buy,
    		combo_unlock,
    		combo_buy,
    		do_prestige,
    		max_buy,
    		reset_mana,
    		h32_binding
    	];
    }

    class Mana extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { max_buy: 20, reset_mana: 21 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mana",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*max_buy*/ ctx[20] === undefined && !('max_buy' in props)) {
    			console.warn("<Mana> was created without expected prop 'max_buy'");
    		}
    	}

    	get max_buy() {
    		throw new Error("<Mana>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max_buy(value) {
    		throw new Error("<Mana>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reset_mana() {
    		return this.$$.ctx[21];
    	}

    	set reset_mana(value) {
    		throw new Error("<Mana>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Power.svelte generated by Svelte v3.46.4 */
    const file$3 = "src/components/Power.svelte";

    // (111:0) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "lock");
    			attr_dev(div, "class", "svelte-teu2gl");
    			add_location(div, file$3, 111, 1, 3271);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(111:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (93:0) {#if $mana_prestige.times >= 5 || $unlocked_ichor }
    function create_if_block$2(ctx) {
    	let h30;
    	let t0;
    	let t1_value = sci(/*$power*/ ctx[10]) + "";
    	let t1;
    	let t2;
    	let div1;
    	let h31;
    	let t3;
    	let t4_value = /*$cores*/ ctx[5].planet + "";
    	let t4;
    	let t5;
    	let div0;
    	let t6;
    	let h32;
    	let t7_value = round(/*bar_perc*/ ctx[2], 1) + "";
    	let t7;
    	let t8;
    	let t9;
    	let h33;
    	let t10_value = sci(/*cost*/ ctx[7]) + "";
    	let t10;
    	let t11;
    	let t12;
    	let div2;
    	let h34;
    	let t14;
    	let button0;
    	let t15;
    	let b0;
    	let t16;
    	let t17_value = sci(/*next_ichor*/ ctx[8]) + "";
    	let t17;
    	let t18;
    	let t19;
    	let div3;
    	let div3_style_value;
    	let t20;
    	let div4;
    	let h35;
    	let t21;
    	let t22_value = sci(/*$ichor*/ ctx[4]) + "";
    	let t22;
    	let t23;
    	let button1;
    	let t24;
    	let b1;
    	let t25_value = /*$mana_ichor_bonus*/ ctx[9].cost + "";
    	let t25;
    	let t26;
    	let t27;
    	let button2;
    	let t28;
    	let b2;
    	let t29_value = /*$discount*/ ctx[3].cost + "";
    	let t29;
    	let t30;
    	let t31;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*$discount*/ ctx[3].amount > 0 && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			t0 = text("Power: ");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			t3 = text("Planet Cores: ");
    			t4 = text(t4_value);
    			t5 = space();
    			div0 = element("div");
    			t6 = space();
    			h32 = element("h3");
    			t7 = text(t7_value);
    			t8 = text("%");
    			t9 = space();
    			h33 = element("h3");
    			t10 = text(t10_value);
    			t11 = text(" Mana -> 1 Power");
    			t12 = space();
    			div2 = element("div");
    			h34 = element("h3");
    			h34.textContent = "Buy Max";
    			t14 = space();
    			button0 = element("button");
    			t15 = text("Prestige ( Turn cores into Ichor ) ");
    			b0 = element("b");
    			t16 = text("+");
    			t17 = text(t17_value);
    			t18 = text(" Ichor");
    			t19 = space();
    			div3 = element("div");
    			t20 = space();
    			div4 = element("div");
    			h35 = element("h3");
    			t21 = text("Ichor: ");
    			t22 = text(t22_value);
    			t23 = space();
    			button1 = element("button");
    			t24 = text("Mana Efficiency +1% ");
    			b1 = element("b");
    			t25 = text(t25_value);
    			t26 = text(" Ichor");
    			t27 = space();
    			button2 = element("button");
    			t28 = text("Power Cost -1% ");
    			b2 = element("b");
    			t29 = text(t29_value);
    			t30 = text(" Ichor");
    			t31 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h30, "id", "power");
    			attr_dev(h30, "class", "svelte-teu2gl");
    			add_location(h30, file$3, 93, 1, 2335);
    			attr_dev(h31, "id", "core-info");
    			attr_dev(h31, "class", "svelte-teu2gl");
    			add_location(h31, file$3, 94, 22, 2398);
    			set_style(div0, "width", round(/*bar_perc*/ ctx[2], 1) + "%");
    			attr_dev(div0, "class", "svelte-teu2gl");
    			add_location(div0, file$3, 94, 76, 2452);
    			attr_dev(h32, "id", "perc");
    			attr_dev(h32, "class", "svelte-teu2gl");
    			add_location(h32, file$3, 94, 126, 2502);
    			attr_dev(div1, "id", "power-bar");
    			attr_dev(div1, "class", "svelte-teu2gl");
    			add_location(div1, file$3, 94, 1, 2377);
    			attr_dev(h33, "id", "power-cost");
    			attr_dev(h33, "class", "svelte-teu2gl");
    			add_location(h33, file$3, 96, 1, 2552);
    			attr_dev(h34, "id", "max");
    			attr_dev(h34, "class", "svelte-teu2gl");
    			add_location(h34, file$3, 98, 34, 2640);
    			attr_dev(div2, "id", "click");
    			attr_dev(div2, "class", "svelte-teu2gl");
    			add_location(div2, file$3, 98, 1, 2607);
    			attr_dev(b0, "class", "svelte-teu2gl");
    			add_location(b0, file$3, 100, 84, 2778);
    			attr_dev(button0, "id", "prestige");
    			attr_dev(button0, "class", "svelte-teu2gl");
    			add_location(button0, file$3, 100, 1, 2695);
    			attr_dev(div3, "id", "ichor-hover");
    			attr_dev(div3, "style", div3_style_value = /*$unlocked_ichor*/ ctx[6] <= 0 ? "display: none;" : "");
    			attr_dev(div3, "class", "svelte-teu2gl");
    			add_location(div3, file$3, 102, 1, 2821);
    			attr_dev(h35, "id", "ichor-amount");
    			attr_dev(h35, "class", "svelte-teu2gl");
    			add_location(h35, file$3, 104, 2, 2932);
    			attr_dev(b1, "class", "svelte-teu2gl");
    			add_location(b1, file$3, 105, 47, 3027);
    			attr_dev(button1, "class", "svelte-teu2gl");
    			add_location(button1, file$3, 105, 2, 2982);
    			attr_dev(b2, "class", "svelte-teu2gl");
    			add_location(b2, file$3, 106, 42, 3116);
    			attr_dev(button2, "class", "svelte-teu2gl");
    			add_location(button2, file$3, 106, 2, 3076);
    			attr_dev(div4, "id", "ichor-menu");
    			attr_dev(div4, "class", "svelte-teu2gl");
    			add_location(div4, file$3, 103, 1, 2908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			append_dev(h30, t0);
    			append_dev(h30, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h31);
    			append_dev(h31, t3);
    			append_dev(h31, t4);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div1, t6);
    			append_dev(div1, h32);
    			append_dev(h32, t7);
    			append_dev(h32, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h33, anchor);
    			append_dev(h33, t10);
    			append_dev(h33, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h34);
    			/*h34_binding*/ ctx[19](h34);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t15);
    			append_dev(button0, b0);
    			append_dev(b0, t16);
    			append_dev(b0, t17);
    			append_dev(b0, t18);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div3, anchor);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h35);
    			append_dev(h35, t21);
    			append_dev(h35, t22);
    			append_dev(div4, t23);
    			append_dev(div4, button1);
    			append_dev(button1, t24);
    			append_dev(button1, b1);
    			append_dev(b1, t25);
    			append_dev(b1, t26);
    			append_dev(div4, t27);
    			append_dev(div4, button2);
    			append_dev(button2, t28);
    			append_dev(button2, b2);
    			append_dev(b2, t29);
    			append_dev(b2, t30);
    			insert_dev(target, t31, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "click", /*click*/ ctx[12], false, false, false),
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*click_prestige*/ ctx[0])) /*click_prestige*/ ctx[0].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*upgr1*/ ctx[13], false, false, false),
    					listen_dev(button2, "click", /*upgr2*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$power*/ 1024 && t1_value !== (t1_value = sci(/*$power*/ ctx[10]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$cores*/ 32 && t4_value !== (t4_value = /*$cores*/ ctx[5].planet + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*bar_perc*/ 4) {
    				set_style(div0, "width", round(/*bar_perc*/ ctx[2], 1) + "%");
    			}

    			if (dirty & /*bar_perc*/ 4 && t7_value !== (t7_value = round(/*bar_perc*/ ctx[2], 1) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*cost*/ 128 && t10_value !== (t10_value = sci(/*cost*/ ctx[7]) + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*next_ichor*/ 256 && t17_value !== (t17_value = sci(/*next_ichor*/ ctx[8]) + "")) set_data_dev(t17, t17_value);

    			if (dirty & /*$unlocked_ichor*/ 64 && div3_style_value !== (div3_style_value = /*$unlocked_ichor*/ ctx[6] <= 0 ? "display: none;" : "")) {
    				attr_dev(div3, "style", div3_style_value);
    			}

    			if (dirty & /*$ichor*/ 16 && t22_value !== (t22_value = sci(/*$ichor*/ ctx[4]) + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*$mana_ichor_bonus*/ 512 && t25_value !== (t25_value = /*$mana_ichor_bonus*/ ctx[9].cost + "")) set_data_dev(t25, t25_value);
    			if (dirty & /*$discount*/ 8 && t29_value !== (t29_value = /*$discount*/ ctx[3].cost + "")) set_data_dev(t29, t29_value);

    			if (/*$discount*/ ctx[3].amount > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h33);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div2);
    			/*h34_binding*/ ctx[19](null);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t31);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(93:0) {#if $mana_prestige.times >= 5 || $unlocked_ichor }",
    		ctx
    	});

    	return block;
    }

    // (110:1) {#if $discount.amount > 0}
    function create_if_block_1$1(ctx) {
    	let h3;
    	let t0;
    	let t1_value = /*$discount*/ ctx[3].amount + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Cost Discount: -");
    			t1 = text(t1_value);
    			t2 = text("%");
    			attr_dev(h3, "id", "discount-info");
    			attr_dev(h3, "class", "svelte-teu2gl");
    			add_location(h3, file$3, 109, 28, 3192);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$discount*/ 8 && t1_value !== (t1_value = /*$discount*/ ctx[3].amount + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(110:1) {#if $discount.amount > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*$mana_prestige*/ ctx[11].times >= 5 || /*$unlocked_ichor*/ ctx[6]) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-teu2gl");
    			add_location(main, file$3, 91, 0, 2275);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $discount;
    	let $ichor;
    	let $mana_ichor_bonus;
    	let $cores;
    	let $prog;
    	let $power;
    	let $unlocked_ichor;
    	let $mana;
    	let $power_cost;
    	let $mana_prestige;
    	validate_store(power_discount, 'discount');
    	component_subscribe($$self, power_discount, $$value => $$invalidate(3, $discount = $$value));
    	validate_store(ichor, 'ichor');
    	component_subscribe($$self, ichor, $$value => $$invalidate(4, $ichor = $$value));
    	validate_store(mana_ichor_bonus, 'mana_ichor_bonus');
    	component_subscribe($$self, mana_ichor_bonus, $$value => $$invalidate(9, $mana_ichor_bonus = $$value));
    	validate_store(cores, 'cores');
    	component_subscribe($$self, cores, $$value => $$invalidate(5, $cores = $$value));
    	validate_store(power_progress, 'prog');
    	component_subscribe($$self, power_progress, $$value => $$invalidate(17, $prog = $$value));
    	validate_store(power, 'power');
    	component_subscribe($$self, power, $$value => $$invalidate(10, $power = $$value));
    	validate_store(unlocked_ichor, 'unlocked_ichor');
    	component_subscribe($$self, unlocked_ichor, $$value => $$invalidate(6, $unlocked_ichor = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(20, $mana = $$value));
    	validate_store(power_cost, 'power_cost');
    	component_subscribe($$self, power_cost, $$value => $$invalidate(18, $power_cost = $$value));
    	validate_store(mana_prestige, 'mana_prestige');
    	component_subscribe($$self, mana_prestige, $$value => $$invalidate(11, $mana_prestige = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Power', slots, []);
    	let cost = 0;

    	const click = () => {
    		if ($mana <= cost) return;

    		if (max_buy) {
    			let max = floor($mana / cost, 0);
    			set_store_value(mana, $mana -= cost * max, $mana);
    			set_store_value(power, $power += max, $power);
    		} else {
    			set_store_value(power, $power++, $power);
    			set_store_value(mana, $mana -= cost, $mana);
    		}
    	};

    	let { max_buy = false } = $$props;
    	let max_text = null;

    	//#endregion
    	//#region | Idle Stuff
    	let bar_perc = 0;

    	const power_loop = setInterval(
    		() => {
    			set_store_value(power_progress, $prog.val += $power / 10, $prog);
    			power_progress.update(v => (v.val += $power / 10, v));
    			power_progress.set($prog);
    		},
    		1000 / 10
    	);

    	//#endregion
    	//#region | Prestige Stuff
    	let next_ichor = 0;

    	const do_prestige = check_next => {
    		if (check_next) return next_ichor;
    		power_progress.update(v => (v.val = 0, v));
    		ichor.update(v => v + next_ichor);
    		cores.update(v => (v.planet = 0, v.realm = 0, v.universe = 0, v));
    		power.set(0);
    	};

    	let { click_prestige } = $$props;

    	//#endregion 
    	//#region | Ichor Upgrades
    	const upgr1 = () => {
    		// Mana Efficiency
    		if ($ichor < $mana_ichor_bonus.cost) return;

    		mana_ichor_bonus.update(v => (v.amount++, v.cost++, v));
    		set_store_value(ichor, $ichor -= $mana_ichor_bonus.cost, $ichor);
    	};

    	const upgr2 = () => {
    		// Mana Efficiency
    		if ($ichor < $discount.cost || $discount.amount >= 99) return;

    		power_discount.update(v => (v.amount++, v.cost += 2, v));
    		set_store_value(ichor, $ichor -= $discount.cost, $ichor);
    	};

    	const writable_props = ['max_buy', 'click_prestige'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Power> was created with unknown prop '${key}'`);
    	});

    	function h34_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			max_text = $$value;
    			($$invalidate(1, max_text), $$invalidate(15, max_buy));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('max_buy' in $$props) $$invalidate(15, max_buy = $$props.max_buy);
    		if ('click_prestige' in $$props) $$invalidate(0, click_prestige = $$props.click_prestige);
    	};

    	$$self.$capture_state = () => ({
    		mana,
    		mana_prestige,
    		mana_ichor_bonus,
    		prog: power_progress,
    		power,
    		power_cost,
    		discount: power_discount,
    		cores,
    		ichor,
    		unlocked_ichor,
    		round,
    		floor,
    		sci,
    		cost,
    		click,
    		max_buy,
    		max_text,
    		bar_perc,
    		power_loop,
    		next_ichor,
    		do_prestige,
    		click_prestige,
    		upgr1,
    		upgr2,
    		$discount,
    		$ichor,
    		$mana_ichor_bonus,
    		$cores,
    		$prog,
    		$power,
    		$unlocked_ichor,
    		$mana,
    		$power_cost,
    		$mana_prestige
    	});

    	$$self.$inject_state = $$props => {
    		if ('cost' in $$props) $$invalidate(7, cost = $$props.cost);
    		if ('max_buy' in $$props) $$invalidate(15, max_buy = $$props.max_buy);
    		if ('max_text' in $$props) $$invalidate(1, max_text = $$props.max_text);
    		if ('bar_perc' in $$props) $$invalidate(2, bar_perc = $$props.bar_perc);
    		if ('next_ichor' in $$props) $$invalidate(8, next_ichor = $$props.next_ichor);
    		if ('click_prestige' in $$props) $$invalidate(0, click_prestige = $$props.click_prestige);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$power_cost, $discount*/ 262152) {
    			$$invalidate(7, cost = $power_cost * (1 - $discount.amount / 100));
    		}

    		if ($$self.$$.dirty & /*$unlocked_ichor, $ichor*/ 80) {
    			{
    				if ($unlocked_ichor == false) {
    					if ($ichor > 0) set_store_value(unlocked_ichor, $unlocked_ichor = true, $unlocked_ichor);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*max_text, max_buy*/ 32770) {
    			{
    				// Max Buy Text
    				if (max_text != null) {
    					if (max_buy) $$invalidate(1, max_text.style.display = "block", max_text); else $$invalidate(1, max_text.style.display = "none", max_text);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$prog, bar_perc*/ 131076) {
    			{
    				// Bar Percentage
    				// let log_prog = Math.log10($prog.val);
    				$$invalidate(2, bar_perc = Math.log10(Math.max(1, $prog.val)) / Math.log10($prog.max) * 100); // Math.min(100, (isFinite(log_prog) ? log_prog : 0)/Math.log10($prog.max));

    				if (bar_perc >= 100) {
    					$$invalidate(2, bar_perc = 100);
    					power_progress.update(v => (v.val = 0, v.max = round(v.max * 1.15), v));
    					cores.update(v => (v.planet++, v));
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$cores*/ 32) {
    			{
    				$$invalidate(8, next_ichor = $cores.planet * 1 + 0); // Other stuffs
    			}
    		}
    	};

    	return [
    		click_prestige,
    		max_text,
    		bar_perc,
    		$discount,
    		$ichor,
    		$cores,
    		$unlocked_ichor,
    		cost,
    		next_ichor,
    		$mana_ichor_bonus,
    		$power,
    		$mana_prestige,
    		click,
    		upgr1,
    		upgr2,
    		max_buy,
    		do_prestige,
    		$prog,
    		$power_cost,
    		h34_binding
    	];
    }

    class Power extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			max_buy: 15,
    			do_prestige: 16,
    			click_prestige: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Power",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*click_prestige*/ ctx[0] === undefined && !('click_prestige' in props)) {
    			console.warn("<Power> was created without expected prop 'click_prestige'");
    		}
    	}

    	get max_buy() {
    		throw new Error("<Power>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max_buy(value) {
    		throw new Error("<Power>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get do_prestige() {
    		return this.$$.ctx[16];
    	}

    	set do_prestige(value) {
    		throw new Error("<Power>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get click_prestige() {
    		throw new Error("<Power>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set click_prestige(value) {
    		throw new Error("<Power>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/PrestigeModal.svelte generated by Svelte v3.46.4 */

    const file$2 = "src/components/PrestigeModal.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h30;
    	let t3;
    	let h31;
    	let t5;
    	let div;
    	let button0;
    	let t7;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Total Prestige";
    			t1 = space();
    			h30 = element("h3");
    			h30.textContent = "Prestiging this way will reset the entire game (besides Ichor upgrades) in exchange for Ichor.";
    			t3 = space();
    			h31 = element("h3");
    			h31.textContent = "Are you sure you want to?";
    			t5 = space();
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Yes!";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "No...";
    			attr_dev(h1, "class", "svelte-dvrlsd");
    			add_location(h1, file$2, 15, 1, 170);
    			attr_dev(h30, "class", "svelte-dvrlsd");
    			add_location(h30, file$2, 16, 1, 195);
    			attr_dev(h31, "id", "check");
    			attr_dev(h31, "class", "svelte-dvrlsd");
    			add_location(h31, file$2, 17, 1, 300);
    			attr_dev(button0, "class", "svelte-dvrlsd");
    			add_location(button0, file$2, 20, 2, 369);
    			attr_dev(button1, "class", "svelte-dvrlsd");
    			add_location(button1, file$2, 21, 2, 408);
    			attr_dev(div, "id", "choices");
    			attr_dev(div, "class", "svelte-dvrlsd");
    			add_location(div, file$2, 19, 1, 348);
    			attr_dev(main, "class", "svelte-dvrlsd");
    			add_location(main, file$2, 13, 0, 161);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h30);
    			append_dev(main, t3);
    			append_dev(main, h31);
    			append_dev(main, t5);
    			append_dev(main, div);
    			append_dev(div, button0);
    			append_dev(div, t7);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*yes*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*no*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PrestigeModal', slots, []);
    	let { active = false } = $$props;
    	let { on_yes } = $$props;

    	const yes = () => {
    		$$invalidate(2, active = false);
    		on_yes();
    	};

    	const no = () => {
    		$$invalidate(2, active = false);
    	};

    	const writable_props = ['active', 'on_yes'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PrestigeModal> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('active' in $$props) $$invalidate(2, active = $$props.active);
    		if ('on_yes' in $$props) $$invalidate(3, on_yes = $$props.on_yes);
    	};

    	$$self.$capture_state = () => ({ active, on_yes, yes, no });

    	$$self.$inject_state = $$props => {
    		if ('active' in $$props) $$invalidate(2, active = $$props.active);
    		if ('on_yes' in $$props) $$invalidate(3, on_yes = $$props.on_yes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [yes, no, active, on_yes];
    }

    class PrestigeModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { active: 2, on_yes: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PrestigeModal",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*on_yes*/ ctx[3] === undefined && !('on_yes' in props)) {
    			console.warn("<PrestigeModal> was created without expected prop 'on_yes'");
    		}
    	}

    	get active() {
    		throw new Error("<PrestigeModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<PrestigeModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get on_yes() {
    		throw new Error("<PrestigeModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set on_yes(value) {
    		throw new Error("<PrestigeModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Journal.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/components/Journal.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (21:2) {#if e.i <= $max_entry}
    function create_if_block_1(ctx) {
    	let h3;
    	let t0_value = /*e*/ ctx[4].str + "";
    	let t0;
    	let t1;
    	let hr;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			hr = element("hr");
    			attr_dev(h3, "class", "svelte-nzftlv");
    			add_location(h3, file$1, 21, 3, 1963);
    			add_location(hr, file$1, 22, 3, 1983);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:2) {#if e.i <= $max_entry}",
    		ctx
    	});

    	return block;
    }

    // (20:1) {#each entries.map((v, i)=>{ return {str: v, i: i}; }) as e}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*e*/ ctx[4].i <= /*$max_entry*/ ctx[1] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*e*/ ctx[4].i <= /*$max_entry*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(20:1) {#each entries.map((v, i)=>{ return {str: v, i: i}; }) as e}",
    		ctx
    	});

    	return block;
    }

    // (28:19) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("⇛");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(28:19) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:1) {#if out}
    function create_if_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("⇚");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(28:1) {#if out}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let main_id_value;
    	let t2;
    	let button;
    	let h3;
    	let button_id_value;
    	let mounted;
    	let dispose;
    	let each_value = /*entries*/ ctx[2].map(func);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*out*/ ctx[0]) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Wizard Journal!";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			h3 = element("h3");
    			if_block.c();
    			add_location(h1, file$1, 18, 1, 1847);
    			attr_dev(main, "id", main_id_value = /*out*/ ctx[0] ? "" : "hide");
    			attr_dev(main, "class", "svelte-nzftlv");
    			add_location(main, file$1, 17, 0, 1813);
    			add_location(h3, file$1, 26, 69, 2082);
    			attr_dev(button, "id", button_id_value = /*out*/ ctx[0] ? "" : "hide-button");
    			attr_dev(button, "class", "svelte-nzftlv");
    			add_location(button, file$1, 26, 0, 2013);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, h3);
    			if_block.m(h3, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*entries, $max_entry*/ 6) {
    				each_value = /*entries*/ ctx[2].map(func);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*out*/ 1 && main_id_value !== (main_id_value = /*out*/ ctx[0] ? "" : "hide")) {
    				attr_dev(main, "id", main_id_value);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(h3, null);
    				}
    			}

    			if (dirty & /*out*/ 1 && button_id_value !== (button_id_value = /*out*/ ctx[0] ? "" : "hide-button")) {
    				attr_dev(button, "id", button_id_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = (v, i) => {
    	return { str: v, i };
    };

    function instance$1($$self, $$props, $$invalidate) {
    	let $max_entry;
    	validate_store(max_entry, 'max_entry');
    	component_subscribe($$self, max_entry, $$value => $$invalidate(1, $max_entry = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Journal', slots, []);

    	const entries = [
    		"This journal is dedicated to you, Dad.",
    		`Ya' know, I'm starting to get a hang of this wizard stuff. I figured out that I can automatically create mana by summoning a "Mana-O-Matic". Not sure why it works, but it does...`,
    		`After a lot of research, I figured out how to multiply my Mana output. Basically, I rip a hole in spacetime and pull out my Mana's multiversal counterpart. Or, something like that. I'm a wizard, not a scientist!`,
    		`You like combos right? No, not the snack you buy at the gas station. Like, a combo in a video game? Well, I figured that out! Basically the same idea as the Mana multiplication I talked about before.`,
    		`"Sometimes you need to start over to realize how far you were," said the old guy that sold me this "Prestige-O-Matic" machine. Who even names these things?`,
    		`Power. I need more power. It's too tempting not to take over these weak people along with their planet. Don't worry, I'll leave your house alone Dad.`,
    		`I talked to the Gods. They gave me Ichor for the cores of the ruined planets I take over, but at a multi-universal cost.`,
    		`I did it! I've created my own realm. Now there can finally be a realm where politics aren't corrupt and pizza doesn't make you fat!`,
    		`Hey, Dad, guess where I am. Yep, you guessed it (probably). I'm at the counsel of The 9 Gods! I bought one of their seats (these guys are easy to bribe). You don't need to worry about bad harvests anymore!`,
    		`What is a universe to a man who's experienced everything. What is a life to a man that doesn't know what it means to live anymore? I can't start over, I can't prestige, I can't live, I can't die. To create, to destroy. To create destruction. Goodbye, Dad, I love you.`
    	];

    	let out = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Journal> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, out = !out);
    	$$self.$capture_state = () => ({ max_entry, entries, out, $max_entry });

    	$$self.$inject_state = $$props => {
    		if ('out' in $$props) $$invalidate(0, out = $$props.out);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [out, $max_entry, entries, click_handler];
    }

    class Journal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Journal",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    // (51:1) {#if power_modal_active}
    function create_if_block(ctx) {
    	let prestigemodal;
    	let updating_active;
    	let updating_on_yes;
    	let current;

    	function prestigemodal_active_binding(value) {
    		/*prestigemodal_active_binding*/ ctx[11](value);
    	}

    	function prestigemodal_on_yes_binding(value) {
    		/*prestigemodal_on_yes_binding*/ ctx[12](value);
    	}

    	let prestigemodal_props = {};

    	if (/*power_modal_active*/ ctx[2] !== void 0) {
    		prestigemodal_props.active = /*power_modal_active*/ ctx[2];
    	}

    	if (/*on_yes*/ ctx[3] !== void 0) {
    		prestigemodal_props.on_yes = /*on_yes*/ ctx[3];
    	}

    	prestigemodal = new PrestigeModal({
    			props: prestigemodal_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(prestigemodal, 'active', prestigemodal_active_binding));
    	binding_callbacks.push(() => bind(prestigemodal, 'on_yes', prestigemodal_on_yes_binding));

    	const block = {
    		c: function create() {
    			create_component(prestigemodal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(prestigemodal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const prestigemodal_changes = {};

    			if (!updating_active && dirty & /*power_modal_active*/ 4) {
    				updating_active = true;
    				prestigemodal_changes.active = /*power_modal_active*/ ctx[2];
    				add_flush_callback(() => updating_active = false);
    			}

    			if (!updating_on_yes && dirty & /*on_yes*/ 8) {
    				updating_on_yes = true;
    				prestigemodal_changes.on_yes = /*on_yes*/ ctx[3];
    				add_flush_callback(() => updating_on_yes = false);
    			}

    			prestigemodal.$set(prestigemodal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prestigemodal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prestigemodal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(prestigemodal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(51:1) {#if power_modal_active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let mana_1;
    	let updating_max_buy;
    	let updating_reset_mana;
    	let t0;
    	let div;
    	let t1;
    	let power;
    	let updating_max_buy_1;
    	let updating_do_prestige;
    	let updating_click_prestige;
    	let t2;
    	let t3;
    	let journal;
    	let current;

    	function mana_1_max_buy_binding(value) {
    		/*mana_1_max_buy_binding*/ ctx[6](value);
    	}

    	function mana_1_reset_mana_binding(value) {
    		/*mana_1_reset_mana_binding*/ ctx[7](value);
    	}

    	let mana_1_props = {};

    	if (/*max_buy*/ ctx[1] !== void 0) {
    		mana_1_props.max_buy = /*max_buy*/ ctx[1];
    	}

    	if (/*reset_mana*/ ctx[0] !== void 0) {
    		mana_1_props.reset_mana = /*reset_mana*/ ctx[0];
    	}

    	mana_1 = new Mana({ props: mana_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(mana_1, 'max_buy', mana_1_max_buy_binding));
    	binding_callbacks.push(() => bind(mana_1, 'reset_mana', mana_1_reset_mana_binding));

    	function power_max_buy_binding(value) {
    		/*power_max_buy_binding*/ ctx[8](value);
    	}

    	function power_do_prestige_binding(value) {
    		/*power_do_prestige_binding*/ ctx[9](value);
    	}

    	function power_click_prestige_binding(value) {
    		/*power_click_prestige_binding*/ ctx[10](value);
    	}

    	let power_props = {};

    	if (/*max_buy*/ ctx[1] !== void 0) {
    		power_props.max_buy = /*max_buy*/ ctx[1];
    	}

    	if (/*power_prestige*/ ctx[4] !== void 0) {
    		power_props.do_prestige = /*power_prestige*/ ctx[4];
    	}

    	if (/*click_power_prest*/ ctx[5] !== void 0) {
    		power_props.click_prestige = /*click_power_prest*/ ctx[5];
    	}

    	power = new Power({ props: power_props, $$inline: true });
    	binding_callbacks.push(() => bind(power, 'max_buy', power_max_buy_binding));
    	binding_callbacks.push(() => bind(power, 'do_prestige', power_do_prestige_binding));
    	binding_callbacks.push(() => bind(power, 'click_prestige', power_click_prestige_binding));
    	let if_block = /*power_modal_active*/ ctx[2] && create_if_block(ctx);
    	journal = new Journal({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(mana_1.$$.fragment);
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			create_component(power.$$.fragment);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			create_component(journal.$$.fragment);
    			attr_dev(div, "id", "border");
    			attr_dev(div, "class", "svelte-1lt8zeu");
    			add_location(div, file, 47, 1, 1004);
    			attr_dev(main, "class", "svelte-1lt8zeu");
    			add_location(main, file, 45, 0, 935);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(mana_1, main, null);
    			append_dev(main, t0);
    			append_dev(main, div);
    			append_dev(main, t1);
    			mount_component(power, main, null);
    			append_dev(main, t2);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t3);
    			mount_component(journal, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const mana_1_changes = {};

    			if (!updating_max_buy && dirty & /*max_buy*/ 2) {
    				updating_max_buy = true;
    				mana_1_changes.max_buy = /*max_buy*/ ctx[1];
    				add_flush_callback(() => updating_max_buy = false);
    			}

    			if (!updating_reset_mana && dirty & /*reset_mana*/ 1) {
    				updating_reset_mana = true;
    				mana_1_changes.reset_mana = /*reset_mana*/ ctx[0];
    				add_flush_callback(() => updating_reset_mana = false);
    			}

    			mana_1.$set(mana_1_changes);
    			const power_changes = {};

    			if (!updating_max_buy_1 && dirty & /*max_buy*/ 2) {
    				updating_max_buy_1 = true;
    				power_changes.max_buy = /*max_buy*/ ctx[1];
    				add_flush_callback(() => updating_max_buy_1 = false);
    			}

    			if (!updating_do_prestige && dirty & /*power_prestige*/ 16) {
    				updating_do_prestige = true;
    				power_changes.do_prestige = /*power_prestige*/ ctx[4];
    				add_flush_callback(() => updating_do_prestige = false);
    			}

    			if (!updating_click_prestige && dirty & /*click_power_prest*/ 32) {
    				updating_click_prestige = true;
    				power_changes.click_prestige = /*click_power_prest*/ ctx[5];
    				add_flush_callback(() => updating_click_prestige = false);
    			}

    			power.$set(power_changes);

    			if (/*power_modal_active*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*power_modal_active*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, t3);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mana_1.$$.fragment, local);
    			transition_in(power.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(journal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mana_1.$$.fragment, local);
    			transition_out(power.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(journal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(mana_1);
    			destroy_component(power);
    			if (if_block) if_block.d();
    			destroy_component(journal);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $mana;
    	let $ichor;
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(13, $mana = $$value));
    	validate_store(ichor, 'ichor');
    	component_subscribe($$self, ichor, $$value => $$invalidate(14, $ichor = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let max_buy = false;

    	document.body.onkeyup = e => {
    		const k = e.key;

    		k == "m"
    		? set_store_value(mana, $mana += 1e+6, $mana)
    		: k == "Shift"
    			? $$invalidate(1, max_buy = false)
    			: k == "i" ? set_store_value(ichor, $ichor++, $ichor) : 0;
    	};

    	document.body.onkeydown = e => {
    		const k = e.key;

    		k == "m"
    		? set_store_value(mana, $mana += 1e+6, $mana)
    		: k == "Shift" ? $$invalidate(1, max_buy = true) : 0;
    	};

    	let power_modal_active = false;

    	let on_yes = () => {
    		// Prestige all
    		if (power_prestige(true) > 0) {
    			power_prestige();
    			reset_mana();
    		}
    	};

    	let reset_mana;
    	let power_prestige;

    	let click_power_prest = () => {
    		$$invalidate(2, power_modal_active = true);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function mana_1_max_buy_binding(value) {
    		max_buy = value;
    		$$invalidate(1, max_buy);
    	}

    	function mana_1_reset_mana_binding(value) {
    		reset_mana = value;
    		$$invalidate(0, reset_mana);
    	}

    	function power_max_buy_binding(value) {
    		max_buy = value;
    		$$invalidate(1, max_buy);
    	}

    	function power_do_prestige_binding(value) {
    		power_prestige = value;
    		$$invalidate(4, power_prestige);
    	}

    	function power_click_prestige_binding(value) {
    		click_power_prest = value;
    		$$invalidate(5, click_power_prest);
    	}

    	function prestigemodal_active_binding(value) {
    		power_modal_active = value;
    		$$invalidate(2, power_modal_active);
    	}

    	function prestigemodal_on_yes_binding(value) {
    		on_yes = value;
    		$$invalidate(3, on_yes);
    	}

    	$$self.$capture_state = () => ({
    		Mana,
    		Power,
    		PrestigeModal,
    		Journal,
    		mana,
    		ichor,
    		max_buy,
    		power_modal_active,
    		on_yes,
    		reset_mana,
    		power_prestige,
    		click_power_prest,
    		$mana,
    		$ichor
    	});

    	$$self.$inject_state = $$props => {
    		if ('max_buy' in $$props) $$invalidate(1, max_buy = $$props.max_buy);
    		if ('power_modal_active' in $$props) $$invalidate(2, power_modal_active = $$props.power_modal_active);
    		if ('on_yes' in $$props) $$invalidate(3, on_yes = $$props.on_yes);
    		if ('reset_mana' in $$props) $$invalidate(0, reset_mana = $$props.reset_mana);
    		if ('power_prestige' in $$props) $$invalidate(4, power_prestige = $$props.power_prestige);
    		if ('click_power_prest' in $$props) $$invalidate(5, click_power_prest = $$props.click_power_prest);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*reset_mana*/ 1) {
    			{
    				if (typeof reset_mana == "function") reset_mana();
    			}
    		}
    	};

    	return [
    		reset_mana,
    		max_buy,
    		power_modal_active,
    		on_yes,
    		power_prestige,
    		click_power_prest,
    		mana_1_max_buy_binding,
    		mana_1_reset_mana_binding,
    		power_max_buy_binding,
    		power_do_prestige_binding,
    		power_click_prestige_binding,
    		prestigemodal_active_binding,
    		prestigemodal_on_yes_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    // Load up data from here?

    const app = new App({
    	target: document.body,
    	props: {
    		// name: name ?? 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
