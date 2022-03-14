//#region | Setup
import { writable } from "svelte/store";

const is_nullish = (val)=> ( val === undefined || val === "undefined" || val === null )
const get_or = (k, v)=> is_nullish(localStorage[k]) ? (localStorage[k] = v, v) : JSON.parse(localStorage[k]);

const w = writable;

const to_store = {};
//#endregion

// export const name = writable(get_or("name", "joey"));
// name.subscribe((v)=> to_store.name = v);

//#region | Mana Stuffs
export let mana = w(1e+8); //-! DEBUG VALUE | w(0); //
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
	val: 0,
});
export let mana_prestige = w({
	cost: 1e+6,
	times: 0,
	seconds: 0,
	fastest: Infinity,
});
//#endregion

//#region | Power Stuffs
export let power_progress = w({
	max: 1e+5,
	val: 0,
});
export let power = w(0);
export let ichor = w(0);
export let unlocked_ichor = w(false);
export let power_cost = w(1e+3);
export let power_discount = w(0);
export let cores = w({
	planet: 0, // Worth 1 ichor
	realm: 0, // Worth ?
	universe: 0, // Worth ?
	
});
export let mana_ichor_bonus = w(0);
//#endregion

//#region | Post-Setup
window.onbeforeunload = ()=>{
	Object.keys(to_store).forEach( key => {
		localStorage[key] = JSON.stringify(to_store[key]);
		console.log(localStorage[key]);
	});
}
//#endregion