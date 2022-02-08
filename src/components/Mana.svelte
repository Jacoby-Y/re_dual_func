<script>
	import { mana, mana_click as per_click, mana_idle as idle, mana_bonus as bonus, mana_combo as combo } from "../stores.js";
	import { sci } from "../functions";

	//#region | Per Click
	const click = ()=> { $mana += $per_click.val; get_combo() };
	const per_click_buy = ()=>{
		if ($mana < $per_click.cost) return;
		$mana -= $per_click.cost;
		$per_click.cost = Math.ceil($per_click.cost * 1.15);
		$per_click.val++;
		$per_click = $per_click;
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
	}
	//#endregion

	//#region | Bonus
	let get_bonus = 0;
	$: get_bonus = ($bonus.val+1) *((Math.min(combo_perc, 100)*$combo.val)/100+1);
	const bonus_buy = ()=>{
		if ($mana < $bonus.cost) return;
		$mana -= $bonus.cost;
		$bonus.cost = Math.ceil($bonus.cost * 1.25);
		$bonus.val += 0.25;
		$bonus = $bonus;
	}
	//#endregion

	//#region | Combo
	let combo_perc = 0;
	const combo_loop = setInterval(() => {
		( combo_perc > 0 
			? combo_perc -= 1
			: ( combo_perc < 0 
				? combo_perc = 0 
				: 0 ));
	}, 250);

	const get_combo = ()=>{
		if (!$combo.unlocked) return;
		combo_perc++;
		if (combo_perc > 100) combo_perc = 105;
	}

	const combo_unlock = ()=>{
		if ($mana < $combo.unlock) return;
		$mana -= $combo.unlock;
		$combo.unlocked = true;
		$combo = $combo;
	}
	const combo_buy = ()=>{
		if ($mana < $combo.cost) return;
		$mana -= $combo.cost;
		$combo.cost = Math.round($combo.cost * 1.25);
		$combo.val++;
		$combo = $combo;
	}
	//#endregion

	//#region | Main
	let main_rows = 0;
	$: {
		let total = 2;
		if ($per_click.val > 1) (total++, console.log($per_click.val));
		if ($idle.val > 0) (total++, console.log($idle.val));
		if ($bonus.val > 0) (total++, console.log($bonus.val));
		main_rows = total;
	}
	//#endregion

	document.body.onkeyup = (e)=> (e.key == "m" ? $mana += 1e+6 : 0);

</script>

<!-- on:click={click_main} -->
<main style="grid-template-rows: repeat({main_rows}, max-content) 1fr repeat(1, max-content);">
	<h3 id="mana-txt">Mana: {sci($mana)}</h3>
	<button on:click={per_click_buy}>Base Mana/Click +1 <b>{sci($per_click.cost)} Mana</b></button>
	{#if $per_click.val > 1} <button on:click={idle_buy}>Base Mana/Sec +5 <b>{sci($idle.cost)} Mana</b></button> {/if}
	{#if $idle.val > 0} <button on:click={bonus_buy}>Bonus to Base Mana +25% <b>{sci($bonus.cost)} Mana</b></button> {/if}
	{#if $bonus.val > 0}
		{#if $combo.unlocked == false}
			<button on:click={combo_unlock}>Unlock Click Combo <b>{sci($combo.unlock)} Mana</b></button>
		{:else}
			<button on:click={combo_buy}>Combo Bonus +1% <b>{sci($combo.cost)} Mana</b></button>
		{/if}
	{/if}
	
	<div id="gap"></div>

	<button id="prestige">Prestige <b>( Coming Soon )</b></button>

	<div on:click={click} id="click"> <div id="combo" style="height: {Math.min(combo_perc, 100)}%;"></div> </div>

	<h3 id="info">
		{#if $bonus.val > 0} +{sci((get_bonus-1)*100)}% Efficiency<br> {/if}
		{#if $combo.unlocked} {sci(Math.min(combo_perc, 100)*$combo.val)}% Combo (+{$combo.val}%/Click)<br> {/if}
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
	#click:hover, button:hover { opacity: .85; }
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
</style>