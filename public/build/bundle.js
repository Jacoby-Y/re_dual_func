
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
    let mana = w(1e+8); //-! DEBUG VALUE | w(0); //
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
    let power_discount = w(0);
    let cores = w({
    	planet: 0, // Worth 1 ichor
    	realm: 0, // Worth ?
    	universe: 0, // Worth ?
    	
    });
    let mana_ichor_bonus = w(0);
    //#endregion

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
    const file$2 = "src/components/Mana.svelte";

    // (178:2) {#if $per_click.val > 1}
    function create_if_block_8(ctx) {
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
    			add_location(b, file$2, 177, 72, 4558);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$2, 177, 27, 4513);
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
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(178:2) {#if $per_click.val > 1}",
    		ctx
    	});

    	return block;
    }

    // (180:2) {#if $idle.val > 0}
    function create_if_block_7(ctx) {
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
    			add_location(b, file$2, 179, 75, 4699);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$2, 179, 22, 4646);
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
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(180:2) {#if $idle.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (182:2) {#if $bonus.val > 0}
    function create_if_block_5(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*$combo*/ ctx[7].unlocked == false) return create_if_block_6;
    		return create_else_block$1;
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(182:2) {#if $bonus.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (185:3) {:else}
    function create_else_block$1(ctx) {
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
    			add_location(b, file$2, 185, 49, 4975);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$2, 185, 4, 4930);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(185:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (183:3) {#if $combo.unlocked == false}
    function create_if_block_6(ctx) {
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
    			add_location(b, file$2, 183, 55, 4873);
    			attr_dev(button, "class", "svelte-13k4gcl");
    			add_location(button, file$2, 183, 4, 4822);
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
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(183:3) {#if $combo.unlocked == false}",
    		ctx
    	});

    	return block;
    }

    // (194:2) {#if $bonus.val > 0}
    function create_if_block_4(ctx) {
    	let t0_value = sci(/*$bonus*/ ctx[3].val * 100) + "";
    	let t0;
    	let t1;
    	let br;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text("% Bonus Bonus");
    			br = element("br");
    			add_location(br, file$2, 193, 59, 5146);
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(194:2) {#if $bonus.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (195:2) {#if $combo.unlocked}
    function create_if_block_3(ctx) {
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
    			add_location(br, file$2, 194, 99, 5255);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(195:2) {#if $combo.unlocked}",
    		ctx
    	});

    	return block;
    }

    // (196:2) {#if $prestige.times > 0}
    function create_if_block_2(ctx) {
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
    			add_location(br, file$2, 195, 78, 5344);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(196:2) {#if $prestige.times > 0}",
    		ctx
    	});

    	return block;
    }

    // (197:2) {#if $mana_ichor_bonus > 0}
    function create_if_block_1(ctx) {
    	let t0;
    	let t1_value = sci(/*$mana_ichor_bonus*/ ctx[8]) + "";
    	let t1;
    	let t2;
    	let br;

    	const block = {
    		c: function create() {
    			t0 = text("* ");
    			t1 = text(t1_value);
    			t2 = text("% Ichor Bonus");
    			br = element("br");
    			add_location(br, file$2, 196, 69, 5423);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$mana_ichor_bonus*/ 256 && t1_value !== (t1_value = sci(/*$mana_ichor_bonus*/ ctx[8]) + "")) set_data_dev(t1, t1_value);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(197:2) {#if $mana_ichor_bonus > 0}",
    		ctx
    	});

    	return block;
    }

    // (205:2) {#if $bonus.val > 0}
    function create_if_block$1(ctx) {
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
    			add_location(br, file$2, 204, 60, 5869);
    			attr_dev(hr, "class", "svelte-13k4gcl");
    			add_location(hr, file$2, 204, 65, 5874);
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(205:2) {#if $bonus.val > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h30;
    	let t0;
    	let t1_value = sci(/*$mana*/ ctx[12]) + "";
    	let t1;
    	let t2;
    	let button0;
    	let t3;
    	let b0;
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
    	let button1;
    	let t15;
    	let t16_value = /*$prestige*/ ctx[6].seconds + "";
    	let t16;
    	let t17;

    	let t18_value = (isFinite(/*$prestige*/ ctx[6].fastest)
    	? /*$prestige*/ ctx[6].fastest + 's'
    	: "N/A") + "";

    	let t18;
    	let t19;
    	let b1;
    	let t20_value = sci(/*$prestige*/ ctx[6].cost) + "";
    	let t20;
    	let t21;
    	let t22;
    	let div2;
    	let h32;
    	let t24;
    	let div1;
    	let t25;
    	let h33;
    	let t26;
    	let t27_value = sci(/*get_per_click*/ ctx[9]) + "";
    	let t27;
    	let t28;
    	let br;
    	let t29;
    	let t30_value = sci(/*get_per_sec*/ ctx[10]) + "";
    	let t30;
    	let t31;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$per_click*/ ctx[5].val > 1 && create_if_block_8(ctx);
    	let if_block1 = /*$idle*/ ctx[4].val > 0 && create_if_block_7(ctx);
    	let if_block2 = /*$bonus*/ ctx[3].val > 0 && create_if_block_5(ctx);
    	let if_block3 = /*$bonus*/ ctx[3].val > 0 && create_if_block_4(ctx);
    	let if_block4 = /*$combo*/ ctx[7].unlocked && create_if_block_3(ctx);
    	let if_block5 = /*$prestige*/ ctx[6].times > 0 && create_if_block_2(ctx);
    	let if_block6 = /*$mana_ichor_bonus*/ ctx[8] > 0 && create_if_block_1(ctx);
    	let if_block7 = /*$bonus*/ ctx[3].val > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h30 = element("h3");
    			t0 = text("Mana: ");
    			t1 = text(t1_value);
    			t2 = space();
    			button0 = element("button");
    			t3 = text("Base Mana/Click +1 ");
    			b0 = element("b");
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
    			button1 = element("button");
    			t15 = text("Prestige ( ");
    			t16 = text(t16_value);
    			t17 = text("s | Best: ");
    			t18 = text(t18_value);
    			t19 = text(" ) ");
    			b1 = element("b");
    			t20 = text(t20_value);
    			t21 = text(" Mana");
    			t22 = space();
    			div2 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Buy Max";
    			t24 = space();
    			div1 = element("div");
    			t25 = space();
    			h33 = element("h3");
    			if (if_block7) if_block7.c();
    			t26 = space();
    			t27 = text(t27_value);
    			t28 = text(" Mana/Click");
    			br = element("br");
    			t29 = space();
    			t30 = text(t30_value);
    			t31 = text(" Mana/Sec");
    			attr_dev(h30, "id", "mana-txt");
    			attr_dev(h30, "class", "svelte-13k4gcl");
    			add_location(h30, file$2, 173, 2, 4290);
    			attr_dev(b0, "class", "svelte-13k4gcl");
    			add_location(b0, file$2, 175, 54, 4415);
    			attr_dev(button0, "class", "svelte-13k4gcl");
    			add_location(button0, file$2, 175, 2, 4363);
    			attr_dev(div0, "id", "gap");
    			add_location(div0, file$2, 190, 1, 5043);
    			attr_dev(h31, "id", "extra-info");
    			attr_dev(h31, "class", "svelte-13k4gcl");
    			add_location(h31, file$2, 192, 1, 5066);
    			attr_dev(b1, "class", "svelte-13k4gcl");
    			add_location(b1, file$2, 199, 149, 5590);
    			attr_dev(button1, "id", "prestige");
    			attr_dev(button1, "class", "svelte-13k4gcl");
    			add_location(button1, file$2, 199, 1, 5442);
    			attr_dev(h32, "id", "max");
    			attr_dev(h32, "class", "svelte-13k4gcl");
    			add_location(h32, file$2, 201, 35, 5669);
    			attr_dev(div1, "id", "combo");
    			set_style(div1, "height", Math.min(/*combo_perc*/ ctx[1], 100) + "%");
    			attr_dev(div1, "class", "svelte-13k4gcl");
    			add_location(div1, file$2, 201, 82, 5716);
    			attr_dev(div2, "id", "click");
    			attr_dev(div2, "class", "svelte-13k4gcl");
    			add_location(div2, file$2, 201, 1, 5635);
    			add_location(br, file$2, 205, 33, 5918);
    			attr_dev(h33, "id", "info");
    			attr_dev(h33, "class", "svelte-13k4gcl");
    			add_location(h33, file$2, 203, 1, 5794);
    			set_style(main, "grid-template-rows", "repeat(" + /*main_rows*/ ctx[11] + ", max-content) 1fr repeat(2, max-content)");
    			attr_dev(main, "class", "svelte-13k4gcl");
    			add_location(main, file$2, 171, 0, 4172);
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
    			append_dev(main, button0);
    			append_dev(button0, t3);
    			append_dev(button0, b0);
    			append_dev(b0, t4);
    			append_dev(b0, t5);
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
    			append_dev(main, button1);
    			append_dev(button1, t15);
    			append_dev(button1, t16);
    			append_dev(button1, t17);
    			append_dev(button1, t18);
    			append_dev(button1, t19);
    			append_dev(button1, b1);
    			append_dev(b1, t20);
    			append_dev(b1, t21);
    			append_dev(main, t22);
    			append_dev(main, div2);
    			append_dev(div2, h32);
    			/*h32_binding*/ ctx[21](h32);
    			append_dev(div2, t24);
    			append_dev(div2, div1);
    			append_dev(main, t25);
    			append_dev(main, h33);
    			if (if_block7) if_block7.m(h33, null);
    			append_dev(h33, t26);
    			append_dev(h33, t27);
    			append_dev(h33, t28);
    			append_dev(h33, br);
    			append_dev(h33, t29);
    			append_dev(h33, t30);
    			append_dev(h33, t31);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*per_click_buy*/ ctx[14], false, false, false),
    					listen_dev(button1, "click", /*do_prestige*/ ctx[19], false, false, false),
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
    					if_block0 = create_if_block_8(ctx);
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
    					if_block1 = create_if_block_7(ctx);
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
    					if_block2 = create_if_block_5(ctx);
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
    					if_block3 = create_if_block_4(ctx);
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
    					if_block4 = create_if_block_3(ctx);
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
    					if_block5 = create_if_block_2(ctx);
    					if_block5.c();
    					if_block5.m(h31, t13);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*$mana_ichor_bonus*/ ctx[8] > 0) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_1(ctx);
    					if_block6.c();
    					if_block6.m(h31, null);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (dirty & /*$prestige*/ 64 && t16_value !== (t16_value = /*$prestige*/ ctx[6].seconds + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*$prestige*/ 64 && t18_value !== (t18_value = (isFinite(/*$prestige*/ ctx[6].fastest)
    			? /*$prestige*/ ctx[6].fastest + 's'
    			: "N/A") + "")) set_data_dev(t18, t18_value);

    			if (dirty & /*$prestige*/ 64 && t20_value !== (t20_value = sci(/*$prestige*/ ctx[6].cost) + "")) set_data_dev(t20, t20_value);

    			if (dirty & /*combo_perc*/ 2) {
    				set_style(div1, "height", Math.min(/*combo_perc*/ ctx[1], 100) + "%");
    			}

    			if (/*$bonus*/ ctx[3].val > 0) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);
    				} else {
    					if_block7 = create_if_block$1(ctx);
    					if_block7.c();
    					if_block7.m(h33, t26);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (dirty & /*get_per_click*/ 512 && t27_value !== (t27_value = sci(/*get_per_click*/ ctx[9]) + "")) set_data_dev(t27, t27_value);
    			if (dirty & /*get_per_sec*/ 1024 && t30_value !== (t30_value = sci(/*get_per_sec*/ ctx[10]) + "")) set_data_dev(t30, t30_value);

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
    			/*h32_binding*/ ctx[21](null);
    			if (if_block7) if_block7.d();
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
    	let $bonus;
    	let $idle;
    	let $per_click;
    	let $prestige;
    	let $combo;
    	let $mana;
    	let $mana_ichor_bonus;
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Mana', slots, []);
    	let { max_buy } = $$props;

    	//#region | Per Click
    	const click = () => {
    		set_store_value(mana, $mana += get_per_click, $mana);
    		get_combo();
    	};

    	const per_click_buy = () => {
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
    			combo_perc > 0
    			? $$invalidate(1, combo_perc -= 1)
    			: combo_perc < 0 ? $$invalidate(1, combo_perc = 0) : 0;
    		},
    		250
    	);

    	const get_combo = () => {
    		if (!$combo.unlocked) return;
    		$$invalidate(1, combo_perc++, combo_perc);
    		if (combo_perc > 100) $$invalidate(1, combo_perc = 105);
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

    	const do_prestige = () => {
    		if ($mana < $prestige.cost) return;
    		set_store_value(mana, $mana = 2e+6, $mana); //-! DEBUG VALUE
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
    		do_prestige,
    		main_rows,
    		max_text,
    		$bonus,
    		$idle,
    		$per_click,
    		$prestige,
    		$combo,
    		$mana,
    		$mana_ichor_bonus
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
    			$$invalidate(0, get_bonus = (1 + ($bonus.val <= 0 ? 1 : $bonus.val) * (1 + Math.min(combo_perc, 100) * $combo.val / 100) * (1 + $prestige.times * 0.5)) * (1 + $mana_ichor_bonus / 100));
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
    		h32_binding
    	];
    }

    class Mana extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { max_buy: 20 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mana",
    			options,
    			id: create_fragment$2.name
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
    }

    /* src/components/Power.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/components/Power.svelte";

    // (96:0) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "lock");
    			attr_dev(div, "class", "svelte-1o6ywpv");
    			add_location(div, file$1, 96, 1, 2616);
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
    		id: create_else_block.name,
    		type: "else",
    		source: "(96:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (80:0) {#if $mana_prestige.times >= 5 || true }
    function create_if_block(ctx) {
    	let h30;
    	let t0;
    	let t1_value = sci(/*$power*/ ctx[6]) + "";
    	let t1;
    	let t2;
    	let div1;
    	let h31;
    	let t3;
    	let t4_value = /*$cores*/ ctx[3].planet + "";
    	let t4;
    	let t5;
    	let div0;
    	let t6;
    	let h32;
    	let t7_value = round(/*bar_perc*/ ctx[1], 1) + "";
    	let t7;
    	let t8;
    	let t9;
    	let h33;
    	let t10_value = sci(1e3 * (1 - /*$discount*/ ctx[8] / 100)) + "";
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
    	let t17;
    	let t18;
    	let t19;
    	let div3;
    	let div3_style_value;
    	let t20;
    	let div4;
    	let h35;
    	let t21;
    	let t22;
    	let t23;
    	let button1;
    	let t24;
    	let b1;
    	let t26;
    	let button2;
    	let t27;
    	let b2;
    	let mounted;
    	let dispose;

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
    			t17 = text(/*next_ichor*/ ctx[5]);
    			t18 = text(" Ichor");
    			t19 = space();
    			div3 = element("div");
    			t20 = space();
    			div4 = element("div");
    			h35 = element("h3");
    			t21 = text("Ichor: ");
    			t22 = text(/*$ichor*/ ctx[2]);
    			t23 = space();
    			button1 = element("button");
    			t24 = text("Mana Efficiency +1% ");
    			b1 = element("b");
    			b1.textContent = "1 Ichor";
    			t26 = space();
    			button2 = element("button");
    			t27 = text("Power Cost -1% ");
    			b2 = element("b");
    			b2.textContent = "2 Ichor";
    			attr_dev(h30, "id", "power");
    			attr_dev(h30, "class", "svelte-1o6ywpv");
    			add_location(h30, file$1, 80, 1, 1826);
    			attr_dev(h31, "id", "core-info");
    			attr_dev(h31, "class", "svelte-1o6ywpv");
    			add_location(h31, file$1, 81, 22, 1889);
    			set_style(div0, "width", round(/*bar_perc*/ ctx[1], 1) + "%");
    			attr_dev(div0, "class", "svelte-1o6ywpv");
    			add_location(div0, file$1, 81, 76, 1943);
    			attr_dev(h32, "id", "perc");
    			attr_dev(h32, "class", "svelte-1o6ywpv");
    			add_location(h32, file$1, 81, 126, 1993);
    			attr_dev(div1, "id", "power-bar");
    			attr_dev(div1, "class", "svelte-1o6ywpv");
    			add_location(div1, file$1, 81, 1, 1868);
    			attr_dev(h33, "id", "power-cost");
    			attr_dev(h33, "class", "svelte-1o6ywpv");
    			add_location(h33, file$1, 83, 1, 2043);
    			attr_dev(h34, "id", "max");
    			attr_dev(h34, "class", "svelte-1o6ywpv");
    			add_location(h34, file$1, 85, 34, 2152);
    			attr_dev(div2, "id", "click");
    			attr_dev(div2, "class", "svelte-1o6ywpv");
    			add_location(div2, file$1, 85, 1, 2119);
    			attr_dev(b0, "class", "svelte-1o6ywpv");
    			add_location(b0, file$1, 87, 81, 2287);
    			attr_dev(button0, "id", "prestige");
    			attr_dev(button0, "class", "svelte-1o6ywpv");
    			add_location(button0, file$1, 87, 1, 2207);
    			attr_dev(div3, "id", "ichor-hover");
    			attr_dev(div3, "style", div3_style_value = /*$unlocked_ichor*/ ctx[4] <= 0 ? "display: none;" : "");
    			attr_dev(div3, "class", "svelte-1o6ywpv");
    			add_location(div3, file$1, 89, 1, 2325);
    			attr_dev(h35, "id", "ichor-amount");
    			attr_dev(h35, "class", "svelte-1o6ywpv");
    			add_location(h35, file$1, 91, 2, 2436);
    			attr_dev(b1, "class", "svelte-1o6ywpv");
    			add_location(b1, file$1, 92, 47, 2526);
    			attr_dev(button1, "class", "svelte-1o6ywpv");
    			add_location(button1, file$1, 92, 2, 2481);
    			attr_dev(b2, "class", "svelte-1o6ywpv");
    			add_location(b2, file$1, 93, 25, 2575);
    			attr_dev(button2, "class", "svelte-1o6ywpv");
    			add_location(button2, file$1, 93, 2, 2552);
    			attr_dev(div4, "id", "ichor-menu");
    			attr_dev(div4, "class", "svelte-1o6ywpv");
    			add_location(div4, file$1, 90, 1, 2412);
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
    			/*h34_binding*/ ctx[14](h34);
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
    			append_dev(div4, t26);
    			append_dev(div4, button2);
    			append_dev(button2, t27);
    			append_dev(button2, b2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "click", /*click*/ ctx[9], false, false, false),
    					listen_dev(button0, "click", /*do_prestige*/ ctx[10], false, false, false),
    					listen_dev(button1, "click", /*upgr1*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$power*/ 64 && t1_value !== (t1_value = sci(/*$power*/ ctx[6]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$cores*/ 8 && t4_value !== (t4_value = /*$cores*/ ctx[3].planet + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*bar_perc*/ 2) {
    				set_style(div0, "width", round(/*bar_perc*/ ctx[1], 1) + "%");
    			}

    			if (dirty & /*bar_perc*/ 2 && t7_value !== (t7_value = round(/*bar_perc*/ ctx[1], 1) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*$discount*/ 256 && t10_value !== (t10_value = sci(1e3 * (1 - /*$discount*/ ctx[8] / 100)) + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*next_ichor*/ 32) set_data_dev(t17, /*next_ichor*/ ctx[5]);

    			if (dirty & /*$unlocked_ichor*/ 16 && div3_style_value !== (div3_style_value = /*$unlocked_ichor*/ ctx[4] <= 0 ? "display: none;" : "")) {
    				attr_dev(div3, "style", div3_style_value);
    			}

    			if (dirty & /*$ichor*/ 4) set_data_dev(t22, /*$ichor*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h33);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div2);
    			/*h34_binding*/ ctx[14](null);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(80:0) {#if $mana_prestige.times >= 5 || true }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;

    	function select_block_type(ctx, dirty) {
    		if (/*$mana_prestige*/ ctx[7].times >= 5 || true) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-1o6ywpv");
    			add_location(main, file$1, 78, 0, 1777);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $ichor;
    	let $mana_ichor_bonus;
    	let $cores;
    	let $prog;
    	let $power;
    	let $unlocked_ichor;
    	let $power_cost;
    	let $mana;
    	let $mana_prestige;
    	let $discount;
    	validate_store(ichor, 'ichor');
    	component_subscribe($$self, ichor, $$value => $$invalidate(2, $ichor = $$value));
    	validate_store(mana_ichor_bonus, 'mana_ichor_bonus');
    	component_subscribe($$self, mana_ichor_bonus, $$value => $$invalidate(15, $mana_ichor_bonus = $$value));
    	validate_store(cores, 'cores');
    	component_subscribe($$self, cores, $$value => $$invalidate(3, $cores = $$value));
    	validate_store(power_progress, 'prog');
    	component_subscribe($$self, power_progress, $$value => $$invalidate(13, $prog = $$value));
    	validate_store(power, 'power');
    	component_subscribe($$self, power, $$value => $$invalidate(6, $power = $$value));
    	validate_store(unlocked_ichor, 'unlocked_ichor');
    	component_subscribe($$self, unlocked_ichor, $$value => $$invalidate(4, $unlocked_ichor = $$value));
    	validate_store(power_cost, 'power_cost');
    	component_subscribe($$self, power_cost, $$value => $$invalidate(16, $power_cost = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(17, $mana = $$value));
    	validate_store(mana_prestige, 'mana_prestige');
    	component_subscribe($$self, mana_prestige, $$value => $$invalidate(7, $mana_prestige = $$value));
    	validate_store(power_discount, 'discount');
    	component_subscribe($$self, power_discount, $$value => $$invalidate(8, $discount = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Power', slots, []);

    	const click = () => {
    		if ($mana < $power_cost) return;

    		if (max_buy) {
    			let max = floor($mana / $power_cost, 0);
    			set_store_value(mana, $mana -= $power_cost * max, $mana);
    			set_store_value(power, $power += max, $power);
    		} else {
    			set_store_value(power, $power++, $power);
    			set_store_value(mana, $mana -= $power_cost, $mana);
    		}
    	};

    	let { max_buy = false } = $$props;
    	let max_text = null;

    	//#endregion
    	//#region | Idle Stuff
    	let bar_perc = 0;

    	const power_loop = setInterval(
    		() => {
    			set_store_value(power_progress, $prog.val += $power / 4, $prog);
    			power_progress.set($prog);
    		},
    		250
    	);

    	//#endregion
    	//#region | Prestige Stuff
    	let next_ichor = 0;

    	const do_prestige = () => {
    		power_progress.update(v => (v.val = 0, v));
    		ichor.update(v => v + next_ichor);
    		cores.update(v => (v.planet = 0, v.realm = 0, v.universe = 0, v));
    		power.set(0);
    	};

    	//#endregion 
    	//#region | Ichor Upgrades
    	const upgr1 = () => {
    		// Mana Efficiency
    		if ($ichor < 1) return;

    		set_store_value(mana_ichor_bonus, $mana_ichor_bonus += 1, $mana_ichor_bonus);
    		set_store_value(ichor, $ichor -= 1, $ichor);
    	};

    	const writable_props = ['max_buy'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Power> was created with unknown prop '${key}'`);
    	});

    	function h34_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			max_text = $$value;
    			($$invalidate(0, max_text), $$invalidate(12, max_buy));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('max_buy' in $$props) $$invalidate(12, max_buy = $$props.max_buy);
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
    		click,
    		max_buy,
    		max_text,
    		bar_perc,
    		power_loop,
    		next_ichor,
    		do_prestige,
    		upgr1,
    		$ichor,
    		$mana_ichor_bonus,
    		$cores,
    		$prog,
    		$power,
    		$unlocked_ichor,
    		$power_cost,
    		$mana,
    		$mana_prestige,
    		$discount
    	});

    	$$self.$inject_state = $$props => {
    		if ('max_buy' in $$props) $$invalidate(12, max_buy = $$props.max_buy);
    		if ('max_text' in $$props) $$invalidate(0, max_text = $$props.max_text);
    		if ('bar_perc' in $$props) $$invalidate(1, bar_perc = $$props.bar_perc);
    		if ('next_ichor' in $$props) $$invalidate(5, next_ichor = $$props.next_ichor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$unlocked_ichor, $ichor*/ 20) {
    			{
    				if ($unlocked_ichor == false) {
    					if ($ichor > 0) set_store_value(unlocked_ichor, $unlocked_ichor = true, $unlocked_ichor);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*max_text, max_buy*/ 4097) {
    			{
    				// Max Buy Text
    				if (max_text != null) {
    					if (max_buy) $$invalidate(0, max_text.style.display = "block", max_text); else $$invalidate(0, max_text.style.display = "none", max_text);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$prog, bar_perc*/ 8194) {
    			{
    				// Bar Percentage
    				// let log_prog = Math.log10($prog.val);
    				$$invalidate(1, bar_perc = Math.log10(Math.max(1, $prog.val)) / Math.log10($prog.max) * 100); // Math.min(100, (isFinite(log_prog) ? log_prog : 0)/Math.log10($prog.max));

    				if (bar_perc >= 100) {
    					$$invalidate(1, bar_perc = 100);
    					set_store_value(power_progress, $prog.val = 0, $prog);
    					cores.update(v => (v.planet++, v));
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$cores*/ 8) {
    			{
    				$$invalidate(5, next_ichor = $cores.planet * 1 + 0); // Other stuffs
    			}
    		}
    	};

    	return [
    		max_text,
    		bar_perc,
    		$ichor,
    		$cores,
    		$unlocked_ichor,
    		next_ichor,
    		$power,
    		$mana_prestige,
    		$discount,
    		click,
    		do_prestige,
    		upgr1,
    		max_buy,
    		$prog,
    		h34_binding
    	];
    }

    class Power extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { max_buy: 12 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Power",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get max_buy() {
    		throw new Error("<Power>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max_buy(value) {
    		throw new Error("<Power>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let mana_1;
    	let updating_max_buy;
    	let t0;
    	let div;
    	let t1;
    	let power;
    	let updating_max_buy_1;
    	let current;

    	function mana_1_max_buy_binding(value) {
    		/*mana_1_max_buy_binding*/ ctx[1](value);
    	}

    	let mana_1_props = {};

    	if (/*max_buy*/ ctx[0] !== void 0) {
    		mana_1_props.max_buy = /*max_buy*/ ctx[0];
    	}

    	mana_1 = new Mana({ props: mana_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(mana_1, 'max_buy', mana_1_max_buy_binding));

    	function power_max_buy_binding(value) {
    		/*power_max_buy_binding*/ ctx[2](value);
    	}

    	let power_props = {};

    	if (/*max_buy*/ ctx[0] !== void 0) {
    		power_props.max_buy = /*max_buy*/ ctx[0];
    	}

    	power = new Power({ props: power_props, $$inline: true });
    	binding_callbacks.push(() => bind(power, 'max_buy', power_max_buy_binding));

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(mana_1.$$.fragment);
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			create_component(power.$$.fragment);
    			attr_dev(div, "id", "border");
    			attr_dev(div, "class", "svelte-1lt8zeu");
    			add_location(div, file, 28, 1, 533);
    			attr_dev(main, "class", "svelte-1lt8zeu");
    			add_location(main, file, 25, 0, 492);
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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const mana_1_changes = {};

    			if (!updating_max_buy && dirty & /*max_buy*/ 1) {
    				updating_max_buy = true;
    				mana_1_changes.max_buy = /*max_buy*/ ctx[0];
    				add_flush_callback(() => updating_max_buy = false);
    			}

    			mana_1.$set(mana_1_changes);
    			const power_changes = {};

    			if (!updating_max_buy_1 && dirty & /*max_buy*/ 1) {
    				updating_max_buy_1 = true;
    				power_changes.max_buy = /*max_buy*/ ctx[0];
    				add_flush_callback(() => updating_max_buy_1 = false);
    			}

    			power.$set(power_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mana_1.$$.fragment, local);
    			transition_in(power.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mana_1.$$.fragment, local);
    			transition_out(power.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(mana_1);
    			destroy_component(power);
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
    	let $ichor;
    	let $mana;
    	validate_store(ichor, 'ichor');
    	component_subscribe($$self, ichor, $$value => $$invalidate(3, $ichor = $$value));
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(4, $mana = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let max_buy = false;

    	document.body.onkeyup = e => {
    		const k = e.key;

    		k == "m"
    		? set_store_value(mana, $mana += 1e+6, $mana)
    		: k == "Shift"
    			? $$invalidate(0, max_buy = false)
    			: k == "i" ? set_store_value(ichor, $ichor++, $ichor) : 0;
    	};

    	document.body.onkeydown = e => {
    		const k = e.key;

    		k == "m"
    		? 0
    		: k == "Shift" ? $$invalidate(0, max_buy = true) : 0;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function mana_1_max_buy_binding(value) {
    		max_buy = value;
    		$$invalidate(0, max_buy);
    	}

    	function power_max_buy_binding(value) {
    		max_buy = value;
    		$$invalidate(0, max_buy);
    	}

    	$$self.$capture_state = () => ({
    		Mana,
    		Power,
    		mana,
    		ichor,
    		max_buy,
    		$ichor,
    		$mana
    	});

    	$$self.$inject_state = $$props => {
    		if ('max_buy' in $$props) $$invalidate(0, max_buy = $$props.max_buy);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [max_buy, mana_1_max_buy_binding, power_max_buy_binding];
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
