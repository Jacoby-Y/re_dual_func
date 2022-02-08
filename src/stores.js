//#region | Setup
import { writable } from "svelte/store";

const is_nullish = (val)=> ( val === undefined || val === "undefined" || val === null )
const get_or = (k, v)=> is_nullish(localStorage[k]) ? (localStorage[k] = v, v) : JSON.parse(localStorage[k]);

const w = writable;

const to_store = {};
//#endregion

// export const name = writable(get_or("name", "joey"));
// name.subscribe((v)=> to_store.name = v);

export let mana = w(1000000);
export let mana_click = w({
	cost: 25,
	val: 1,
});
export let mana_idle = w({
	cost: 100,
	val: 0,
});
export let mana_bonus = w({
	cost: 1000,
	val: 0,
});
export let mana_combo = w({
	unlock: 7500,
	unlocked: false,
	cost: 1000,
	val: 1,
});

//#region | Post-Setup
window.onbeforeunload = ()=>{
	Object.keys(to_store).forEach( key => {
		localStorage[key] = JSON.stringify(to_store[key]);
		console.log(localStorage[key]);
	});
}
//#endregion