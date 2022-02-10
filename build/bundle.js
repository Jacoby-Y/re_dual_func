
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

    let mana = w(0);
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
    	val: 1,
    });
    let mana_prestige = w({
    	cost: 1e+6,
    	times: 0,
    });

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
    const sci = (num, place=1)=> num >= 1000 ? num.toExponential(place).replace("+", "") : round(num);

    /* src/components/Mana.svelte generated by Svelte v3.46.4 */
    const file$2 = "src/components/Mana.svelte";

    // (138:2) {#if $per_click.val > 1}
    function create_if_block_7(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$idle*/ ctx[3].cost) + "";
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
    			attr_dev(b, "class", "svelte-ub1r2g");
    			add_location(b, file$2, 137, 72, 3365);
    			attr_dev(button, "class", "svelte-ub1r2g");
    			add_location(button, file$2, 137, 27, 3320);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*idle_buy*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$idle*/ 8 && t1_value !== (t1_value = sci(/*$idle*/ ctx[3].cost) + "")) set_data_dev(t1, t1_value);
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
    		source: "(138:2) {#if $per_click.val > 1}",
    		ctx
    	});

    	return block;
    }

    // (140:2) {#if $idle.val > 0}
    function create_if_block_6(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$bonus*/ ctx[2].cost) + "";
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
    			attr_dev(b, "class", "svelte-ub1r2g");
    			add_location(b, file$2, 139, 75, 3506);
    			attr_dev(button, "class", "svelte-ub1r2g");
    			add_location(button, file$2, 139, 22, 3453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*bonus_buy*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$bonus*/ 4 && t1_value !== (t1_value = sci(/*$bonus*/ ctx[2].cost) + "")) set_data_dev(t1, t1_value);
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
    		source: "(140:2) {#if $idle.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (142:1) {#if $bonus.val > 0}
    function create_if_block_4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*$combo*/ ctx[6].unlocked == false) return create_if_block_5;
    		return create_else_block;
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(142:1) {#if $bonus.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (145:2) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$combo*/ ctx[6].cost) + "";
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
    			attr_dev(b, "class", "svelte-ub1r2g");
    			add_location(b, file$2, 145, 48, 3777);
    			attr_dev(button, "class", "svelte-ub1r2g");
    			add_location(button, file$2, 145, 3, 3732);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*combo_buy*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$combo*/ 64 && t1_value !== (t1_value = sci(/*$combo*/ ctx[6].cost) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(145:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (143:2) {#if $combo.unlocked == false}
    function create_if_block_5(ctx) {
    	let button;
    	let t0;
    	let b;
    	let t1_value = sci(/*$combo*/ ctx[6].unlock) + "";
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
    			attr_dev(b, "class", "svelte-ub1r2g");
    			add_location(b, file$2, 143, 54, 3677);
    			attr_dev(button, "class", "svelte-ub1r2g");
    			add_location(button, file$2, 143, 3, 3626);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, b);
    			append_dev(b, t1);
    			append_dev(b, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*combo_unlock*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$combo*/ 64 && t1_value !== (t1_value = sci(/*$combo*/ ctx[6].unlock) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(143:2) {#if $combo.unlocked == false}",
    		ctx
    	});

    	return block;
    }

    // (157:2) {#if $bonus.val > 0}
    function create_if_block_3(ctx) {
    	let t0;
    	let t1_value = sci((/*get_bonus*/ ctx[0] - 1) * 100) + "";
    	let t1;
    	let t2;
    	let br;

    	const block = {
    		c: function create() {
    			t0 = text("+");
    			t1 = text(t1_value);
    			t2 = text("% Efficiency");
    			br = element("br");
    			add_location(br, file$2, 156, 60, 4144);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*get_bonus*/ 1 && t1_value !== (t1_value = sci((/*get_bonus*/ ctx[0] - 1) * 100) + "")) set_data_dev(t1, t1_value);
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
    		source: "(157:2) {#if $bonus.val > 0}",
    		ctx
    	});

    	return block;
    }

    // (158:2) {#if $combo.unlocked}
    function create_if_block_1(ctx) {
    	let t0_value = sci(Math.min(/*combo_perc*/ ctx[1], 100) * /*$combo*/ ctx[6].val) + "";
    	let t0;
    	let t1;
    	let t2_value = /*$combo*/ ctx[6].val + "";
    	let t2;
    	let t3;
    	let br;
    	let t4;
    	let if_block_anchor;
    	let if_block = /*$prestige*/ ctx[5].times <= 0 && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text("% Combo (+");
    			t2 = text(t2_value);
    			t3 = text("%/Click)");
    			br = element("br");
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(br, file$2, 157, 97, 4252);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*combo_perc, $combo*/ 66 && t0_value !== (t0_value = sci(Math.min(/*combo_perc*/ ctx[1], 100) * /*$combo*/ ctx[6].val) + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$combo*/ 64 && t2_value !== (t2_value = /*$combo*/ ctx[6].val + "")) set_data_dev(t2, t2_value);

    			if (/*$prestige*/ ctx[5].times <= 0) {
    				if (if_block) ; else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(158:2) {#if $combo.unlocked}",
    		ctx
    	});

    	return block;
    }

    // (159:3) {#if $prestige.times <= 0}
    function create_if_block_2(ctx) {
    	let hr;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			attr_dev(hr, "class", "svelte-ub1r2g");
    			add_location(hr, file$2, 158, 29, 4287);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(159:3) {#if $prestige.times <= 0}",
    		ctx
    	});

    	return block;
    }

    // (160:2) {#if $prestige.times > 0}
    function create_if_block(ctx) {
    	let t0_value = sci(/*$prestige*/ ctx[5].times * 0.5 * 100) + "";
    	let t0;
    	let t1;
    	let br;
    	let t2;
    	let hr;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text("% Prestige Bonus");
    			br = element("br");
    			t2 = space();
    			hr = element("hr");
    			add_location(br, file$2, 159, 76, 4378);
    			attr_dev(hr, "class", "svelte-ub1r2g");
    			add_location(hr, file$2, 159, 81, 4383);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, hr, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$prestige*/ 32 && t0_value !== (t0_value = sci(/*$prestige*/ ctx[5].times * 0.5 * 100) + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(160:2) {#if $prestige.times > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let h30;
    	let t0;
    	let t1_value = sci(/*$mana*/ ctx[10]) + "";
    	let t1;
    	let t2;
    	let button0;
    	let t3;
    	let b0;
    	let t4_value = sci(/*$per_click*/ ctx[4].cost) + "";
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div0;
    	let t10;
    	let button1;
    	let t11;
    	let b1;
    	let t12_value = sci(/*$prestige*/ ctx[5].cost) + "";
    	let t12;
    	let t13;
    	let t14;
    	let div2;
    	let div1;
    	let t15;
    	let h31;
    	let t16;
    	let t17;
    	let t18;
    	let t19_value = sci(/*get_per_click*/ ctx[7]) + "";
    	let t19;
    	let t20;
    	let br;
    	let t21;
    	let t22_value = sci(/*get_per_sec*/ ctx[8]) + "";
    	let t22;
    	let t23;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$per_click*/ ctx[4].val > 1 && create_if_block_7(ctx);
    	let if_block1 = /*$idle*/ ctx[3].val > 0 && create_if_block_6(ctx);
    	let if_block2 = /*$bonus*/ ctx[2].val > 0 && create_if_block_4(ctx);
    	let if_block3 = /*$bonus*/ ctx[2].val > 0 && create_if_block_3(ctx);
    	let if_block4 = /*$combo*/ ctx[6].unlocked && create_if_block_1(ctx);
    	let if_block5 = /*$prestige*/ ctx[5].times > 0 && create_if_block(ctx);

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
    			button1 = element("button");
    			t11 = text("Prestige ");
    			b1 = element("b");
    			t12 = text(t12_value);
    			t13 = text(" Mana");
    			t14 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t15 = space();
    			h31 = element("h3");
    			if (if_block3) if_block3.c();
    			t16 = space();
    			if (if_block4) if_block4.c();
    			t17 = space();
    			if (if_block5) if_block5.c();
    			t18 = space();
    			t19 = text(t19_value);
    			t20 = text(" Mana/Click");
    			br = element("br");
    			t21 = space();
    			t22 = text(t22_value);
    			t23 = text(" Mana/Sec");
    			attr_dev(h30, "id", "mana-txt");
    			attr_dev(h30, "class", "svelte-ub1r2g");
    			add_location(h30, file$2, 133, 2, 3097);
    			attr_dev(b0, "class", "svelte-ub1r2g");
    			add_location(b0, file$2, 135, 54, 3222);
    			attr_dev(button0, "class", "svelte-ub1r2g");
    			add_location(button0, file$2, 135, 2, 3170);
    			attr_dev(div0, "id", "gap");
    			add_location(div0, file$2, 149, 1, 3835);
    			attr_dev(b1, "class", "svelte-ub1r2g");
    			add_location(b1, file$2, 151, 55, 3912);
    			attr_dev(button1, "id", "prestige");
    			attr_dev(button1, "class", "svelte-ub1r2g");
    			add_location(button1, file$2, 151, 1, 3858);
    			attr_dev(div1, "id", "combo");
    			set_style(div1, "height", Math.min(/*combo_perc*/ ctx[1], 100) + "%");
    			attr_dev(div1, "class", "svelte-ub1r2g");
    			add_location(div1, file$2, 153, 35, 3991);
    			attr_dev(div2, "id", "click");
    			attr_dev(div2, "class", "svelte-ub1r2g");
    			add_location(div2, file$2, 153, 1, 3957);
    			add_location(br, file$2, 160, 33, 4426);
    			attr_dev(h31, "id", "info");
    			attr_dev(h31, "class", "svelte-ub1r2g");
    			add_location(h31, file$2, 155, 1, 4069);
    			set_style(main, "grid-template-rows", "repeat(" + /*main_rows*/ ctx[9] + ", max-content) 1fr repeat(1, max-content)");
    			attr_dev(main, "class", "svelte-ub1r2g");
    			add_location(main, file$2, 131, 0, 2979);
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
    			append_dev(main, button1);
    			append_dev(button1, t11);
    			append_dev(button1, b1);
    			append_dev(b1, t12);
    			append_dev(b1, t13);
    			append_dev(main, t14);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			append_dev(main, t15);
    			append_dev(main, h31);
    			if (if_block3) if_block3.m(h31, null);
    			append_dev(h31, t16);
    			if (if_block4) if_block4.m(h31, null);
    			append_dev(h31, t17);
    			if (if_block5) if_block5.m(h31, null);
    			append_dev(h31, t18);
    			append_dev(h31, t19);
    			append_dev(h31, t20);
    			append_dev(h31, br);
    			append_dev(h31, t21);
    			append_dev(h31, t22);
    			append_dev(h31, t23);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*per_click_buy*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*do_prestige*/ ctx[17], false, false, false),
    					listen_dev(div2, "click", /*click*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$mana*/ 1024 && t1_value !== (t1_value = sci(/*$mana*/ ctx[10]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$per_click*/ 16 && t4_value !== (t4_value = sci(/*$per_click*/ ctx[4].cost) + "")) set_data_dev(t4, t4_value);

    			if (/*$per_click*/ ctx[4].val > 1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(main, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$idle*/ ctx[3].val > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					if_block1.m(main, t8);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*$bonus*/ ctx[2].val > 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					if_block2.m(main, t9);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*$prestige*/ 32 && t12_value !== (t12_value = sci(/*$prestige*/ ctx[5].cost) + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*combo_perc*/ 2) {
    				set_style(div1, "height", Math.min(/*combo_perc*/ ctx[1], 100) + "%");
    			}

    			if (/*$bonus*/ ctx[2].val > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_3(ctx);
    					if_block3.c();
    					if_block3.m(h31, t16);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*$combo*/ ctx[6].unlocked) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_1(ctx);
    					if_block4.c();
    					if_block4.m(h31, t17);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*$prestige*/ ctx[5].times > 0) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block(ctx);
    					if_block5.c();
    					if_block5.m(h31, t18);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (dirty & /*get_per_click*/ 128 && t19_value !== (t19_value = sci(/*get_per_click*/ ctx[7]) + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*get_per_sec*/ 256 && t22_value !== (t22_value = sci(/*get_per_sec*/ ctx[8]) + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*main_rows*/ 512) {
    				set_style(main, "grid-template-rows", "repeat(" + /*main_rows*/ ctx[9] + ", max-content) 1fr repeat(1, max-content)");
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
    	let $mana;
    	let $bonus;
    	let $idle;
    	let $per_click;
    	let $prestige;
    	let $combo;
    	validate_store(mana, 'mana');
    	component_subscribe($$self, mana, $$value => $$invalidate(10, $mana = $$value));
    	validate_store(mana_bonus, 'bonus');
    	component_subscribe($$self, mana_bonus, $$value => $$invalidate(2, $bonus = $$value));
    	validate_store(mana_idle, 'idle');
    	component_subscribe($$self, mana_idle, $$value => $$invalidate(3, $idle = $$value));
    	validate_store(mana_click, 'per_click');
    	component_subscribe($$self, mana_click, $$value => $$invalidate(4, $per_click = $$value));
    	validate_store(mana_prestige, 'prestige');
    	component_subscribe($$self, mana_prestige, $$value => $$invalidate(5, $prestige = $$value));
    	validate_store(mana_combo, 'combo');
    	component_subscribe($$self, mana_combo, $$value => $$invalidate(6, $combo = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Mana', slots, []);

    	const click = () => {
    		set_store_value(mana, $mana += $per_click.val, $mana);
    		get_combo();
    	};

    	const per_click_buy = () => {
    		if ($mana < $per_click.cost) return;
    		set_store_value(mana, $mana -= $per_click.cost, $mana);
    		set_store_value(mana_click, $per_click.cost = Math.ceil($per_click.cost * 1.15), $per_click);
    		set_store_value(mana_click, $per_click.val++, $per_click);
    		mana_click.set($per_click);
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
    	};

    	//#endregion
    	//#region | Bonus
    	let get_bonus = 0;

    	const bonus_buy = () => {
    		if ($mana < $bonus.cost) return;
    		set_store_value(mana, $mana -= $bonus.cost, $mana);
    		set_store_value(mana_bonus, $bonus.cost = Math.ceil($bonus.cost * 1.25), $bonus);
    		set_store_value(mana_bonus, $bonus.val += 0.25, $bonus);
    		mana_bonus.set($bonus);
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
    		mana_combo.set($combo);
    	};

    	const combo_buy = () => {
    		if ($mana < $combo.cost) return;
    		set_store_value(mana, $mana -= $combo.cost, $mana);
    		set_store_value(mana_combo, $combo.cost = Math.round($combo.cost * 1.25), $combo);
    		set_store_value(mana_combo, $combo.val++, $combo);
    		mana_combo.set($combo);
    	};

    	//#endregion
    	//#region | Prestige
    	const do_prestige = () => {
    		if ($mana < $prestige.cost) return;
    		set_store_value(mana, $mana = 0, $mana);
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
    	};

    	//#endregion
    	//#region | Main
    	let main_rows = 0;

    	//#endregion
    	document.body.onkeyup = e => e.key == "m"
    	? set_store_value(mana, $mana += 1e+6, $mana)
    	: 0;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Mana> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		mana,
    		per_click: mana_click,
    		idle: mana_idle,
    		bonus: mana_bonus,
    		combo: mana_combo,
    		prestige: mana_prestige,
    		sci,
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
    		do_prestige,
    		main_rows,
    		$mana,
    		$bonus,
    		$idle,
    		$per_click,
    		$prestige,
    		$combo
    	});

    	$$self.$inject_state = $$props => {
    		if ('get_per_click' in $$props) $$invalidate(7, get_per_click = $$props.get_per_click);
    		if ('deci' in $$props) deci = $$props.deci;
    		if ('get_per_sec' in $$props) $$invalidate(8, get_per_sec = $$props.get_per_sec);
    		if ('idle_loop' in $$props) idle_loop = $$props.idle_loop;
    		if ('get_bonus' in $$props) $$invalidate(0, get_bonus = $$props.get_bonus);
    		if ('combo_perc' in $$props) $$invalidate(1, combo_perc = $$props.combo_perc);
    		if ('main_rows' in $$props) $$invalidate(9, main_rows = $$props.main_rows);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$bonus, combo_perc, $combo, $prestige*/ 102) {
    			$$invalidate(0, get_bonus = ($bonus.val + 1) * (Math.min(combo_perc, 100) * $combo.val / 100 + 1) * (1 + $prestige.times * 0.5));
    		}

    		if ($$self.$$.dirty & /*$per_click, get_bonus*/ 17) {
    			$$invalidate(7, get_per_click = $per_click.val * get_bonus);
    		}

    		if ($$self.$$.dirty & /*$idle, get_bonus*/ 9) {
    			$$invalidate(8, get_per_sec = $idle.val * get_bonus);
    		}

    		if ($$self.$$.dirty & /*$per_click, $idle, $bonus*/ 28) {
    			{
    				let total = 2;
    				if ($per_click.val > 1) total++;
    				if ($idle.val > 0) total++;
    				if ($bonus.val > 0) total++;
    				$$invalidate(9, main_rows = total);
    			}
    		}
    	};

    	return [
    		get_bonus,
    		combo_perc,
    		$bonus,
    		$idle,
    		$per_click,
    		$prestige,
    		$combo,
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
    		do_prestige
    	];
    }

    class Mana extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mana",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Power.svelte generated by Svelte v3.46.4 */

    const file$1 = "src/components/Power.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			attr_dev(div, "id", "lock");
    			attr_dev(div, "class", "svelte-127g58i");
    			add_location(div, file$1, 5, 1, 30);
    			attr_dev(main, "class", "svelte-127g58i");
    			add_location(main, file$1, 4, 0, 22);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Power', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Power> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Power extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Power",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let mana;
    	let t0;
    	let div;
    	let t1;
    	let power;
    	let current;
    	mana = new Mana({ $$inline: true });
    	power = new Power({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(mana.$$.fragment);
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			create_component(power.$$.fragment);
    			attr_dev(div, "id", "border");
    			attr_dev(div, "class", "svelte-1lt8zeu");
    			add_location(div, file, 10, 1, 173);
    			attr_dev(main, "class", "svelte-1lt8zeu");
    			add_location(main, file, 7, 0, 155);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(mana, main, null);
    			append_dev(main, t0);
    			append_dev(main, div);
    			append_dev(main, t1);
    			mount_component(power, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mana.$$.fragment, local);
    			transition_in(power.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mana.$$.fragment, local);
    			transition_out(power.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(mana);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Mana, Power });
    	return [];
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
