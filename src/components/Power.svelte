<script>
	import { 
		mana, mana_prestige, mana_ichor_bonus, max_entry,
		gods, power_progress as prog, power, power_cost, power_discount as discount, planet_cores as cores, realms, ichor, unlocked_ichor,
		ended_time, started_time
	} from "../stores.js";
	import { round, floor, sci, format_seconds } from "../functions.js";
	
	let cost = 0;
	$: cost = $power_cost * (1-$discount.amount/100);

	const click = ()=>{
		if ($mana <= cost) return;
		if ($max_entry == 4) $max_entry = 5;
		if (max_buy) {
			let max = floor($mana / cost, 0);
			$mana -= cost * max;
			$power += max;
		} else {
			$power++;
			$mana -= cost;
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
			prog.update(v => (v.val -= v.max, v.max = round(v.max * 1.1), v));
			$cores++;
		}
	}

	const power_loop = setInterval(() => {
		$prog.val += $power / 10;
		prog.update( v => (v.val += $power / 10, v));
		$prog = $prog;
	}, 1000/10);
	//#endregion
	//#region | Prestige Stuff
	let next_ichor = 0;
	$: {
		next_ichor = $cores * 1 + (0); // Other stuffs
	}

	export const do_prestige = (check_next)=>{
		if (check_next) 
			return next_ichor;
		if ($max_entry == 5) $max_entry = 6;
		prog.update(  v => (v.val = 0, v.max = 1e5, v) );
		ichor.update( v => v + next_ichor );
		cores.set(0);
		power.set(0);
	};
	export let click_prestige;
	//#endregion 
	//#region | Ichor Upgrades
	const upgr1 = ()=>{ // Mana Efficiency
		if ($ichor < $mana_ichor_bonus.cost) return;
		$ichor -= $mana_ichor_bonus.cost;
		mana_ichor_bonus.update( v => (v.amount++, v.cost++, v));
		if (max_buy) upgr1();
	}
	const upgr2 = ()=>{ // Mana Efficiency
		if ($ichor < $discount.cost || $discount.amount >= 99) return;
		$ichor -= $discount.cost;
		discount.update( v => (v.amount++, v.cost += 2, v));
		if (max_buy) upgr2();
	}
	//#endregion 
	//#region | Realm Creation
	const create_realm = ()=>{
		if ($cores < 50) return;
		if ($max_entry == 6) $max_entry = 7;
		$cores -= 50;
		$realms++;
		if (max_buy) create_realm();
	}
	setInterval(() => ($realms > 0 ? $ichor += $realms : undefined), 1000);
	//#endregion
	//#region | The 9 Gods
	const nth_place = {
		1: 'Final',
		2: '2nd',
		3: '3rd',
		4: '4th',
		5: '5th',
		6: '6th',
		7: '7th',
		8: '8th',
		9: '9th',
	};
	const buy_god = ()=>{
		if ($gods.bought >= 9) return;
		if ($ichor < $gods.cost) return;
		$max_entry = 8;
		$ichor -= $gods.cost;
		gods.update(v => (v.cost *= 2, v.bought++, v));
		if ($gods.bought >= 9) {
			$max_entry = 9;
			$ended_time = round(Date.now()/1000, 0);
		}
	}

	//#endregion
</script>

<main>
{#if $mana_prestige.times >= 5 || $unlocked_ichor }
	<h3 id="power">Power: {sci($power)}</h3>
	<div id="power-bar"> <h3 id="core-info">Planet Cores: {$cores}</h3> <div style="width: {round(bar_perc, 1)}%;"></div> <h3 id="perc">{round(bar_perc, 1)}%</h3> </div>

	<h3 id="power-cost">{sci(cost)} Mana -> 1 Power</h3>

	<div id="click" on:click={click}><h3 id="max" bind:this={max_text}>Buy Max</h3></div>

	<button id="prestige" on:click={click_prestige}>Prestige ( Turn cores into Ichor ) <b>+{sci(next_ichor)} Ichor</b></button>

	<!-- Win Game Info -->
	{#if $gods.bought >= 9}
		<h3 id="end-game-info">You beat the game in {format_seconds($ended_time - $started_time, false)}.<br>Do "Shift + R" to restart</h3>
	{/if}

	{#if $unlocked_ichor}<button id="make-realm" on:click={create_realm}>
		<b>Create a Realm for 50 Planet Cores</b>
		{#if $realms <= 0}<br>(Idle Ichor production){/if}
	</button>{/if}
	{#if $realms > 0}<h3 id="idle-ichor">+{$realms} Ichor/Sec</h3>{/if}
	<div id="ichor-hover" style="{ $unlocked_ichor <= 0 ? "display: none;" : "" }"></div>
	<div id="ichor-menu">
		<h3 id="ichor-amount">Ichor: {sci($ichor)}</h3>
		<button on:click={upgr1}>Mana Efficiency +1% <b>{$mana_ichor_bonus.cost} Ichor</b></button>
		<button on:click={upgr2}>Power Cost -1% <b>{$discount.amount < 99 ? $discount.cost + " Ichor" : "Max"}</b></button>
		<button on:click={buy_god}>
			{#if $gods.bought < 9}
				Buy The {nth_place[9-$gods.bought]} God's seat <b>{sci($gods.cost)} Ichor</b>
			{:else}
				You own the universe!
			{/if}
		</button>
	</div>

	{#if $discount.amount > 0} <h3 id="discount-info">Cost Discount: -{$discount.amount}%</h3> {/if}
{:else}
	<div id="lock">
		<h3 id="prest-info">Prestige {5 - $mana_prestige.times} more times</h3>
	</div>
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
		left: 50%; top: calc(50% - 0.5rem);
		transform: translate(-50%, -50%);
		width: 5rem; height: 5rem;
	}
	#prest-info {
		position: absolute;
		left: 50%;
		top: 100%;
		transform: translate(-50%, 0);
		width: max-content;
		color: #cca2ff;
		padding: 0.5rem 0.7rem;
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
	#click:hover,  button:hover { opacity: .85; }
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
		width: 60%;
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

	#discount-info {
		position: absolute;
		left: 1rem;
		bottom: 3.2rem;
		color: #cca2ff;
		font-weight: normal;
	}

	#make-realm {
		position: absolute;
		top: 30%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: max-content;
		background-color: #c596ff;
		/* font-weight: bold; */
		padding: 0.5rem 0.7rem;
		/* border: 2px solid #9c6fd3; */
		border: none;
	}
	#idle-ichor {
		position: absolute;
		right: 1rem;
		bottom: 3.2rem;
		color: #cca2ff;
	}

	#end-game-info {
		position: absolute;
		bottom: 30%;
		left: 50%;
		transform: translate(-50%, 50%);
		color: #cca2ff;
		text-align: center;
		font-weight: normal;
		width: max-content;
	}
</style>