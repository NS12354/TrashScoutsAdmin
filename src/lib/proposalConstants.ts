// Static copy for the public proposal + agreement pages. Kept here so
// the public routes and the admin preview can share a single source.

export const PROPOSAL_VALIDITY_DAYS = 30;

export type ServiceCopy = { title: string; body?: string; lead?: string };

export const SERVICE_COPY = {
  both: {
    title: "Push & pull valet service",
    body: "On every scheduled service day, our team transports your full carts and dumpsters from your enclosure out to the curb — staged and ready for your hauler. Once they've been emptied, we safely and neatly return every container to your waste enclosure, leaving the space clean and orderly. Each visit also includes up to five minutes of hands-on cleanup to clear away any loose or overflow waste.",
  },
  pull: {
    title: "Pull-out service",
    body: "On every scheduled service day, our team transports your full carts and dumpsters from your enclosure out to the curb — staged and ready for your hauler. Each visit also includes up to five minutes of hands-on cleanup to clear away any loose or overflow waste.",
  },
  cycle: {
    title: "Bin cycle & swap service",
    body: "Dedicated on-site support that keeps your trash room flowing — cycling, swapping, and rotating containers so no single bin overfills and capacity stays balanced. Every visit includes the same cleanup, issue reporting, and service recommendations.",
  },
  sow: {
    title: "Monitor & maintenance service",
    lead: "A custom scope of work, tailored to what your property needs:",
  },
} satisfies Record<"both" | "pull" | "cycle" | "sow", ServiceCopy>;

export const OPTIONAL_SERVICES = [
  "Junk removal of bulky waste",
  "Pressure washing for trash room grounds",
  "Extra on-site cleanup — $2/min (15-min increments)",
];

export const WHY_BULLETS = [
  "Locally owned, family-operated small business",
  "Proudly serving the Bay Area for over 10 years",
  "Inc. 5000 — one of America's fastest-growing companies (2025)",
  "SBA SCORE Small Business Client of the Year (2025)",
];

export const WHY_GIVING =
  "A share of our profits supports local nonprofits keeping our communities clean — including Keep Oakland Beautiful and the Northern California Recycling Association.";

export const CUSTOMER_TYPES = [
  "Property management",
  "Property owner",
  "Commercial / business",
  "HOA",
  "Multifamily / apartments",
  "Other",
];

// Full Terms & Conditions. Each entry: [heading, paragraph]. Lifted
// verbatim from the standalone agreement HTML the stakeholder
// approved.
export const TERMS: Array<[string, string]> = [
  [
    "Services",
    "Trash Scouts (“Service Provider”) to provide push/pull services to waste bins to you (“Customer”) at Customer’s property, on designated waste collection days in Customer’s town/city, and / or conduct onsite waste maintenance, in each case as determined in the Service Agreement scope of work. Service Provider will determine the method, details, and means of performing the Services. Customer acknowledges and agrees that Service Provider may, at its sole discretion, use subcontractors and consultants to perform some of the Services to be provided under this Agreement, and accordingly that the Service Provider may subcontract its obligations and rights to a third-party. In the event Service Provider utilizes subcontractors or consultants to perform any of the Services, Service Provider shall remain responsible to Customer for performance under this Agreement. Service Provider may represent, perform services for, and contract with other additional clients, persons, or companies as Service Provider, in its sole discretion, sees fit.",
  ],
  [
    "Payment",
    "Services are prepaid for 30 days and due on 1st of each month via credit card or check. Any payment made on or after the 15th of each month for that month’s services shall be deemed a late payment, and Customer shall be subject to a late payment fee of $25.",
  ],
  [
    "Term",
    "The initial term of this Agreement is (12) months from the Effective Date set forth above (“Start Date”) (the “Initial Term”). This Agreement shall automatically renew thereafter for additional terms of twelve (12) months each (“Renewal Term”), unless either party gives to the other party written notice of termination at least thirty (30) days, but not more than one hundred eighty (180) days, prior to the termination of the then-existing term.",
  ],
  [
    "Liquidated Damages",
    "In the event Customer terminates this Agreement prior to the expiration for any reason other than (a) a default by Service Provider, (b) service changes that no longer require Push and Pull service or (c) Management company no longer manages listed property, Customer shall pay the following liquidated damages fees: three times the most recent monthly charges if remaining term is six or more months, or two times monthly charges if remaining term is less than six months.",
  ],
  [
    "Rate Changes",
    "Rates will not change during the Initial Term, unless with 30 day written notice by Service Provider and/or if Customer makes service changes, adds additional services, or scope of work changes.",
  ],
  [
    "Right to Enter",
    "Customer agrees to allow Service Provider to enter property where carts/bins are located, to move, handle and transport container(s) to and from the desired collection location by the hauler.",
  ],
  [
    "Cooperation of Customer",
    "Customer agrees to comply with all reasonable requests of Service Provider and shall provide Service Provider’s personnel with access to all documents and facilities as may be reasonably necessary for the performance of the Services under this Agreement.",
  ],
  [
    "Empty Bins",
    "If a container upon pullout is 90%+ empty, we may opt to not pull-out container, unless customer makes a special request to always pull out bins, even when they are empty.",
  ],
  [
    "Additional Services and Charges",
    "Additional services requested or approved by Customer or its authorized representatives will be billed at Service Provider’s then-current rates. Requests may be made in any form, including verbally, by email, text, or property management portal.",
  ],
  [
    "Pull Out / Push Back Time",
    "Pull outs (when applicable) are scheduled to be serviced prior to 5:00am of the scheduled service day, unless other prior arrangements are made. We will push back the container(s) by 6pm or earlier after your hauler has serviced the containers. If it is determined your hauler failed to service the container (not serviced by 5pm), we will refer to your preference for missed pickups. A $30 return fee per visit will apply to return on a non-scheduled day.",
  ],
  [
    "Unserviceable / Broken Bins",
    "If the containers are unable to be placed curbside due to events beyond Service Provider’s control, such as blocked access, garage unable to open, broken casters, overweight, we will coordinate special arrangements to return the same day. Under such situations, If we have to return on a different unscheduled service day, a return charge of $30 per visit may apply, and a $15 return fee per visit will apply to return on a scheduled day.",
  ],
  [
    "Limitation of Liability",
    "Service Provider provides push/pull services as an independent contractor to the customer. As an independent contractor, we will not hold the customer liable for unintentional injuries inflicted upon or incurred by our staff from providing the listed services. Save for as contemplated in the ‘Liquidated Damages’ clause above, in no event shall either party be liable under this agreement to the other party for any incidental, consequential, indirect, statutory, special, exemplary or punitive damages, including, but not limited to, lost profits, loss of use, loss of time, inconvenience, lost business opportunities, damage to good will or reputation, and costs of cover, regardless of whether such liability is based on breach of contract, tort, strict liability or otherwise, and even if advised of the possibility of such damages or such damages could have been reasonably foreseen. Subject to the customer’s obligation to pay the fees to the service provider, each party’s entire aggregate liability for any claims relating to the services or this agreement shall not exceed the fees paid or payable by Customer within a 6-month period immediately preceding the events giving rise to such liability. This section shall survive the termination of the agreement. No action shall be brought for any claim relating to or arising out of this agreement more than one (1) year after the accrual of such cause of action, except for money due on an open account.",
  ],
  [
    "Placement",
    "Service Provider will place containers curbside or in the designated service area in a safe and accessible manner for the hauler, and Customer shall advise Service Provider in advance of any preferred location. Service Provider is not responsible for the location or condition in which the hauler leaves containers after servicing, or for any resulting issues before Service Provider returns the containers to their storage location.",
  ],
  [
    "Property Damage",
    "Service Provider is not responsible for property damage arising from causes other than Service Provider’s own negligence, including pre-existing conditions, normal wear and tear, defective or overloaded containers, unsafe or obstructed access areas, acts of tenants, vendors, or other third parties, or other conditions outside Service Provider’s reasonable control. Customer shall give Service Provider written notice of any claimed damage within five (5) days after Customer discovers or reasonably should have discovered it, and a reasonable opportunity to inspect, assess responsibility, obtain estimates, and approve or arrange repairs before incurring repair costs. Except for emergency action reasonably necessary to prevent further damage or a safety risk, Service Provider shall not be responsible for repair costs incurred without such notice and opportunity.",
  ],
  [
    "Release from Hauler Liability",
    "You agree not to hold Service Provider liable for claims you have against your waste and recycling haulers.",
  ],
  [
    "Non-Solicitation",
    "During the term of this Agreement and for one year following the expiration or termination date of the Agreement, Customer agrees not to directly solicit or induce any person who performs Services hereunder to leave the employ of the Service Provider. The Parties are not prohibited from responding to or hiring the other’s employees who inquire about employment on their own accord or in response to a public advertisement or employment solicitation in general.",
  ],
  [
    "Relationship of the Parties",
    "The relationship of the Parties hereto is that of independent contractors. Nothing in this Agreement, and no course of dealing between the Parties, shall be construed to create or imply an employment or agency relationship or a partnership or joint venture relationship between the Parties or between one Party and the other Party’s employees or agents. Each of the Parties is an independent contractor and neither Party has the authority to bind or contract any obligation in the name of or on account of the other Party or to incur any liability or make any statements, representations, warranties or commitments on behalf of the other Party, or otherwise act on behalf of the other. Each Party shall be solely responsible for payment of the salaries of its employees and personnel (including withholding of income taxes and social security), workers’ compensation, and all other employment benefits, in each case as applicable.",
  ],
  [
    "Force Majeure",
    "Neither Party shall be liable hereunder for any failure or delay in the performance of its obligations under this Agreement, except for the payment of money, if such failure or delay is on account of causes beyond its reasonable control, including civil commotion, war, fires, floods, accident, earthquakes, inclement weather, telecommunications line failures, electrical outages, network failures, governmental regulations or controls, casualty, strikes or labor disputes, terrorism, pandemics, epidemics, local disease outbreaks, public health emergencies, acts of God, or other similar or different occurrences beyond the reasonable control of the Party so defaulting or delaying in the performance of this Agreement, for so long as such force majeure event is in effect. Each Party shall use reasonable efforts to notify the other Party of the occurrence of such an event within five business days of its occurrence.",
  ],
  [
    "Collection of Expenses",
    "If Service Provider incurs any costs, expenses, or fees, including reasonable attorney’s fees and professional collection services fees, in connection with the collection or payment of any amounts due it under this Agreement, Customer agrees to reimburse Service Provider for all such costs, expenses and fees.",
  ],
  [
    "Terms & Conditions Updates",
    "Customer agrees that Service Provider may update these terms & conditions from time to time, at Service Provider’s sole discretion, and Customer agrees that any such updates shall become incorporated into the Terms & Conditions herein and binding on Customer upon Service Provider notifying Customer and providing Customer with a copy of such updates (email notification being sufficient).",
  ],
  [
    "Authorized Signatories",
    "It is agreed and warranted by the Parties that the individuals signing this Agreement on behalf of the respective Parties are authorized to execute such an agreement. No further proof of authorization shall be required.",
  ],
  [
    "Waiver",
    "No waiver of any term or right in this Agreement shall be effective unless in writing, signed by an authorized representative of the waiving Party. The failure of either Party to enforce any provision of this Agreement shall not be construed as a waiver or modification of such provision, or impairment of its right to enforce such provision or any other provision of this Agreement thereafter.",
  ],
  [
    "Rights Cumulative",
    "The rights and remedies of the Parties herein provided shall be cumulative and not exclusive of any rights or remedies provided by law or equity.",
  ],
  [
    "Counterparts",
    "This Agreement may be executed in one or more counterparts, each of which will be deemed to be an original, but all of which together will constitute one and the same instrument, without necessity of production of the others. An executed signature page delivered via facsimile transmission or electronic signature shall be deemed as effective as an original executed signature page.",
  ],
  [
    "Severability",
    "If any provision or portion of this Agreement shall be rendered by applicable law or held by a court of competent jurisdiction to be illegal, invalid, or unenforceable, the remaining provisions or portions shall remain in full force and effect.",
  ],
  [
    "Attorneys’ Fees",
    "If any action or proceeding relating to this Agreement or the enforcement of any provision of this Agreement is brought against any party hereto, the prevailing party shall be entitled to recover reasonable attorneys’ fees, costs and disbursements (in addition to any other relief to which the prevailing party may be entitled).",
  ],
  [
    "Governing Law and Venue",
    "This Agreement will be governed by and interpreted in accordance with the laws of the State of California, without giving effect to the principles of conflicts of law of such state. The Parties hereby agree that any action arising out of this Agreement will be brought solely in any state or federal court located in California, in the county of Alameda. Both Parties hereby submit to the exclusive jurisdiction and venue of any such court.",
  ],
  [
    "Special Terms",
    "We will coordinate directly with your hauler on late or missed pickups to avoid interruption in service, and arrange replacement or repair of any broken/damaged or missing bins.",
  ],
];
