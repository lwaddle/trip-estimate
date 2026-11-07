import { jsPDF } from 'jspdf';
import type { EstimateData, FlightLeg, CostCategory } from '$lib/types/database';
import { DISCLAIMER } from './disclaimer';
import { formatFuelPrice, formatGallons, formatHours, formatRate, pluralize } from './format';

interface DetailedCostBreakdown {
	totalFlightTime: number;
	totalFuelGallons: number;
	crewCount: number;
	crew: {
		dailyRates: number;
		hotel: number;
		meals: number;
		perPerson: number;
		rentalCar: number;
		airfare: number;
		mileage: number;
		total: number;
	};
	hourly: {
		maintenance: number;
		consumables: number;
		reserve: number;
		total: number;
	};
	fuel: {
		gallons: number;
		apuGallons: number;
		totalGallons: number;
		burnCost: number;
		apuCost: number;
		total: number;
	};
	airport: {
		landingFees: number;
		catering: number;
		handling: number;
		passengerTransport: number;
		facilityFees: number;
		specialEventFees: number;
		rampParking: number;
		customs: number;
		hangar: number;
		total: number;
	};
	misc: {
		tripCoordination: number;
		other: number;
		total: number;
	};
	grandTotal: number;
}

function calculateDetailedCosts(data: EstimateData): DetailedCostBreakdown {
	const { costs, crew, legs } = data;

	const totalFlightTime = legs.reduce(
		(sum, leg) => sum + leg.flightTimeHours + leg.flightTimeMinutes / 60,
		0
	);
	const fuelDensity = costs.fuel.fuelDensity || 6.7;
	const totalFuelBurnLbs = legs.reduce((sum, leg) => sum + leg.fuelBurnLbs, 0);
	const crewCount = crew.length;
	const totalDailyRates = crew.reduce((sum, m) => sum + m.dailyRate, 0);
	const legCount = legs.length;

	// Crew costs breakdown
	const crewDailyRates = totalDailyRates * costs.crew.numberOfDays;
	const crewHotel = costs.crew.hotelPerNight * costs.crew.numberOfNights * crewCount;
	const crewMeals = costs.crew.mealsPerDay * costs.crew.numberOfDays * crewCount;
	const crewPerPerson = costs.crew.perPersonExpenses * costs.crew.numberOfDays * crewCount;
	const crewRentalCar = costs.crew.rentalCar;
	const crewAirfare = costs.crew.airfare;
	const crewMileage = costs.crew.mileage;
	const crewTotal =
		crewDailyRates + crewHotel + crewMeals + crewPerPerson + crewRentalCar + crewAirfare + crewMileage;

	// Hourly costs breakdown
	const hourlyMaintenance = costs.hourly.maintenanceProgram * totalFlightTime;
	const hourlyConsumables = costs.hourly.consumables * totalFlightTime;
	const hourlyReserve = costs.hourly.additionalReserve * totalFlightTime;
	const hourlyTotal = hourlyMaintenance + hourlyConsumables + hourlyReserve;

	// Fuel costs breakdown
	const fuelGallons = totalFuelBurnLbs / fuelDensity;
	const apuGallons = (costs.fuel.apuBurnPerLeg / fuelDensity) * legCount;
	const totalFuelGallons = fuelGallons + apuGallons;
	const fuelBurnCost = fuelGallons * costs.fuel.pricePerGallon;
	const apuCost = apuGallons * costs.fuel.pricePerGallon;
	const fuelTotal = fuelBurnCost + apuCost;

	// Airport costs
	const airportTotal =
		costs.airport.landingFees +
		costs.airport.catering +
		costs.airport.handling +
		costs.airport.passengerTransport +
		costs.airport.facilityFees +
		costs.airport.specialEventFees +
		costs.airport.rampParking +
		costs.airport.customs +
		costs.airport.hangar;

	// Misc costs
	const miscTotal = costs.misc.tripCoordination + costs.misc.other;

	return {
		totalFlightTime,
		totalFuelGallons,
		crewCount,
		crew: {
			dailyRates: crewDailyRates,
			hotel: crewHotel,
			meals: crewMeals,
			perPerson: crewPerPerson,
			rentalCar: crewRentalCar,
			airfare: crewAirfare,
			mileage: crewMileage,
			total: crewTotal
		},
		hourly: {
			maintenance: hourlyMaintenance,
			consumables: hourlyConsumables,
			reserve: hourlyReserve,
			total: hourlyTotal
		},
		fuel: {
			gallons: fuelGallons,
			apuGallons,
			totalGallons: totalFuelGallons,
			burnCost: fuelBurnCost,
			apuCost,
			total: fuelTotal
		},
		airport: {
			landingFees: costs.airport.landingFees,
			catering: costs.airport.catering,
			handling: costs.airport.handling,
			passengerTransport: costs.airport.passengerTransport,
			facilityFees: costs.airport.facilityFees,
			specialEventFees: costs.airport.specialEventFees,
			rampParking: costs.airport.rampParking,
			customs: costs.airport.customs,
			hangar: costs.airport.hangar,
			total: airportTotal
		},
		misc: {
			tripCoordination: costs.misc.tripCoordination,
			other: costs.misc.other,
			total: miscTotal
		},
		grandTotal: crewTotal + hourlyTotal + fuelTotal + airportTotal + miscTotal
	};
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

// jsPDF ignores charSpace when computing alignment offsets, so right-aligning
// letter-spaced text overflows past the anchor. Position it manually instead.
function rightSpacedText(doc: jsPDF, text: string, x: number, y: number, charSpace: number): void {
	const width = doc.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
	doc.text(text, x - width, y, { charSpace });
}

function addLineItem(
	doc: jsPDF,
	label: string,
	value: number,
	margin: number,
	y: number,
	pageWidth: number
): number {
	if (value <= 0) return y;
	// Line items sit one tier below the bold black section subtotal
	doc.setTextColor(90);
	doc.text(`  ${label}`, margin, y);
	doc.text(formatCurrency(value), pageWidth - margin, y, { align: 'right' });
	// Subtle bottom rule to guide the eye without heavy banding
	doc.setDrawColor(232);
	doc.setLineWidth(0.1);
	doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
	return y + 5;
}

function sectionHeading(doc: jsPDF, title: string, margin: number, y: number, pageWidth: number): number {
	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(0);
	doc.text(title, margin, y);
	y += 2.5;
	doc.setDrawColor(220);
	doc.setLineWidth(0.2);
	doc.line(margin, y, pageWidth - margin, y);
	return y + 5.5;
}

function checkPageBreak(doc: jsPDF, y: number, margin: number, needed: number = 30): number {
	const pageHeight = doc.internal.pageSize.getHeight();
	if (y + needed > pageHeight - margin) {
		doc.addPage();
		return margin;
	}
	return y;
}

function renderSection(
	doc: jsPDF,
	title: string,
	total: number,
	items: { label: string; value: number }[],
	margin: number,
	y: number,
	pageWidth: number
): number {
	const visible = items.filter((it) => it.value > 0);
	if (total <= 0 || visible.length === 0) return y;

	// Reserve only the space this section actually needs (header + rows)
	// so a short section doesn't trigger a premature page break.
	const needed = 12 + visible.length * 5;
	y = checkPageBreak(doc, y, margin, needed);

	doc.setFontSize(10);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(0);
	doc.text(title, margin, y);
	doc.text(formatCurrency(total), pageWidth - margin, y, { align: 'right' });
	y += 2;
	doc.setDrawColor(220);
	doc.setLineWidth(0.2);
	doc.line(margin, y, pageWidth - margin, y);
	y += 5;

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	for (const it of visible) {
		y = addLineItem(doc, it.label, it.value, margin, y, pageWidth);
	}
	return y + 5;
}

// Fine print: small and gray, kept together so it never splits across pages.
function renderDisclaimer(doc: jsPDF, margin: number, y: number, pageWidth: number): number {
	const lineHeight = 2.8;
	doc.setFontSize(7);
	doc.setFont('helvetica', 'normal');
	const lines: string[] = [DISCLAIMER.intro, ...DISCLAIMER.items.map((it) => `${it.label}: ${it.text}`), DISCLAIMER.closing].flatMap(
		(paragraph) => doc.splitTextToSize(paragraph, pageWidth - 2 * margin)
	);

	// Measured to the last line's baseline, which must clear the footer rule
	const lastBaseline = y + 3.5 + (lines.length - 1) * lineHeight;
	if (lastBaseline > doc.internal.pageSize.getHeight() - 18) {
		doc.addPage();
		y = margin;
	}

	doc.setFont('helvetica', 'bold');
	doc.setTextColor(130);
	doc.text(DISCLAIMER.heading, margin, y);
	y += 3.5;

	doc.setFont('helvetica', 'normal');
	for (const line of lines) {
		doc.text(line, margin, y);
		y += lineHeight;
	}
	doc.setTextColor(0);
	return y;
}

export function generatePDF(name: string, data: EstimateData): jsPDF {
	// US Letter, not jsPDF's A4 default: A4 is ~18 mm taller, so printing it
	// on Letter paper at 100% clipped the footer and lowest rows.
	const doc = new jsPDF({ format: 'letter' });
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 20;
	let y = margin;

	const costs = calculateDetailedCosts(data);
	const crewCosts = data.costs.crew;
	const days = pluralize(crewCosts.numberOfDays, 'day');
	const nights = pluralize(crewCosts.numberOfNights, 'night');
	const combinedDailyRate = data.crew.reduce((sum, m) => sum + m.dailyRate, 0);

	// Header — title treatment (no logo)
	doc.setFontSize(8);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(150);
	doc.text('TRIP COST ESTIMATE  ·  FOR BUDGETING ONLY', margin, y, { charSpace: 0.5 });
	y += 8;

	doc.setFontSize(18);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(20);
	// Long names wrap rather than running off the page
	const titleLines: string[] = doc.splitTextToSize(name, pageWidth - 2 * margin);
	titleLines.forEach((line, i) => {
		if (i > 0) y += 7.5;
		doc.text(line, margin, y);
	});
	y += 6;

	// Aircraft identity (tail · type) — whichever fields are present
	const aircraftLine = [data.tailNumber, data.aircraftType]
		.map((s) => s?.trim())
		.filter(Boolean)
		.join('  ·  ');
	if (aircraftLine) {
		doc.setFontSize(9.5);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(90);
		doc.text(aircraftLine, margin, y);
		y += 6;
	}

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(120);
	doc.text(`Prepared ${new Date().toLocaleDateString()}  ·  ${DISCLAIMER.short}`, margin, y);
	doc.setTextColor(0);
	y += 7;

	// Summary card
	const cardH = 22;
	doc.setFillColor(247, 248, 250); // subtle neutral
	doc.roundedRect(margin, y, pageWidth - 2 * margin, cardH, 2, 2, 'F');

	const labelY = y + 9;
	const valueY = y + 16;
	const fuelEdge = pageWidth - margin - 8;
	const timeEdge = fuelEdge - 34;

	// Labels — uniform size, color, and tracking
	doc.setFontSize(7.5);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(140);
	doc.text('TOTAL ESTIMATE', margin + 8, labelY, { charSpace: 0.5 });
	rightSpacedText(doc, 'FLIGHT TIME', timeEdge, labelY, 0.5);
	rightSpacedText(doc, 'FUEL', fuelEdge, labelY, 0.5);

	// Values — same size and style across all three fields
	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(45);
	doc.text(formatCurrency(costs.grandTotal), margin + 8, valueY);
	doc.text(formatHours(costs.totalFlightTime), timeEdge, valueY, { align: 'right' });
	doc.text(`${Math.round(costs.totalFuelGallons).toLocaleString()} gal`, fuelEdge, valueY, { align: 'right' });

	doc.setTextColor(0);
	y += cardH + 10;

	// Flight Itinerary
	y = sectionHeading(doc, 'Flight Itinerary', margin, y, pageWidth);

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');

	data.legs.forEach((leg, i) => {
		y = checkPageBreak(doc, y, margin, 10);
		const route = `${leg.origin || '???'} — ${leg.destination || '???'}`;
		const time = formatHours(leg.flightTimeHours + leg.flightTimeMinutes / 60);

		doc.text(`Leg ${i + 1}: ${route}`, margin, y);
		doc.text(time, pageWidth - margin, y, { align: 'right' });
		doc.setDrawColor(232);
		doc.setLineWidth(0.1);
		doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
		y += 5;
	});

	y += 8;

	// Cost Breakdown Header
	y = checkPageBreak(doc, y, margin, 20);
	y = sectionHeading(doc, 'Cost Breakdown', margin, y, pageWidth);
	y += 1.5;

	y = renderSection(doc, 'Crew Costs', costs.crew.total, [
		{ label: `Daily rates (${days} @ ${formatRate(combinedDailyRate)}/day)`, value: costs.crew.dailyRates },
		{ label: `Hotel (${nights} × ${costs.crewCount} crew @ ${formatRate(crewCosts.hotelPerNight)}/night)`, value: costs.crew.hotel },
		{ label: `Meals (${days} × ${costs.crewCount} crew @ ${formatRate(crewCosts.mealsPerDay)}/day)`, value: costs.crew.meals },
		{ label: `Per-person expenses (${days} × ${costs.crewCount} crew @ ${formatRate(crewCosts.perPersonExpenses)}/day)`, value: costs.crew.perPerson },
		{ label: 'Rental car', value: costs.crew.rentalCar },
		{ label: 'Airfare', value: costs.crew.airfare },
		{ label: 'Mileage', value: costs.crew.mileage }
	], margin, y, pageWidth);

	y = renderSection(doc, 'Hourly Programs & Reserves', costs.hourly.total, [
		{ label: `Maintenance programs (${formatHours(costs.totalFlightTime)} @ ${formatRate(data.costs.hourly.maintenanceProgram)}/hr)`, value: costs.hourly.maintenance },
		{ label: `Consumables (${formatHours(costs.totalFlightTime)} @ ${formatRate(data.costs.hourly.consumables)}/hr)`, value: costs.hourly.consumables },
		{ label: `Additional reserve (${formatHours(costs.totalFlightTime)} @ ${formatRate(data.costs.hourly.additionalReserve)}/hr)`, value: costs.hourly.reserve }
	], margin, y, pageWidth);

	y = renderSection(doc, 'Fuel', costs.fuel.total, [
		{ label: `Flight fuel (${formatGallons(costs.fuel.gallons)} @ est. avg. ${formatFuelPrice(data.costs.fuel.pricePerGallon)}/gal)`, value: costs.fuel.burnCost },
		{ label: `APU (${formatGallons(costs.fuel.apuGallons)} @ est. avg. ${formatFuelPrice(data.costs.fuel.pricePerGallon)}/gal)`, value: costs.fuel.apuCost }
	], margin, y, pageWidth);

	y = renderSection(doc, 'Airport & Ground', costs.airport.total, [
		{ label: 'Landing fees', value: costs.airport.landingFees },
		{ label: 'Catering', value: costs.airport.catering },
		{ label: 'Ground handling', value: costs.airport.handling },
		{ label: 'Passenger transport', value: costs.airport.passengerTransport },
		{ label: 'Facility fees', value: costs.airport.facilityFees },
		{ label: 'Special event fees', value: costs.airport.specialEventFees },
		{ label: 'Ramp parking', value: costs.airport.rampParking },
		{ label: 'Customs', value: costs.airport.customs },
		{ label: 'Hangar', value: costs.airport.hangar }
	], margin, y, pageWidth);

	y = renderSection(doc, 'Miscellaneous', costs.misc.total, [
		{ label: 'Trip coordination', value: costs.misc.tripCoordination },
		{ label: 'Other', value: costs.misc.other }
	], margin, y, pageWidth);

	// Grand Total — reserve only its rule and text, so it isn't stranded alone
	// on a new page when it fits under the last section.
	y = checkPageBreak(doc, y, margin, 10);
	y += 1;
	doc.setDrawColor(200);
	doc.setLineWidth(0.2);
	doc.line(margin, y, pageWidth - margin, y);
	y += 7;

	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(0);
	doc.text('Estimated Total', margin, y);
	doc.text(formatCurrency(costs.grandTotal), pageWidth - margin, y, { align: 'right' });
	y += 8;

	// Notes
	if (data.notes) {
		y = checkPageBreak(doc, y, margin, 25);
		doc.setFontSize(12);
		doc.text('Notes', margin, y);
		y += 7;

		doc.setFontSize(9);
		doc.setFont('helvetica', 'normal');

		const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
		splitNotes.forEach((line: string) => {
			y = checkPageBreak(doc, y, margin, 6);
			doc.text(line, margin, y);
			y += 5;
		});
	}

	y = renderDisclaimer(doc, margin, y, pageWidth);

	// Footer — drawn on every page
	const pageCount = doc.getNumberOfPages();
	const footerY = doc.internal.pageSize.getHeight() - 12;
	const generated = new Date().toLocaleString();
	for (let p = 1; p <= pageCount; p++) {
		doc.setPage(p);
		doc.setDrawColor(230);
		doc.setLineWidth(0.1);
		doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(150);
		doc.text(DISCLAIMER.footer, margin, footerY);
		doc.text(`Generated ${generated}`, pageWidth / 2, footerY, { align: 'center' });
		doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
	}
	doc.setTextColor(0);

	return doc;
}

export function downloadPDF(name: string, data: EstimateData): void {
	const doc = generatePDF(name, data);
	const filename = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_estimate.pdf`;
	doc.save(filename);
}

export function getPDFDataUrl(name: string, data: EstimateData): string {
	const doc = generatePDF(name, data);
	return doc.output('dataurlstring');
}
