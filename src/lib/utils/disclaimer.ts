// Shared by the PDF and the share view so the two can't drift apart.
export const DISCLAIMER = {
	short: 'For budgeting purposes only. Not a charter quote or an offer of air transportation.',
	footer: 'For budgeting only. Not a charter quote.',
	heading: 'About this estimate',
	intro:
		'This document is an informational budgeting tool provided as a consulting service to help a dry lease operator anticipate potential trip costs. It is not a charter quote, an offer of air transportation, or a guarantee of price or availability. Aircraft, crew, and services are not provided or arranged under this estimate. The operator retains operational control and is responsible for all flight operations.',
	items: [
		{
			label: 'Crew',
			text: 'Figures are general industry rates for planning only. Actual compensation is solely between the operator and its pilots.'
		},
		{
			label: 'Airport and ground fees',
			text: 'Ramp, handling, special event, and similar fees may not be individually researched. Actual costs may be much higher or lower.'
		},
		{
			label: 'Fuel',
			text: 'Pricing is an estimated average based on the general route, not a quoted price at any location.'
		}
	],
	closing: 'Actual costs will vary. The operator should verify all costs independently before relying on them.'
} as const;
