<script>
	// import { name } from "./stores.js";
	import Mana from "./components/Mana.svelte";
	import Power from "./components/Power.svelte";

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
		; k == "m" ? 0
		: k == "Shift" ? max_buy = true
		: 0;
	}

</script>

<main>

	<Mana bind:max_buy={max_buy}/>
	<div id="border"></div>
	<Power bind:max_buy={max_buy}/>

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