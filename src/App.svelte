<script>
	// import { name } from "./stores.js";
	import Mana from "./components/Mana.svelte";
	import Power from "./components/Power.svelte";
	import PrestigeModal from "./components/PrestigeModal.svelte";
	import Journal from "./components/Journal.svelte";

	import { mana, ichor } from "./stores.js";

	let max_buy = false;

	document.body.onkeyup = (e)=> { 
		const k = e.key;
		; k == "m" ? $mana += 1e+6 
		: k == "Shift" ? max_buy = false
		: k == "i" ? $ichor++
		: 0;
	}
	document.body.onkeydown = (e)=> { 
		const k = e.key;
		; k == "m" ? $mana += 1e+6
		: k == "Shift" ? max_buy = true
		: 0;
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
	$: {
		if (typeof reset_mana == "function") reset_mana();
	}
	let power_prestige;
	let click_power_prest = ()=>{
		power_modal_active = true;
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