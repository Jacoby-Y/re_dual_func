<script>
	export let active = false;
	export let on_yes;

	const yes = ()=>{
		active = false;
		on_yes();
	}
	const no = ()=>{
		active = false;
	}
</script>

<main>

	<h1>Total Prestige</h1>
	<h3>Prestiging this way will reset the entire game (besides Ichor upgrades) in exchange for Ichor.</h3>
	<h3 id="check">Are you sure you want to?</h3>

	<div id="choices">
		<button on:click={yes}>Yes!</button>
		<button on:click={no}>No...</button>
	</div>

</main>

<style>
	main {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		height: 35%;
		width: 50%;
		background-color: rgb(242, 215, 250); 

		padding: 0.5rem;
		display: grid;
		align-items: flex-start;
		justify-items: center;
		gap: 0;
	}
	h1, h3 {
		text-align: center;
		padding: 0.5rem;
	}
	#check {
		text-align: center;
	}
	#choices {
		width: 50%;
		display: grid;
		justify-content: center;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		padding-top: 0.5rem;
	}
	#choices button {
		background-color: #a567f1;
		color: white;
		font-weight: bold;
		margin: 0;
	}
	button:hover { opacity: .85; }
	button:active { opacity: .7; }
</style>