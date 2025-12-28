import { jsPDF } from 'jspdf';
import type { EstimateData, FlightLeg, CrewMember, CostCategory } from '$lib/types/database';

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
	const crewPerPerson = costs.crew.perPersonExpenses * crewCount;
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

function formatHours(hours: number): string {
	const h = Math.floor(hours);
	const m = Math.round((hours - h) * 60);
	return `${h}h ${m}m`;
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
	doc.text(`  ${label}`, margin, y);
	doc.text(formatCurrency(value), pageWidth - margin - 30, y, { align: 'right' });
	return y + 5;
}

function checkPageBreak(doc: jsPDF, y: number, margin: number, needed: number = 30): number {
	const pageHeight = doc.internal.pageSize.getHeight();
	if (y + needed > pageHeight - margin) {
		doc.addPage();
		return margin;
	}
	return y;
}

export function generatePDF(name: string, data: EstimateData): jsPDF {
	const doc = new jsPDF();
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 20;
	let y = margin;

	const costs = calculateDetailedCosts(data);

	// Header
	doc.setFontSize(20);
	doc.setFont('helvetica', 'bold');
	doc.text('JLW Aviation', margin, y);
	y += 8;

	doc.setFontSize(12);
	doc.setTextColor(100);
	doc.text('Trip Estimate', margin, y);
	doc.setTextColor(0);
	y += 12;

	doc.setFontSize(16);
	doc.setFont('helvetica', 'bold');
	doc.text(name, margin, y);
	y += 6;

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(100);
	doc.text(`Prepared: ${new Date().toLocaleDateString()}`, margin, y);
	doc.setTextColor(0);
	y += 12;

	// Summary Box
	doc.setFillColor(254, 242, 242); // Light red background
	doc.roundedRect(margin, y, pageWidth - 2 * margin, 28, 3, 3, 'F');
	y += 10;

	doc.setFontSize(11);
	doc.setFont('helvetica', 'normal');
	doc.text('Total Estimate', margin + 8, y);

	doc.setFontSize(20);
	doc.setFont('helvetica', 'bold');
	doc.text(formatCurrency(costs.grandTotal), margin + 8, y + 10);

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.text(`Flight Time: ${formatHours(costs.totalFlightTime)}`, pageWidth - margin - 8, y, { align: 'right' });
	doc.text(`Fuel: ${Math.round(costs.totalFuelGallons).toLocaleString()} gal`, pageWidth - margin - 8, y + 10, { align: 'right' });
	y += 25;

	// Flight Itinerary
	y += 8;
	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.text('Flight Itinerary', margin, y);
	y += 7;

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');

	data.legs.forEach((leg, i) => {
		y = checkPageBreak(doc, y, margin, 10);
		const route = `${leg.origin || '???'} → ${leg.destination || '???'}`;
		const time = formatHours(leg.flightTimeHours + leg.flightTimeMinutes / 60);

		doc.text(`Leg ${i + 1}: ${route}`, margin, y);
		doc.text(time, pageWidth - margin - 30, y, { align: 'right' });
		y += 5;
	});

	// Crew
	y += 8;
	y = checkPageBreak(doc, y, margin, 15);
	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.text('Crew', margin, y);
	y += 7;

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	const pilots = data.crew.filter((c) => c.role === 'pilot').length;
	const fas = data.crew.filter((c) => c.role === 'attendant').length;
	const crewParts = [];
	if (pilots > 0) crewParts.push(`${pilots} Pilot${pilots > 1 ? 's' : ''}`);
	if (fas > 0) crewParts.push(`${fas} Flight Attendant${fas > 1 ? 's' : ''}`);
	doc.text(crewParts.join(', ') || 'No crew assigned', margin, y);
	y += 10;

	// Cost Breakdown Header
	y = checkPageBreak(doc, y, margin, 20);
	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.text('Cost Breakdown', margin, y);
	y += 10;

	// Crew Costs
	if (costs.crew.total > 0) {
		y = checkPageBreak(doc, y, margin, 60);
		doc.setFillColor(34, 197, 94); // Green
		doc.rect(margin, y - 4, 3, 14, 'F');
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('Crew Costs', margin + 6, y);
		doc.text(formatCurrency(costs.crew.total), pageWidth - margin - 30, y, { align: 'right' });
		y += 7;

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		y = addLineItem(doc, `Daily rates (${data.costs.crew.numberOfDays} days)`, costs.crew.dailyRates, margin, y, pageWidth);
		y = addLineItem(doc, `Hotel (${data.costs.crew.numberOfNights} nights × ${costs.crewCount} crew)`, costs.crew.hotel, margin, y, pageWidth);
		y = addLineItem(doc, `Meals (${data.costs.crew.numberOfDays} days × ${costs.crewCount} crew)`, costs.crew.meals, margin, y, pageWidth);
		y = addLineItem(doc, `Per-person expenses (${costs.crewCount} crew)`, costs.crew.perPerson, margin, y, pageWidth);
		y = addLineItem(doc, 'Rental car', costs.crew.rentalCar, margin, y, pageWidth);
		y = addLineItem(doc, 'Airfare', costs.crew.airfare, margin, y, pageWidth);
		y = addLineItem(doc, 'Mileage', costs.crew.mileage, margin, y, pageWidth);
		y += 5;
	}

	// Hourly Programs & Reserves
	if (costs.hourly.total > 0) {
		y = checkPageBreak(doc, y, margin, 30);
		doc.setFillColor(239, 68, 68); // Red
		doc.rect(margin, y - 4, 3, 14, 'F');
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('Hourly Programs & Reserves', margin + 6, y);
		doc.text(formatCurrency(costs.hourly.total), pageWidth - margin - 30, y, { align: 'right' });
		y += 7;

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		y = addLineItem(doc, `Maintenance program (${formatHours(costs.totalFlightTime)})`, costs.hourly.maintenance, margin, y, pageWidth);
		y = addLineItem(doc, `Consumables (${formatHours(costs.totalFlightTime)})`, costs.hourly.consumables, margin, y, pageWidth);
		y = addLineItem(doc, `Additional reserve (${formatHours(costs.totalFlightTime)})`, costs.hourly.reserve, margin, y, pageWidth);
		y += 5;
	}

	// Fuel
	if (costs.fuel.total > 0) {
		y = checkPageBreak(doc, y, margin, 25);
		doc.setFillColor(234, 179, 8); // Yellow
		doc.rect(margin, y - 4, 3, 14, 'F');
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('Fuel', margin + 6, y);
		doc.text(formatCurrency(costs.fuel.total), pageWidth - margin - 30, y, { align: 'right' });
		y += 7;

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		y = addLineItem(doc, `Flight fuel (${Math.round(costs.fuel.gallons).toLocaleString()} gal @ $${data.costs.fuel.pricePerGallon}/gal)`, costs.fuel.burnCost, margin, y, pageWidth);
		y = addLineItem(doc, `APU (${Math.round(costs.fuel.apuGallons).toLocaleString()} gal)`, costs.fuel.apuCost, margin, y, pageWidth);
		y += 5;
	}

	// Airport & Ground
	if (costs.airport.total > 0) {
		y = checkPageBreak(doc, y, margin, 60);
		doc.setFillColor(168, 85, 247); // Purple
		doc.rect(margin, y - 4, 3, 14, 'F');
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('Airport & Ground', margin + 6, y);
		doc.text(formatCurrency(costs.airport.total), pageWidth - margin - 30, y, { align: 'right' });
		y += 7;

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		y = addLineItem(doc, 'Landing fees', costs.airport.landingFees, margin, y, pageWidth);
		y = addLineItem(doc, 'Catering', costs.airport.catering, margin, y, pageWidth);
		y = addLineItem(doc, 'Ground handling', costs.airport.handling, margin, y, pageWidth);
		y = addLineItem(doc, 'Passenger transport', costs.airport.passengerTransport, margin, y, pageWidth);
		y = addLineItem(doc, 'Facility fees', costs.airport.facilityFees, margin, y, pageWidth);
		y = addLineItem(doc, 'Special event fees', costs.airport.specialEventFees, margin, y, pageWidth);
		y = addLineItem(doc, 'Ramp parking', costs.airport.rampParking, margin, y, pageWidth);
		y = addLineItem(doc, 'Customs', costs.airport.customs, margin, y, pageWidth);
		y = addLineItem(doc, 'Hangar', costs.airport.hangar, margin, y, pageWidth);
		y += 5;
	}

	// Miscellaneous
	if (costs.misc.total > 0) {
		y = checkPageBreak(doc, y, margin, 25);
		doc.setFillColor(107, 114, 128); // Gray
		doc.rect(margin, y - 4, 3, 14, 'F');
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('Miscellaneous', margin + 6, y);
		doc.text(formatCurrency(costs.misc.total), pageWidth - margin - 30, y, { align: 'right' });
		y += 7;

		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		y = addLineItem(doc, 'Trip coordination', costs.misc.tripCoordination, margin, y, pageWidth);
		y = addLineItem(doc, 'Other', costs.misc.other, margin, y, pageWidth);
		y += 5;
	}

	// Grand Total
	y = checkPageBreak(doc, y, margin, 20);
	y += 3;
	doc.setDrawColor(200);
	doc.line(margin, y, pageWidth - margin, y);
	y += 8;

	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.text('Total Estimate', margin, y);
	doc.text(formatCurrency(costs.grandTotal), pageWidth - margin - 30, y, { align: 'right' });
	y += 12;

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

	// Footer
	const footerY = doc.internal.pageSize.getHeight() - 12;
	doc.setFontSize(8);
	doc.setTextColor(150);
	doc.text('JLW Aviation Trip Estimate', margin, footerY);
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
