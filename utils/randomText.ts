const randomTextFromArray = (texts: string[]) => texts[Math.floor(Math.random() * texts.length)];

const randomText = (name: string) => {
	const morningOnlyTexts = [
		`Good morning, ${name}! Let’s get moving.`,
		`Rise and shine, ${name}!`,
		`Hope you slept well, ${name}. Let’s make today solid.`,
		`Morning, ${name}. Ready to dive in?`,
		`Hey ${name}, coffee’s on.`,
		`Fresh start, ${name}—let’s use it.`,
		`Systems online, ${name}.`,
		`New day, new chances, ${name}.`,
		`First light, first win, right ${name}?`,
		`Boot sequence complete, ${name}.`,
		`Up and at it, ${name}.`,
		`Let’s make today count, ${name}.`,
		`Quick stretch, deep breath, go ${name}.`,
		`It’s go time, ${name}.`,
		`Focus up, ${name}—you’ve got this.`,
		`Shine today, ${name}.`,
		`New tasks—let’s clear them, ${name}.`,
		`Morning sun, good momentum, ${name}.`,
		`Mission log: ${name} online.`,
		`Don’t just wake—make it matter, ${name}.`
	];

	const afternoonOnlyTexts = [
		`Good afternoon, ${name}! How’s the pace?`,
		`Hope your day’s on track, ${name}.`,
		`Hey ${name}, quick check-in—how’s it going?`,
		`Halfway through—keep it steady, ${name}.`,
		`Great work so far, ${name}.`,
		`Hello ${name}! Need a stretch break?`,
		`A productive afternoon to you, ${name}.`,
		`Let’s close this block strong, ${name}.`,
		`Still cruising, ${name}?`,
		`Orbit stable, ${name}.`,
		`Break time yet, ${name}?`,
		`On track and focused, ${name}.`,
		`Turn that list into done items, ${name}.`,
		`You’ve got this—one task at a time, ${name}.`,
		`Ping! Just checking in, ${name}.`,
		`Mid-day high-five, ${name}.`,
		`Orbit spins smoothly—keep going, ${name}.`,
		`Hydrate and keep momentum, ${name}.`,
		`Focus levels rising, ${name}.`,
		`Great window to finish things, ${name}.`
	];

	const nightOnlyTexts = [
		`Good evening, ${name}.`,
		`Winding down, ${name}?`,
		`Hope your day went well, ${name}.`,
		`Take a breath and reset, ${name}.`,
		`Calm night vibes, ${name}.`,
		`Slow down and recover, ${name}.`,
		`Stars are out—nice work today, ${name}.`,
		`Solid effort today, ${name}.`,
		`Time to unplug soon, ${name}.`,
		`Orbit hums—rest is next, ${name}.`,
		`Calm night, ${name}. Unwind.`,
		`Logging off? You earned it, ${name}.`,
		`Recharge mode: approved, ${name}.`,
		`Even the bright lights dim—so can you, ${name}.`,
		`Thanks for the effort today, ${name}.`,
		`Late tasks or quiet time—your call, ${name}.`,
		`Rest well tonight, ${name}.`,
		`Level complete. GG, ${name}.`,
		`Captain ${name}, systems secure.`,
		`Sending good energy for tomorrow, ${name}.`
	];

	const lateNightTexts = [
		`Still awake, ${name}?`,
		`Late grind never sleeps—take it easy, ${name}.`,
		`Late-night working or thinking, ${name}?`,
		`You, me, and the quiet hours, ${name}.`,
		`Night owls unite, ${name}.`,
		`Take a quick break and rest soon, ${name}.`
	];

	const hour = new Date().getHours();
	if (hour >= 20) return randomTextFromArray(nightOnlyTexts);
	if (hour >= 12) return randomTextFromArray(afternoonOnlyTexts);
	if (hour >= 4) return randomTextFromArray(morningOnlyTexts);
	return randomTextFromArray(lateNightTexts);
};

export default randomText;
