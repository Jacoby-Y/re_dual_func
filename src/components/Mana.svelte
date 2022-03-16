<script>
	export let max_buy;

	import { mana, mana_click as per_click, mana_idle as idle, mana_bonus as bonus, mana_combo as combo, mana_prestige as prestige, mana_ichor_bonus } from "../stores.js";
	import { sci, fix_big_num } from "../functions";

	//#region | Per Click
	const click = ()=> { $mana += get_per_click; get_combo() };
	const per_click_buy = ()=>{
		if ($mana < $per_click.cost) return;
		$mana -= $per_click.cost;
		$per_click.cost = Math.ceil($per_click.cost * 1.15);
		$per_click.val++;
		$per_click = $per_click;

		if (max_buy) per_click_buy();
	}

	let get_per_click = 0;
	$: get_per_click = $per_click.val *get_bonus;

	// const click_main = (clicked)=>{
	// 	const t = clicked.target;
	// 	if (t.tagName.toLowerCase() == "button" || t.parentElement.tagName.toLowerCase() == "button") {
	// 		calc_click();
	// 	}
	// }

	let deci = 0;
	mana.subscribe((v)=>{
		if (Math.floor(v) != v) {
			deci += v - Math.floor(v);
			let add = 0;
			if (deci >= 1) {
				add = Math.floor(deci);
				deci -= Math.floor(deci);
			}
			$mana = Math.floor(v) + add;
		}
	});
	
	//#endregion

	//#region | Idle
	let get_per_sec = $idle.val; 
	$: get_per_sec = $idle.val *get_bonus;
	let idle_loop = setInterval(() => {
		$mana += get_per_sec/5;
	}, 200);
	const idle_buy = ()=>{
		if ($mana < $idle.cost) return;
		$mana -= $idle.cost;
		$idle.cost = Math.ceil($idle.cost * 1.15);
		$idle.val += 5;
		$idle = $idle;

		if (max_buy) idle_buy();
	}
	//#endregion

	//#region | Bonus
	let get_bonus = 0;
	$: get_bonus = ((($bonus.val <= 0 ? 1 : 1 + $bonus.val) * (1 + (Math.min(combo_perc, 100) * $combo.val)/100)) * (1 + $prestige.times * 0.5)) * (1 + $mana_ichor_bonus/100);
	// $: console.log(get_bonus);
	// p1 * p2 * p3 | bonus * combo * prestige
	// $: console.log(`1 + (${$bonus.val <= 0 ? 1 : $bonus.val} * ${1 + (Math.min(combo_perc, 100) * $combo.val)/100}) * ${1 + $prestige.times * 0.5}`)
	// $: console.log(`Total bonus: ${get_bonus}, bonus.val: ${$bonus.val}, combo_perc: ${combo_perc}, combo.val: ${$combo.val}, prestige.times: ${$prestige.times}`);
	// $: get_bonus = 1 + $bonus.val;
	const bonus_buy = ()=>{
		if ($mana < $bonus.cost) return;
		$mana -= $bonus.cost;
		$bonus.cost = Math.ceil($bonus.cost * 1.25);
		$bonus.val += 0.25;
		$bonus = $bonus;

		if (max_buy) bonus_buy();
	}
	//#endregion

	//#region | Combo
	let combo_perc = 0;
	const combo_loop = setInterval(() => {
		if (combo_perc >= 0) combo_perc -= 1;
		if (combo_perc < 0) combo_perc = 0
	}, 333);

	const get_combo = ()=>{
		if (!$combo.unlocked) return;
		combo_perc++;
		if (combo_perc > 100) combo_perc = 120;
	}

	const combo_unlock = ()=>{
		if ($mana < $combo.unlock) return;
		$mana -= $combo.unlock;
		$combo.unlocked = true;
		$combo.val = 1;
		$combo = $combo;
	}
	const combo_buy = ()=>{
		if ($mana < $combo.cost) return;
		$mana -= $combo.cost;
		$combo.cost = Math.round($combo.cost * 1.25);
		$combo.val++;
		$combo = $combo;

		if (max_buy) combo_buy();
	}
	//#endregion

	//#region | Prestige
	
	const prest_loop = setInterval(() => {
		$prestige.seconds++;
	}, 1000);

	export const reset_mana = ()=>{
		$mana = 0;
		per_click.update(v => (v.cost = 25, v.val = 1, v));
		idle.update(v => (v.cost = 100, v.val = 0, v));
		bonus.update(v => (v.cost = 1000, v.val = 0, v));
		combo.update(v => (v.cost = 1000, v.val = 0, v.unlocked = false, v.unlock = 7500, v));
		prestige.update(v => (v.cost = 1e+6, v.times = 0, v));

	}

	const do_prestige = ()=>{
		if ($mana < $prestige.cost) return;
		$mana = 0; //2e+6; //-! DEBUG VALUE
		$per_click.cost = 25;
		$per_click.val = 1;
		$idle.cost = 100;
		$idle.val = 0;
		$bonus.cost = 1000;
		$bonus.val = 0;
		$combo.unlocked = false;
		$combo.cost = 1000;
		$combo.val = 0;
		combo_perc = 0;
		$prestige.times++;

		$prestige.cost *= 1.2;
		$prestige.cost = fix_big_num($prestige.cost, 1);

		if ($prestige.seconds < $prestige.fastest) $prestige.fastest = $prestige.seconds;
		$prestige.seconds = 0;

		// console.log(`mana: ${$mana}, prest cost: ${$prestige.cost}`);
	}
	//#endregion

	//#region | Main
	let main_rows = 0;
	$: {
		let total = 2;
		if ($per_click.val > 1) total++;
		if ($idle.val > 0) total++;
		if ($bonus.val > 0) total++;
		main_rows = total;
	}
	//#endregion

	// $: console.log($mana);
	// $: console.log("Max buying: " + max_buy);

	let max_text = null;
	$: {
		if (max_text != null) {
			if (max_buy)
				max_text.style.display = "block";
			else 
				max_text.style.display = "none";
		}
	}

</script>

<!-- on:click={click_main} -->
<main style="grid-template-rows: repeat({main_rows}, max-content) 1fr repeat(2, max-content);">
	<!-- Mana Text -->
		<h3 id="mana-txt">Mana: {sci($mana)}</h3>
	<!-- Upgrade Mana/Click -->
		<button on:click={per_click_buy}>Base Mana/Click +1 <b>{sci($per_click.cost)} Mana</b></button>
	<!-- Upgrade Mana/Sec -->
		{#if $per_click.val > 1} <button on:click={idle_buy}>Base Mana/Sec +5 <b>{sci($idle.cost)} Mana</b></button> {/if}
	<!-- Bonus Mana -->
		{#if $idle.val > 0} <button on:click={bonus_buy}>Bonus to Base Mana +25% <b>{sci($bonus.cost)} Mana</b></button> {/if}
	<!-- Combo -->
		{#if $bonus.val > 0}
			{#if $combo.unlocked == false}
				<button on:click={combo_unlock}>Unlock Click Combo <b>{sci($combo.unlock)} Mana</b></button>
			{:else}
				<button on:click={combo_buy}>Combo Bonus +1% <b>{sci($combo.cost)} Mana</b></button>
			{/if}
		{/if}
	<!---->

	<div id="gap"></div>

	<h3 id="extra-info">
		{#if $bonus.val > 0} {sci(($bonus.val)*100)}% Bonus Bonus<br>{/if}
		{#if $combo.unlocked} * {sci(Math.min(combo_perc, 100)*$combo.val)}% Combo (+{$combo.val}%/Click)<br> {/if}
		{#if $prestige.times > 0} * {sci(($prestige.times*0.5)*100)}% Prestige Bonus<br>{/if}
		{#if $mana_ichor_bonus > 0} * {sci($mana_ichor_bonus)}% Ichor Bonus<br>{/if}
	</h3>

	{#if $prestige.times > 0 || $combo.unlocked} <button id="prestige" on:click={do_prestige}>Prestige ( {$prestige.seconds}s | Best: {isFinite($prestige.fastest)? $prestige.fastest+'s' : "N/A"} ) <b>{sci($prestige.cost)} Mana</b></button> {/if}

	<div on:click={click} id="click"> <h3 id="max" bind:this={max_text}>Buy Max</h3> <div id="combo" style="height: {Math.min(combo_perc, 100)}%;"></div> </div>

	<h3 id="info">
		{#if $bonus.val > 0} +{sci(get_bonus*100-100)}% Efficiency<br> <hr> {/if}
		{sci(get_per_click)} Mana/Click<br>
		{sci(get_per_sec)} Mana/Sec
	</h3>
</main>

<style>
	main {
		position: relative;
		background-color: #01312c;
		padding: 0.5rem;
		display: grid;
		gap: 0.5rem;
		/* grid-template-rows: repeat(5, max-content) 1fr repeat(1, max-content); */
		/* grid-auto-rows: max-content; */
	}

	button {
		margin: 0;
		padding: 0.5rem 0.7rem;
		background-color: #03dac6;
		border: none;
		text-align: left;
		/* border-radius: 0; */
	} button b { float: right; }

	#mana-txt {
		padding-left: 0.2rem;
		color: #03dac6;
	}
	#info {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #03dac6;
		font-weight: normal;
		text-align: center;
		line-height: 1.5rem;
	}
	#info hr {
		border-color: aqua;
		margin: 0.5rem;
	}
	#extra-info {
		color: #03dac6;
		font-weight: normal;
		padding: 0 0.5rem;
	}

	#click {
		position: absolute;
		transform: translate(0, -50%);
		top: 50%;
		right: 0;
		width: 5rem;
		height: 10rem;
		clip-path: polygon(0 50%, 100% 100%, 100% 0);
		background-color: #03dac6;
	}
	#click:hover,  button:hover { opacity: .85; }
	#click:active, button:active { opacity: .7; }

	#combo {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 0%;
		background-color: #008cff66;
	}

	#prestige {
		align-self: end;
	}

	#max {
		position: absolute;
		top: 50%;
		left: 63%;
		transform: translate(-50%, -50%);
		font-size: 1rem;
	}
</style>
