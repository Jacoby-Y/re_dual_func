<script>
	import Mana from "./components/Mana.svelte";
	import Power from "./components/Power.svelte";
	import PrestigeModal from "./components/PrestigeModal.svelte";
	import Journal from "./components/Journal.svelte";

	import { mana, mana_click, mana_idle, mana_bonus, mana_combo, mana_prestige, power_progress, power, ichor, unlocked_ichor, power_cost, power_discount, planet_cores, realms, mana_ichor_bonus, gods, max_entry, started_time, ended_time, offline } from "./stores.js";
	
	$: window.power_progress = $power_progress;

	window.onbeforeunload = ()=>{
		localStorage["mana"] = JSON.stringify($mana);
		localStorage["mana_click"] = JSON.stringify($mana_click); 
		localStorage["mana_idle"] = JSON.stringify($mana_idle); 
		localStorage["mana_bonus"] = JSON.stringify($mana_bonus); 
		localStorage["mana_combo"] = JSON.stringify($mana_combo); 
		localStorage["mana_prestige"] = JSON.stringify($mana_prestige); 
		localStorage["power_progress"] = JSON.stringify($power_progress); 
		localStorage["power"] = JSON.stringify($power); 
		localStorage["ichor"] = JSON.stringify($ichor); 
		localStorage["unlocked_ichor"] = JSON.stringify($unlocked_ichor); 
		localStorage["power_cost"] = JSON.stringify($power_cost); 
		localStorage["power_discount"] = JSON.stringify($power_discount); 
		localStorage["planet_cores"] = JSON.stringify($planet_cores); 
		localStorage["realms"] = JSON.stringify($realms); 
		localStorage["mana_ichor_bonus"] = JSON.stringify($mana_ichor_bonus); 
		localStorage["gods"] = JSON.stringify($gods); 
		localStorage["max_entry"] = JSON.stringify($max_entry); 
		localStorage["started_time"] = JSON.stringify($started_time); 
		localStorage["ended_time"] = JSON.stringify($ended_time);
		localStorage["offline"] = JSON.stringify(Math.round(Date.now()/1000));
		// console.log(localStorage);
	};
	const total_offline = Math.round(Date.now()/1000) - $offline;
	$mana_prestige.seconds += total_offline;
	if ($mana_idle > 0) $mana += $mana_idle * total_offline;
	if ($realms > 0) $ichor += $realms * total_offline;
	if ($power > 0) $power_progress.val += $power * total_offline;

	let max_buy = false;

	/** @param {KeyboardEvent} e*/
	document.body.onkeyup = (e)=> { 
		const k = e.key;
		if (k == "Shift") max_buy = false
		if (k == "R") reset_all();
	}
	document.body.onkeydown = (e)=> { 
		const k = e.key;
		if (k == "Shift") max_buy = true;
		if (window.location.hostname == "localhost") {
			if (k == "m") $mana += 1e+7;
			else if (k == "i") $ichor += 1000;
			else if (k == "p") $planet_cores += 100;
		}
	}

	let power_modal_active = false;

	let on_yes = ()=>{
		// Prestige all
		if (power_prestige(true) > 0) {
			power_prestige();
			reset_mana();
		}
	}

	let reset_mana;
	let power_prestige;
	let click_power_prest = ()=>{
		power_modal_active = true;
	}

	const reset_all = ()=>{
		if (!window.confirm(`You are about to reset all of your progress.\nClick "Ok" to continue`)) return;
		window.onbeforeunload = ()=>{};
		localStorage.clear();
		window.location.reload();
	}
</script>

<main>
	<Mana bind:max_buy={max_buy} bind:reset_mana={reset_mana}/>
	<div id="border"></div>
	<Power bind:max_buy={max_buy} bind:do_prestige={power_prestige} bind:click_prestige={click_power_prest}/>
	
	{#if power_modal_active}
	<PrestigeModal bind:active={power_modal_active} bind:on_yes={on_yes}/>
	{/if}
	
	<Journal />
</main>

<style>
	main {
		border: 1px solid black;
		width: 1000px;
		height: 600px;
		position: absolute;
		left: 50%; top: 50%;
		transform: translate(-50%, -50%);

		display: grid;
		grid-template-columns: 1fr 1px 1fr;
	}
	#border {
		background-color: white;
	}
</style>