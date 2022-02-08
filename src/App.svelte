<script>
	// import { name } from "./stores.js";
	import Mana from "./components/Mana.svelte";
	import Power from "./components/Power.svelte";

</script>

<main>

	<Mana/>
	<div id="border"></div>
	<Power/>

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