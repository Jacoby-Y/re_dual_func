//#region | Setup
import { writable } from "svelte/store";

const is_nullish = (val)=> ( val === undefined || val === "undefined" || val === null )
const get_or = (k, v)=> is_nullish(localStorage[k]) ? (localStorage[k] = v, v) : JSON.parse(localStorage[k]);

const w = (k, v)=>{
	// console.log(`key: ${k}, get_or: ${get_or(k, v)}`);
	to_store[k] = get_or(k, v);
	return writable(to_store[k]);
};

const to_store = {};
//#endregion

// export const name = writable(get_or("name", "joey"));
// name.subscribe((v)=> to_store.name = v);

//#region | Mana Stuffs
export let mana = w("mana", 0); //w(1e+8); //-! DEBUG VALUE | 
export let mana_click = w("mana_click", {
	cost: 50,
	val: 1,
});
export let mana_idle = w("mana_idle", {
	cost: 100,
	val: 0,
});
export let mana_bonus = w("mana_bonus", {
	cost: 1000,
	val: 0,
});
export let mana_combo = w("mana_combo", {
	unlock: 7500,
	unlocked: false,
	cost: 1000,
	val: 0,
});
export let mana_prestige = w("mana_prestige", {
	cost: 1e+6,
	times: 0,
	seconds: 0,
	fastest: Infinity,
});
//#endregion

//#region | Power Stuffs
export let power_progress = w("power_progress", {
	max: 1e+5,
	val: 0,
});
export let power = w("power", 0);
export let ichor = w("ichor", 0);
export let unlocked_ichor = w("unlocked_ichor", false);
export let power_cost = w("power_cost", 1e+3);
export let power_discount = w("power_discount", {
	amount: 0,
	cost: 2,
});
export let planet_cores = w("planet_cores", 0);
export let realms = w("realms", 0);
export let mana_ichor_bonus = w("mana_ichor_bonus", {
	amount: 0,
	cost: 1,
});
export let gods = w("gods", {
	bought: 0,
	cost: 100,
});
//#endregion

export const max_entry = w("max_entry", 0);
export const started_time = w("started_time", Math.round(Date.now()/1000));
export const ended_time = w("ended_time", 0);
export const offline = w("offline", Math.round(Date.now()/1000));

//#region | Post-Setup
// window.onbeforeunload = ()=>{
// 	Object.keys(to_store).forEach( key => {
// 		localStorage[key] = JSON.stringify(to_store[key]);
// 		console.log(`Key: ${key}, value: ${to_store[key]}`);
// 	});
// }
//#endregion