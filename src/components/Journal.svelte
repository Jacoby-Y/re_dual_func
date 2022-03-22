<script>
	import { max_entry } from "../stores";
	const entries = [
		/* 0 */ "This journal is dedicated to you, Dad.",
		/* 1 */ `Ya' know, I'm starting to get a hang of this wizard stuff. I figured out that I can automatically create mana by summoning a "Mana-O-Matic". Not sure why it works, but it does...`,
		/* 2 */ `After a lot of research, I figured out how to multiply my Mana output. Basically, I rip a hole in spacetime and pull out my Mana's multiversal counterpart. Or, something like that. I'm a wizard, not a scientist!`,
		/* 3 */ `You like combos right? No, not the snack you buy at the gas station. Like, a combo in a video game? Well, I figured that out! Basically the same idea as the Mana multiplication I talked about before.`,
		/* 4 */ `"Sometimes you need to start over to realize how far you were," said the old guy that sold me this "Prestige-O-Matic" machine. Who even names these things?`,
		/* 5 */ `Power. I need more power. It's too tempting not to take over these weak people along with their planet. Don't worry, I'll leave your house alone Dad.`,
		/* 6 */ `I talked to the Gods. They gave me Ichor for the cores of the ruined planets I take over, but at a multi-universal cost.`,
		/* 7 */ `I did it! I've created my own realm. Now there can finally be a realm where politics aren't corrupt and pizza doesn't make you fat!`,
		/* 8 */ `Hey, Dad, guess where I am. Yep, you guessed it (probably). I'm at the counsel of The 9 Gods! I bought one of their seats (these guys are easy to bribe). You don't need to worry about bad harvests anymore!`,
		/* 9 */ `What is a universe to a man who's experienced everything. What is a life to a man that doesn't know what it means to live anymore? I can't start over, I can't prestige, I can't live, I can't die. To create, to destroy. To create destruction. Goodbye, Dad, I love you.`
	];
	let out = false;
</script>

<main id="{ out ? "" : "hide"}">
	<h1>Wizard Journal!</h1>
	{#each entries.map((v, i)=>{ return {str: v, i: i}; }) as e}
		{#if e.i <= $max_entry}
			<h3>{e.str}</h3>
			<hr>
		{/if}
	{/each}
	<hr>
	<h3><a href="https://www.buymeacoffee.com/JacobyY" target="_blank">Buy me a coffee?</a></h3>
</main>
<button on:click={()=> out = !out} id="{ out ? "" : "hide-button"}"> <h3>
	{#if out} &lAarr; {:else} &rAarr; {/if}
</h3> </button>

<style>
	main {
		position: absolute;
		height: calc(100% - 2rem - 4px);
		width: calc(50% - 7rem - 4px);
		border: 2px solid #b98d70;
		top: 0;
		left: 0;
		background-color: #deaa87;
		font-family: 'Times New Roman', Times, serif;
		text-align: center;
		padding: 1rem;
		overflow-y: scroll;
		transition-duration: 0.3s;
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
	}
	#hide {
		transform: translate(-100%, 0);
		clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%);
	}
	#hide-button {
		left: 0;
	}
	main h3 {
		font-weight: normal;
		padding: 1rem 0;
		font-size: 1.1rem;
	}
	button {
		position: absolute;
		left: calc(50% - 5rem - 2px);
		top: 50%;
		transform: translateY(-50%);
		border: 2px solid #b98d70;
		border-left: none;
		background-color: #deaa87;
		height: 4rem;
		width: 2rem;
		transition-duration: 0.3s;
	}
	hr {
		border: none;
		border-top: 1px solid #212121;
		margin: 0;
	}
</style>