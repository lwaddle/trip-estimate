export function pluralize(count: number, unit: string): string {
	return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

// Rounds to whole minutes before splitting, so a total like 4.9999... hours
// reads as "5h 0m" rather than "4h 60m".
export function formatHours(hours: number): string {
	const totalMinutes = Math.round(hours * 60);
	return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

// Unit rates keep cents when they have them, but stay clean for whole
// dollar rates (e.g. $1,108.22/hr vs $150/hr).
export function formatRate(value: number, maxDecimals: number = 2): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
		maximumFractionDigits: maxDecimals
	}).format(value);
}

// Fuel prices are often quoted past the cent (e.g. $7.575/gal).
export function formatFuelPrice(value: number): string {
	return formatRate(value, 4);
}

// One decimal so that gallons × price visibly matches the line's dollar amount.
export function formatGallons(gallons: number): string {
	const amount = gallons.toLocaleString('en-US', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	return `${amount} gal`;
}

// A filename people can read, e.g. "Denver - Strawn Dixon - Estimate.pdf".
// Removes only what operating systems reject, so names otherwise stay as typed.
export function pdfFilename(name: string): string {
	const clean = name
		.replace(/[/\\:|]/g, '-')
		.replace(/[*?"<>\x00-\x1f]/g, '')
		.replace(/\s+/g, ' ')
		.slice(0, 120)
		.replace(/^[\s.]+|[\s.]+$/g, '');
	if (!clean) return 'Trip Estimate.pdf';
	return /estimate$/i.test(clean) ? `${clean}.pdf` : `${clean} - Estimate.pdf`;
}
