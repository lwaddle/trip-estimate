import { jsPDF } from 'jspdf';
import type { EstimateData, FlightLeg, CrewMember, CostCategory } from '$lib/types/database';

interface CostBreakdown {
	crew: number;
	hourly: number;
	fuel: number;
	airport: number;
	misc: number;
	total: number;
	fuelGallons: number;
}

function calculateCosts(data: EstimateData): CostBreakdown {
	const { costs, crew, legs } = data;

	const totalFlightTime = legs.reduce(
		(sum, leg) => sum + leg.flightTimeHours + leg.flightTimeMinutes / 60,
		0
	);
	const totalFuelBurn = legs.reduce((sum, leg) => sum + leg.fuelBurn, 0);
	const crewCount = crew.length;
	const totalDailyRates = crew.reduce((sum, m) => sum + m.dailyRate, 0);

	const crewCost =
		totalDailyRates * costs.crew.numberOfDays +
		costs.crew.hotelPerNight * costs.crew.numberOfNights * crewCount +
		costs.crew.mealsPerDay * costs.crew.numberOfDays * crewCount +
		costs.crew.perPersonExpenses * crewCount +
		costs.crew.rentalCar +
		costs.crew.airfare +
		costs.crew.mileage;

	const hourlyCost =
		(costs.hourly.maintenanceProgram +
			costs.hourly.consumables +
			costs.hourly.additionalReserve) *
		totalFlightTime;

	let fuelGallons = totalFuelBurn;
	if (costs.fuel.includeApuBurn) {
		fuelGallons += costs.fuel.apuBurnPerHour * totalFlightTime;
	}
	const fuelCost = fuelGallons * costs.fuel.pricePerGallon;

	const airportCost =
		costs.airport.landingFees +
		costs.airport.catering +
		costs.airport.handling +
		costs.airport.passengerTransport +
		costs.airport.facilityFees +
		costs.airport.specialEventFees +
		costs.airport.rampParking +
		costs.airport.customs +
		costs.airport.hangar;

	const miscCost = costs.misc.tripCoordination + costs.misc.other;

	return {
		crew: crewCost,
		hourly: hourlyCost,
		fuel: fuelCost,
		airport: airportCost,
		misc: miscCost,
		total: crewCost + hourlyCost + fuelCost + airportCost + miscCost,
		fuelGallons
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

function formatHours(hours: number): string {
	const h = Math.floor(hours);
	const m = Math.round((hours - h) * 60);
	return `${h}h ${m}m`;
}

export function generatePDF(name: string, data: EstimateData): jsPDF {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 20;
	let y = margin;

	const costs = calculateCosts(data);
	const totalFlightTime = data.legs.reduce(
		(sum, leg) => sum + leg.flightTimeHours + leg.flightTimeMinutes / 60,
		0
	);

	// Header
	doc.setFontSize(24);
	doc.setFont('helvetica', 'bold');
	doc.text('Trip Estimate', margin, y);
	y += 10;

	doc.setFontSize(14);
	doc.setFont('helvetica', 'normal');
	doc.text(name, margin, y);
	y += 8;

	doc.setFontSize(10);
	doc.setTextColor(100);
	doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
	doc.setTextColor(0);
	y += 15;

	// Summary Box
	doc.setFillColor(240, 249, 255);
	doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'F');
	y += 8;

	doc.setFontSize(12);
	doc.text('Total Estimate', margin + 5, y);
	y += 8;

	doc.setFontSize(22);
	doc.setFont('helvetica', 'bold');
	doc.text(formatCurrency(costs.total), margin + 5, y);
	doc.setFont('helvetica', 'normal');

	doc.setFontSize(10);
	doc.text(`Flight Time: ${formatHours(totalFlightTime)}`, margin + 80, y - 8);
	doc.text(`Fuel: ${costs.fuelGallons.toLocaleString()} gal`, margin + 80, y);
	y += 20;

	// Flight Legs
	y += 5;
	doc.setFontSize(14);
	doc.setFont('helvetica', 'bold');
	doc.text('Flight Legs', margin, y);
	y += 8;

	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');

	data.legs.forEach((leg, i) => {
		const route = `${leg.origin || '???'} → ${leg.destination || '???'}`;
		const time = formatHours(leg.flightTimeHours + leg.flightTimeMinutes / 60);
		const fuel = `${leg.fuelBurn.toLocaleString()} gal`;

		doc.text(`Leg ${i + 1}: ${route}`, margin, y);
		doc.text(`${time} • ${fuel}`, pageWidth - margin - 40, y);
		y += 6;
	});

	y += 10;

	// Crew
	doc.setFontSize(14);
	doc.setFont('helvetica', 'bold');
	doc.text('Crew', margin, y);
	y += 8;

	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');

	const pilots = data.crew.filter((c) => c.role === 'pilot').length;
	const fas = data.crew.filter((c) => c.role === 'attendant').length;
	doc.text(`${pilots} Pilot(s), ${fas} Flight Attendant(s)`, margin, y);
	y += 10;

	// Cost Breakdown
	doc.setFontSize(14);
	doc.setFont('helvetica', 'bold');
	doc.text('Cost Breakdown', margin, y);
	y += 8;

	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');

	const categories = [
		{ label: 'Crew Costs', value: costs.crew },
		{ label: 'Hourly Programs', value: costs.hourly },
		{ label: 'Fuel', value: costs.fuel },
		{ label: 'Airport & Ground', value: costs.airport },
		{ label: 'Miscellaneous', value: costs.misc }
	];

	categories.forEach((cat) => {
		doc.text(cat.label, margin, y);
		doc.text(formatCurrency(cat.value), pageWidth - margin - 30, y);
		y += 6;
	});

	y += 4;
	doc.setDrawColor(200);
	doc.line(margin, y, pageWidth - margin, y);
	y += 6;

	doc.setFont('helvetica', 'bold');
	doc.text('Total', margin, y);
	doc.text(formatCurrency(costs.total), pageWidth - margin - 30, y);
	y += 15;

	// Notes
	if (data.notes) {
		doc.setFontSize(14);
		doc.text('Notes', margin, y);
		y += 8;

		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');

		const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
		doc.text(splitNotes, margin, y);
		y += splitNotes.length * 5;
	}

	// Footer
	const footerY = doc.internal.pageSize.getHeight() - 15;
	doc.setFontSize(8);
	doc.setTextColor(150);
	doc.text('Generated by Trip Estimate', margin, footerY);
	doc.text(new Date().toLocaleString(), pageWidth - margin - 40, footerY);

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
