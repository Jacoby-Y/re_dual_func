<script>
	import { 
		mana, mana_prestige, mana_ichor_bonus,
		power_progress as prog, power, power_cost, power_discount as discount, cores, ichor, unlocked_ichor
	} from "../stores.js";
	import { round, floor, sci } from "../functions.js";
	
	const click = ()=>{
		if ($mana < $power_cost) return;
		if (max_buy) {
			let max = floor($mana / $power_cost, 0);
			$mana -= $power_cost * max;
			$power += max;
		} else {
			$power++;
			$mana -= $power_cost;
		}
	}

	$: {
		if ($unlocked_ichor == false) {
			if ($ichor > 0) $unlocked_ichor = true;
		}
	}

	//#region | Max Buy Stuff
	export let max_buy = false;

	let max_text = null;

	$: { // Max Buy Text
		if (max_text != null) {
			if (max_buy)
				max_text.style.display = "block";
			else
				max_text.style.display = "none";
		}
	}
	//#endregion
	//#region | Idle Stuff
	let bar_perc = 0;
	$: { // Bar Percentage
		// let log_prog = Math.log10($prog.val);
		bar_perc = Math.log10(Math.max(1, $prog.val)) / Math.log10($prog.max)*100; // Math.min(100, (isFinite(log_prog) ? log_prog : 0)/Math.log10($prog.max));
		if (bar_perc >= 100) {
			bar_perc = 100;
			$prog.val = 0;
			cores.update((v)=> (v.planet++, v));
		}
	}

	const power_loop = setInterval(() => {
		$prog.val += $power / 4;
		$prog = $prog;
	}, 250);
	//#endregion
	//#region | Prestige Stuff
	let next_ichor = 0;
	$: {
		next_ichor = $cores.planet * 1 + (0); // Other stuffs
	}

	const do_prestige = ()=>{
		prog.update(  v => (v.val = 0, v) );
		ichor.update( v => v + next_ichor );
		cores.update( v => (v.planet = 0, v.realm = 0, v.universe = 0, v) );
		power.set(0);
	};
	//#endregion 
	//#region | Ichor Upgrades
	const upgr1 = ()=>{ // Mana Efficiency
		if ($ichor < 1) return;
		$mana_ichor_bonus += 1;
		$ichor -= 1;
	}
	//#endregion 
</script>

<main>
{#if $mana_prestige.times >= 5 || true }
	<h3 id="power">Power: {sci($power)}</h3>
	<div id="power-bar"> <h3 id="core-info">Planet Cores: {$cores.planet}</h3> <div style="width: {round(bar_perc, 1)}%;"></div> <h3 id="perc">{round(bar_perc, 1)}%</h3> </div>

	<h3 id="power-cost">{sci(1e3 * (1 - $discount/100))} Mana -> 1 Power</h3>

	<div id="click" on:click={click}><h3 id="max" bind:this={max_text}>Buy Max</h3></div>

	<button id="prestige" on:click={do_prestige}>Prestige ( Turn cores into Ichor ) <b>+{next_ichor} Ichor</b></button>

	<div id="ichor-hover" style="{ $unlocked_ichor <= 0 ? "display: none;" : "" }"></div>
	<div id="ichor-menu">
		<h3 id="ichor-amount">Ichor: {$ichor}</h3>
		<button on:click={upgr1}>Mana Efficiency +1% <b>1 Ichor</b></button>
		<button>Power Cost -1% <b>2 Ichor</b></button>
	</div>
{:else}
	<div id="lock"></div>
{/if}
</main>

<style>
	main {
		background-color: #2f233f;
		position: relative;
		display: grid;
		grid-auto-rows: max-content;
		gap: 1rem;
	}
	#lock {
		background-image: url("../assets/lock.svg");
		position: absolute;
		left: 50%; top: 50%;
		transform: translate(-50%, -50%);
		width: 5rem; height: 5rem;
	}
	#power {
		color: #cca2ff;
		padding: 0.5rem 0.7rem;
	}
	#power-bar {
		background-color: blueviolet;
		height: 1.5rem;
		width: 80%;
		margin: 0 auto;
		position: relative;
	}
	#power-bar #core-info {
		color: #cca2ff;
		position: absolute;
		left: 50%;
		bottom: 100%;
		transform: translate(-50%, -0.5rem);
	}
	#power-bar div {
		position: absolute;
		left: 0;
		top: 0;
		width: 50%;
		height: 100%;
		background-color: #bb86fc;
	}
	#power-bar #perc {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		padding: 0.5rem 0.7rem;
		color: white;
	}
	#click #max {
		position: absolute;
		color: white;
		top: 50%;
		padding: 0.5rem 0.8rem;
		transform: translateY(-50%);
		font-size: 1rem;
		display: none;
	}
	#power-cost {
		color: #cca2ff;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	#click {
		position: absolute;
		background-color: #bb86fc;
		left: 0;
		top: 50%;
		transform: translate(0, -50%);
		height: 10rem;
		width: 5rem;
		clip-path: polygon(0 0, 100% 50%, 0 100%);
	}
	#click:hover, button:hover { opacity: .85; }
	#click:active, button:active { opacity: .7; }
	/* Button: #bb86fc */
	button b {
		float: right;
	}
	#prestige {
		position: absolute;
		bottom: 0;
		left: 0;
		width: calc(100% - 1rem);
		margin: 0.5rem;
		padding: 0.5rem 0.7rem;
		background-color: #c596ff;
		border: none;
		text-align: left;
	}

	#ichor-hover {
		position: absolute;
		top: 50%;
		right: 0;
		transform: translate(0, -50%);
		height: 5rem;
		width: 2rem;
		background-color: #bb86fc;
		border-top-left-radius: 1rem; border-bottom-left-radius: 1rem;
		border-left: 2px solid #ece036; border-top: 2px solid #f5ea54; border-bottom: 2px solid #d4ca39; 
	}
	#ichor-amount {
		color: black;
		padding-left: 0.2rem;
	}
	#ichor-menu {
		background-color: #fdffa2;
		position: absolute;
		top: 50%;
		transform: translate(100%, -50%);
		right: 0;
		padding: 0.5rem;
		border-top-left-radius: 0.5rem; border-bottom-left-radius: 0.5rem;
		border-left: 2px solid #ece036; border-top: 2px solid #f5ea54; border-bottom: 2px solid #d4ca39; 
		width: 50%;
		display: grid;
		transition-duration: 0.3s;
		gap: 0.5rem;
		clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
	}
	#ichor-menu button {
		background-color: #ffea30;
		margin: 0;
		font-size: 0.9rem;
		padding: 0.5rem 0.7rem;
		text-align: left;
	}
	#ichor-hover:hover + #ichor-menu, #ichor-menu:hover {
		transform:  translate(0, -50%);
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
	}
</style>