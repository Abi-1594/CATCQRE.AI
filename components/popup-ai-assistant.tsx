"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Send,
  Bot,
  User,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  X,
  MessageCircle,
  Minimize2,
  Maximize2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  type: "user" | "agent"
  content: string
  timestamp: Date
  status?: "thinking" | "complete" | "error"
  explanation?: string
}

interface PopupAIAssistantProps {
  onAgentAction?: (action: string, data?: any) => void
  currentStep?: number
  processingStatus?: string
}

const COMPREHENSIVE_KNOWLEDGE = `
UNICEDE is a globally accepted industry data format managed by Verisk Analytics to standardize insurance data exchange. 
It's used by primary insurers, reinsurers, and reinsurance intermediaries with Touchstone, Touchstone Re, and CATRADER applications.

Key UNICEDE concepts:
- UNICEDE/2 enables exchange of aggregate sums insured, risk count, payroll and premium data
- Supports area and subarea codes for geographic classification
- Provides data validation reference for Touchstone exposure data
- Includes confidence scoring and quality assurance mechanisms
- Supports multiple versions (v2.7, v2.8, v2.9) with version-specific enhancements

EQUIPMENT CONSTRUCTION CODES (240s):
- 241 Boilers and Machinery: Boilers, pressure vessels, turbines, generators, compressors, pumps, motors
- 242 Electronic Data Processing: Computer equipment, servers, data processing machinery
- 243 Contractors Equipment: Construction machinery, bulldozers, cranes, excavators
- 244 Mobile Equipment: Vehicles, mobile machinery, transportation equipment
- 245 Miscellaneous Equipment: General equipment not classified elsewhere
- 246 Aircraft: Fixed-wing aircraft, helicopters, aviation equipment
- 247 Marine Hull: Ships, boats, marine vessels, offshore platforms

CONCRETE CONSTRUCTION CODES (130s):
- 131 Reinforced Concrete: Steel-reinforced concrete structures
- 132 Precast Concrete: Factory-manufactured concrete elements
- 133 Prestressed Concrete: High-strength concrete with tensioned cables
- 134 Concrete Block: Concrete masonry unit construction
- 135 Concrete Tilt-Up: Precast concrete panels tilted into place
- 136 Insulating Concrete Form: Foam forms filled with concrete
- 137 Concrete Frame: Concrete structural framework
- 138 Concrete Shear Wall: Concrete walls resisting lateral forces
- 139 Post-Tensioned Concrete: Concrete with post-installation tensioning
- 140 Concrete with Steel Frame: Hybrid concrete-steel construction
- 141 Concrete Composite: Mixed concrete construction types

BRIDGE CONSTRUCTION CODES (200s, 2000s):
- 201 Steel Truss Bridge: Steel framework bridge construction
- 202 Concrete Arch Bridge: Concrete arch structural design
- 203 Suspension Bridge: Cable-supported bridge design
- 2010 Simple Span Steel Girder: Basic steel beam bridge
- 2011 Continuous Steel Girder: Multi-span steel beam bridge
- 2012 Steel Truss: Steel framework bridge structure
- 2013 Steel Arch: Steel arch bridge design
- 2014 Suspension: Cable-suspended bridge structure
- 2015 Cable-Stayed: Cable-supported from towers
- 2020 Simple Span Concrete Girder: Basic concrete beam bridge
- 2021 Continuous Concrete Girder: Multi-span concrete beam
- 2022 Concrete Slab: Flat concrete bridge deck
- 2023 Concrete Tee Beam: T-shaped concrete beams
- 2024 Concrete Box Girder: Hollow concrete box beams
- 2025 Prestressed Concrete: High-strength concrete bridge
- 2026 Post-Tensioned Concrete: Tensioned concrete construction
- 2030 Concrete Arch: Concrete arch bridge structure
- 2031 Stone Arch: Natural stone arch construction
- 2040 Steel Frame with Concrete Deck: Composite construction
- 2041 Concrete Frame with Steel Deck: Mixed material bridge
- 2050 Timber Stringer: Wood beam bridge construction
- 2051 Timber Truss: Wood framework bridge
- 2052 Timber Arch: Wood arch bridge design
- 2060 Movable Bridge: Drawbridge, swing bridge, lift bridge
- 2061 Pontoon Bridge: Floating bridge structure

DAM CONSTRUCTION CODES (210s):
- 211 Concrete Dam: Reinforced concrete dam construction
- 212 Earth Fill Dam: Earthen embankment dam structure

AUTOMOBILE CONSTRUCTION CODES (260s):
- 261 Passenger Cars: Standard automobiles, sedans, coupes
- 262 Commercial Vehicles: Trucks, vans, commercial transport
- 263 Specialty Vehicles: Emergency vehicles, specialized transport

CHIMNEY CONSTRUCTION CODES (230s):
- 231 Masonry Chimney: Brick or stone chimney construction
- 232 Metal Chimney: Steel or aluminum chimney structure
- 233 Concrete Chimney: Reinforced concrete chimney design

MARINE CARGO CONSTRUCTION CODES (270s, 2700s):
- 270 Carpool: Open harbor areas for vehicle storage before shipping
- 271 General and Containerized Cargo: Standard shipping containers (8'x8.5'x20-40')
- 272 Heavy Cargo: Oversized machinery, rigs, construction equipment
- 273 Refrigerated Cargo: Temperature-controlled containerized goods
- 274 Dry Bulk Cargo: Coal, metal ore, lumber, grains (unpackaged)
- 275 Liquid Bulk Cargo: Oil, LNG, liquid chemicals in tank farms
- 276 General/Unknown: Composite marine cargo classification
- 280-285 Combustible versions of codes 270-275
- 290-295 Non-combustible versions of codes 270-275
- 2701-2720 Enhanced marine cargo codes (Touchstone 9.0+)
- 2710 General Cargo: Clothing, staples, consumer goods
- 2711 Heavy Industry: Manufacturing machinery, industrial equipment
- 2712 Light Industry: Household/office manufactured products
- 2713 Petroleum Products: Oil, gas, LNG with special storage
- 2714 Pharmaceuticals: Medical products in controlled conditions
- 2715 Project Cargo: Wind turbine components, railway cars
- 2716 Livestock: Animal transportation
- 2717 General Specie: Ornamental articles, arts, crafts
- 2718 Fine Art & Collectibles: Paintings, sculptures, valuable items
- 2719 Cash In Transit: Currency transportation
- 2720 Jewelers Blocks: Precious metals, stones, jewelry

LOCATION OFFSHORE PLATFORM FIELDS:
- PBN Definition: Complete platform identification (protraction + block + name)
- AIR Structure ID: Unique AIR-assigned platform identifier
- MMS Complex ID: BOEMRE identifier for connected structure groups
- MMS Structure Number: BOEMRE number for specific structures within complex
- Federal/State Waters: Administrative area classification
- Protraction/Area: Geographic protraction area location
- Block: Specific block within protraction area
- Replacement Value Physical Damage: Platform replacement cost
- Year Built: Construction/major upgrade year (1967-2067)
- Gas Production Rate: Daily gas production in Mcf (1,000 cubic feet)
- Oil Production Rate: Daily oil production in barrels
- Deck Height: Platform deck height above water (meters, 0-999)
- Slot Count: Licensed well drilling capacity (0-50 recommended)
- Slot Drill Count: Currently drilled wells (0-50 recommended)
- Leg Count: Platform leg count (0-44)
- Deck Count: Platform deck count (0-10)
- Trans Frame Type: Transverse framing shape (0-7 options)
- Topside Cost: Deck and equipment cost (0-100)
- Manned/Unmanned: Platform staffing status (0=Unknown, 1=Manned, 2=Unmanned)
- Company Size: Operating company size classification
- Well Count: Connected wells (0-100 recommended)

LOCATION SURROUNDING DETAIL FIELDS:
- Pounding: Distance to closest structure for earthquake collision risk (CA/HI/JP/NZ/US EQ)
  * Unknown/default (0), 0-0.25m (1), 0.25-0.5m (2), 0.5-1.0m (3), 1.0-2.0m (4), >2.0m (5)
- Tree Exposure: Tree hazard presence (HI TC, US HU/ST)
  * Unknown/default (0), No (1), Yes (2)
- Small Debris: Debris potential within 200ft radius (HI TC, US HU/ST)
  * Unknown/default (0), No (1), Yes (2)
- Large Missile: Large missile potential within 100ft (HI TC, US HU/ST)
  * Unknown/default (0), No (1), Yes (2)
- Terrain Roughness: Surrounding terrain conditions (US HU/ST)
  * Unknown/default (0), Large city centers (1), Urban/suburban (2), Open terrain (3), Flat unobstructed (4)
- Adjacent Building Height: Average height of nearby buildings (stories)
- Custom Flood Standard of Protection: Custom flood protection height (feet/meters, 0-30000)
- Custom Flood SOP Type: Protection type (H=Height, RP=Return Period)
- Custom Flood Zone: FEMA flood zone classification
  * Unknown/default (0), Zone A (1), Zone V (2), Zone X (3), Other (4)
- Custom Elevation: Local ground surface elevation (-999 for unknown)
- Firewise Community Participation: Firewise USA program participation (US WF)
  * Unknown/default (0), No (1), Yes (2)
- Exterior Fuel Storage: External fuel presence (US WF, added June 2024)
  * Unknown/default (0), No Exterior Fuel Storage (1), Exterior Fuel Storage (2)

LOCATION BASIC BUILDING FIELDS:
- Construction Code Type: Code system selection
  * Touchstone codes (default), ATC codes, ISO earthquake (ISE), ISO commercial fire (ISF), ISO dwelling fire, RMS Euro, RMS JPBLDG, RMS IND, RMS codes, RMS USER, ISO WC codes
- Construction Building: Primary building construction code (required)
- Construction Other Structures: Appurtenant structure construction code (optional)
- Construction Type: Primary construction material
  * Concrete, Masonry, Mixed, Steel, Wood
- Number of Stories: Building floor count (default: 1)
- Building Height: Building height in feet (default: 10)
- Stories: Floor count including half-stories (0-999, round up half-stories)
- Gross Area: Building gross area (0-15,000,000, affects US HU/EQ models)
- Gross Area Units: Area measurement units (Acre, Hectare, Square feet, Square meters)
- ISO Construction Code: ISO construction classification (optional)
- ISO Occupancy Code: ISO occupancy classification (optional)
- Building Value per Gross Area: Calculated replacement value ratio (read-only)
- Territory: User-defined territory code (30 characters max)
- Building Height Units: Height measurement (Feet, Meters)

LOCATION ROOF DETAIL FIELDS:
- Roof Geometry: Roof shape classification (HI TC, US HU/ST/WF)
  * Unknown/default (0), Flat (1), Gable end without bracing (2), Hip (3), Complex (4), Stepped (5), Shed (6), Mansard (7), Gable end with bracing (8), Pyramid (9), Gambrel (10)
- Roof Pitch: Roof slope classification (HI TC, US HU/ST)
  * Unknown/default (0), Low <10° (1), Medium 10-30° (2), High >30° (3)
- Roof Covering: Roof material type (AU/HI/US WF, US HU/ST)
  * Unknown/default (0), Asphalt shingles (1), Wooden shingles (2), Clay/concrete tiles (3), Light metal panels (4), Slate (5), Built-up roof with gravel (6), Single-ply membrane (7), Standing seam metal (8), Built-up roof without gravel (9), Single-ply membrane ballasted (10), Hurricane Wind-Rated (11), Photovoltaic (12)
- Roof Deck: Deck material and construction (CA/HI/JP/NZ/US EQ, HI TC, US HU/ST)
  * Unknown/default (0), Plywood (1), Wood planks (2), Particle board/OSB (3), Metal deck with insulation (4), Metal deck with concrete (5), Pre-cast concrete slabs (6), Reinforced concrete slabs (7), Light metal (8)
- Roof Covering Attachment: Covering connection type (HI TC, US HU/ST)
  * Unknown/default (0), Screws (1), Nails/staples (2), Adhesive/epoxy (3), Mortar (4)
- Roof Deck Attachment: Deck connection type (US HU/ST)
  * Unknown/default (0), Screws/bolts (1), Nails (2), Adhesive/epoxy (3), Structurally connected (4), 6d nails @ 6" spacing 12" on center (5), 8d nails @ 6" spacing 12" on center (6), 8d nails @ 6" spacing 6" on center (7)
- Roof Anchorage: Roof-to-wall connection (HI TC, US HU/ST)
  * Unknown/default (0), Hurricane Ties (1), Nails/Screws (2), Anchor bolts (3), Gravity/friction (4), Adhesive epoxy (5), Structurally Connected (6), Clips (7)
- Roof Hail Impact Resistance: UL2218 classification (US ST Hail, HI TC, US HU/ST)
  * Unknown/Non-impact-resistant (0), Impact-resistant A (1), B (2), C (3), D (4)
- Roof Year Built: Roof construction year (1000-current year, max 2100)
- Tank: Rooftop tank presence on adjacent buildings (CA/HI/JP/US EQ)
  * Unknown/default (0), No (1), Yes (2)
- Chimney: Chimney presence and height (CA/HI/JP/US EQ)
  * Unknown/default (0), No (1), Yes <2ft (2), Yes 2-5ft (3), Yes >5ft (4)
- Skylight: Skylight type (US WF, added June 2024)
  * Unknown/Default - Fixed (0), No Skylights (1), Operable (2)
- Fire Rating for Roof Covering: Fire resistance rating (US/AU WF, added June 2024)
  * Unknown/No Rating (0), Fire Rated Class A (1), B (2), C (3)
- Soffits: Soffit construction (US/AU WF, added June 2024)
  * Unknown/Default (0), No Soffit (1), Aluminum/Vinyl Designed for Wind (2), Aluminum/Vinyl Not Designed for Wind (3), Other Designed for Wind (4), Other Not Designed for Wind (5)
- Roof Overhang: Overhang dimensions (US/AU WF, added June 2024)
  * Unknown/Default (0), No Overhang (1), 8-36 inches (2), <8 inches (3), >36 inches (4)
- Roof Vents: Vent presence (US/AU WF, added June 2024)
  * Unknown/Default (0), No Roof Vents (1), Roof Vents (turbines, goose neck, ridge vents) (2)
- Roof Vent Size: Vent mesh size (US WF, added June 2024)
  * Unknown/Default (0), 1/8" or Smaller Mesh or Wildfire Resistant (1), 1/4" or No Mesh (2)

LOCATION CONTRACT FIELDS:
- Contract ID: Parent contract identifier (read-only)
- Location ID: User-defined location identifier (required, 1-100 characters, no leading spaces/commas/semicolons)
- Location Name: Location descriptive name (optional, 100 characters max)
- Location Group Name: Campus grouping name (required for groups, 60 characters max)
- Primary Location: Campus primary designation (0=non-primary, 1=primary)
- ISOBIN: ISO Building Identification Number (optional, 14 characters max)
- Inception Date: Coverage start date (required, MM/DD/YYYY, DD/MM/YYYY, YYYYMMDD, YYYY-MM-DD)
- Expiration Date: Coverage end date (required, same formats as inception)

LOCATION VALUES FIELDS:
- Display Currency: Financial display currency (read-only, ISO 3-character codes)
- Total Replacement Value: Combined coverage replacement value (0-999,999,999,999,999)
- Replacement Value Building: Building replacement value (0-999,999,999,999,999)
- Replacement Value Other: Appurtenant structures value (0-999,999,999,999,999)
- Replacement Value Content: Contents replacement value (0-999,999,999,999,999)
- Replacement Value Time: Annual time element coverage cost (0-999,999,999,999,999)
- Replacement Value Days Covered: Time coverage period (1-365 days, default 365)
- Number of Employees: Covered employee count (1-999,999,999, required for Japan)
- Annual Payroll: Total annual payroll (1-999,999,999, workers' comp only)
- Average Annual Wage: Average employee wage (1-999,999,999, workers' comp only)
- Percent Day Shift: Day shift employee percentage (US: 0.00-1.00, Japan: 0-100)
- Percent Evening Shift: Evening shift percentage (0.00-1.00, workers' comp only)
- Percent Night Shift: Night shift percentage (0.00-1.00, workers' comp only)
- Medical and Indemnity Minor: Minor injury payment rate (1-999,999,999, workers' comp)
- Medical and Indemnity Moderate: Moderate injury payment rate (1-999,999,999, workers' comp)
- Medical and Indemnity Major: Major injury payment rate (1-999,999,999, workers' comp)
- Medical and Indemnity Fatality: Fatality payment rate (1-999,999,999, workers' comp)
- Number of Risks: Risk count for location (1-999,999,999, default 1)
- Per Diem Rate: Daily time element value (read-only calculation)
- Premium: Total location premium (optional, informational only)

LOCATION WALL DETAIL FIELDS:
- Wall Type: External wall materials (CA/HI/JP/NZ/US EQ, HI TC, US HU/ST)
  * Unknown/default (0), Brick/unreinforced masonry (1), Reinforced masonry (2), Plywood (3), Wood planks (4), Particle board/OSB (5), Metal panels (6), Pre-cast concrete elements (7), Cast-in-place concrete (8), Gypsum board (9)
- Wall Siding: Weather protection materials (AU/CA/HI/JP/NZ/US EQ/WF, HI TC, US HU/ST)
  * Unknown/default (0), Veneer brick/masonry (1), Wood shingles (2), Clapboards (3), Aluminum/vinyl siding (4), Stone panels (5), Exterior insulation finishing system (6), Stucco (7), Fiber cement board (8)
- Garage Doors: Garage door reinforcement (HI TC, US HU/ST)
  * Unknown/default (0), Non-reinforced garage doors (1), Reinforced garage doors (2)
- Roof Covering: Roof covering type (HI TC, US HU/ST)
  * Unknown/default (0), Asphalt shingles (1), Wood shingles (2), Clay tiles (3), Concrete tiles (4), Metal (5), Slate (6), Other (7)
- Building Exterior Opening: Wall opening percentage (CA/HI/JP/NZ/US EQ)
  * Unknown (0), Less than 50% open/default (1), More than 50% open (2)
- Brick Veneer: Brick veneer percentage (CA/HI/JP/US EQ)
  * Unknown/default 50-90% (0), More than 90% (1), 25-50% (2), 0-25% (3)
- Fire Rating for Wall Siding: Wall fire resistance (AU/US WF, added June 2024)
  * Unknown/No Rating (0), Fire Rated Class A (1), B (2), C (3)

LOCATION CONNECTION DETAIL FIELDS:
- Roof Attached Structure: Roof equipment/structures (HI TC, US HU/ST/WF)
  * Unknown/default (0), Chimneys (1), A/C Units (2), Skylights (3), Parapet Walls (4), Overhang/Rake 8-36" (5), Dormers (6), Other (7), No Attached Structures (8), Overhang/Rake <8" (9), Overhang/Rake >36" (10), Waterproof membrane (11), Secondary water resistance Yes (12), No (13)
- Transition in SRC Type: SRC to RC column transition (JP EQ)
  * Unknown/default (0), Smooth (1), Non-Smooth (2)
- Cold Formed Tube: Cold-formed tube presence (JP EQ)
  * Unknown/default (0), No (1), Yes (2)
- Column Basement Type: Column-basement connection (JP EQ)
  * Unknown/default (0), Mixed (1), Non-Embedded (2), Embedded (3)
- Welding Detail: Welding quality (JP EQ)
  * Unknown/default (0), On-Site (1), In-House (2)
- Foundation Connection: Structure-foundation connection (CA/HI/JP/NZ/US EQ, HI TC, US HU/ST)
  * Unknown/default (0), Hurricane ties (1), Nails/Screws (2), Anchor Bolts (3), Gravity/Friction (4), Adhesive/Epoxy (5), Structurally Connected (6)
  * For industrial facilities: Unknown/default (0), Unanchored (4), Anchored (6)
- Internal Partition: Interior partition materials (CA/HI/JP/US EQ)
  * Unknown/default (0), Wood (1), Gypsum boards (2), Plastered masonry (3), Brick (4), Other (5)
- Wall Attached Structure: Attached building structures (HI TC, US HU/ST)
  * Unknown/default (0), Carports/Canopies/Porches (1), Single Door Garages (2), Double Door Garages (3), Reinforced Single Door Garages (4), Reinforced Double Door Garages (5), Screened Porches/Glass Patio Doors (6), Balcony (7), No attached wall structures (8)
- Appurtenant Structure: Detached structures (HI TC, US HU/ST)
  * Unknown/default (0), Detached garage (1), Pool enclosures (2), Shed (3), Masonry boundary wall (4), Other fence (5), No appurtenant structures (6), No pool enclosures (7)
- Basement Level Count: Number of basement levels (GB/MY/ID/SEU/SK/UK/ROI IF, US HU/IF)
  * 0 = Unknown/default, positive values require Masonry basement (1) or Concrete basement (2) foundation type
- Basement Finish Type: Basement completion status (MY/ID/SK/UK/ROI IF, US HU/IF)
  * Unknown/default (0), Unfinished basement (1), Finished basement (2)
- Deck: Deck construction (AU/US WF, added Touchstone 2024)
  * Unknown/default (0), No Deck (1), Deck: Unknown Construction (2), Deck: Non-combustible Construction (21), Deck: Combustible Construction (22)
- Gutter: Gutter configuration (AU/US WF, added Touchstone 2024)
  * Gutter - material/cover unknown (0), Gutter with guard/cover (1), Gutter without guard/cover (2), No gutter (3)
- Fences Within 5 ft: Nearby fence materials (US WF, added Touchstone 2024)
  * Unknown (0), No fences (1), Non combustible (2), Combustible (3), plus detailed combustible subcategories (301-3022)

LOCATION USER-DEFINED FIELDS:
- UDF 1-5: User-defined fields (optional, 60 characters each)
- Location DFID: Damage function ID for Model Builder connection (optional, 60 characters)

COMPREHENSIVE OCCUPANCY CODES CLASSIFICATION SYSTEM:

TRANSPORTATION OCCUPANCY CODES (350s):
- 351 Highway: SIC 41,42 - Highway passenger transportation, terminal facilities
- 352 Railroad: SIC 40 - Line-haul railroad, switching and terminal establishments
- 353 Air: SIC 45 - Transportation services, forwarding, packing, passenger/freight arrangement
- 354 Sea and Inland Waterways: SIC 44 - Freight/passenger transportation on seas/inland waters, lighterage, towing
- 355 Aircraft Hangars: n/a - Aircraft parking facilities (US, Australia, Canada, South America, Caribbean, Japan, South Korea, China, Taiwan, Europe wind, New Zealand earthquake)
- 356 Aircraft at Ramps/Gates: n/a - Aircraft at boarding gates (Japan only, use with 246 for Earthquake-Fire Following)

UTILITY OCCUPANCY CODES (360s):
- 361 Electrical Utilities: SIC 49 - Electric power generation, transmission, distribution
- 362 Water Utilities: SIC 49 - Water distribution for domestic, commercial, industrial use
- 363 Sanitary Sewer: SIC 49 - Waste collection/disposal through sewer systems, treatment plants, incinerators, landfills
- 364 Natural Gas: SIC 49 - Natural gas transmission, distribution, storage
- 365 Telephone and Telegraph: SIC 48 - Paging, beeper services, telephone line leasing, optical fiber, microwave, satellite

SOLAR OCCUPANCY CODES (3000s) - Touchstone 2025 Severe Thunderstorm Model US:
- 3001 Residential Solar Energy Risk - Residential assets
- 3011 Commercial Solar Energy Risk - Commercial assets
- 3020 Utility Solar Unknown - Utility-scale capacity unknown
- 3021 Utility Solar Small - Under 5 MW capacity
- 3022 Utility Solar Medium - 5-25 MW capacity
- 3023 Utility Solar Large - Above 25 MW capacity

RESTAURANT OCCUPANCY CODE (330s):
- 331 Restaurants: SIC 58 - Restaurants, fast food, cafés, bars (US, South America, Australia, Canada, Caribbean, Japan, South Korea, China, Taiwan, Europe wind, New Zealand earthquake)

RESIDENTIAL OCCUPANCY CODES (300s):
- 300 Unknown - Occupancy unknown (remapped to 100-311 General Commercial when combined with construction 100)
- 301 General Residential - Composite of all residential occupancies
- 302 Permanent Dwelling Single Family - Single-unit detached dwellings
- 303 Permanent Dwelling Multi Family - Multiple-unit dwellings (typically 4 units or less)
- 304 Temporary Lodging: SIC 70 - Hotels, motels, boarding houses, lodging houses
- 305 Group Institutional Housing - College dormitories, nursing homes, retirement centers
- 306 Apartments/Condominiums - Attached multi-unit housing (more than 4 units)
- 307 Terraced Housing - Attached residential units (common in Europe/UK)
- 367 Residential Land - Land within residential property boundary (New Zealand earthquake model)
- 382 Residential Construction/Erection Risks - Under-construction residential buildings

PUBLIC OCCUPANCY CODES (340s):
- 341 Religion and Non-Profit: SIC 86 - Trade associations, professional organizations, labor unions, political/religious organizations
- 342 Church - Religious worship establishments, training, administration
- 343 Government General Services: SIC 91 - Executive offices, legislative bodies, general government
- 344 Government Emergency Services: SIC 92 - Justice, public order, safety establishments

MERCANTILE OCCUPANCY CODES (330s):
- 335 Gasoline Stations: SIC 55 - Retail gasoline sales with associated stores/service bays (US, South America, Australia, Canada, Caribbean, Japan, South Korea, China, Taiwan, Europe wind, New Zealand earthquake)
- 336 Automotive Repair Shops and Car Washes: SIC 75 - Motor vehicle repair/service without gasoline sales (US, South America, Australia, Canada, Caribbean, Japan, South Korea, China, Taiwan, Europe wind, New Zealand earthquake)

INDUSTRIAL FACILITY OCCUPANCY CODES (400s):
- 400 Unknown Industrial Facility - Composite of all industrial facilities
- 401 Heavy Fabrication and Assembly General - Large warehouses with cranes, manufacturing automobiles, metal products, machinery
- 402 Automotive Manufacturing - Large facilities assembling automobiles (20K-1M+ cars/year)
- 403 Fabricated Metal Products - Metal structure building facilities with welding, cutting equipment
- 404 Industrial and Commercial Machinery - Manufacturing machines, tools, factory equipment
- 405 Transportation Equipment Assembly - Building planes, trains, buses
- 415 Heavy Fabrication and Assembly General - Capital-intensive manufacturing for business use
- 416 Chemical, Petroleum, Rubber Manufacturing - Large automated facilities near transportation routes
- 417 Food and Beverage Manufacturing - Processing facilities with tanks, fermentation equipment
- 418 Textile, Apparel, Leather Manufacturing - Fabric processing into consumer goods
- 419 Wood Products Manufacturing - Lumber processing facilities
- 430 Food and Kindred Products - Food/beverage processing with refrigeration, freezing capabilities
- 431 Tobacco Products - Tobacco leaf processing into finished products
- 432 Pharmaceutical Plants - Drug manufacturing with clean rooms, quality control
- 433 Biological Products - Medical biologics from natural sources
- 434 Wineries - Grape processing, fermentation, aging, bottling facilities
- 438 Chemical Processing General - Basic chemicals, acids, alkalis, organic chemicals
- 439 Chlorine Plants - Chlorine production through electrolysis
- 440 Vinyl Plants - PVC resin manufacturing from VCM
- 441 Light Hydrocarbon/Aromatics Plants - Petrochemical processing of naphtha/natural gas
- 442 Plastics Plants - Polymer production for plastic manufacturing
- 443 Chlorohydrin Plants - Propylene oxide manufacturing
- 444 Fertilizer Plants - Ammonia-based fertilizer production
- 445 Cement Plants/Mills - Clinker crushing, rotary kiln heating
- 446 Other Chemical and Allied Products - Fine chemicals, R&D facilities, paints, resins
- 449 Metal and Minerals Processing General - Smelting, refining, casting, metal fabrication
- 450 Primary Metal Industry - Ferrous/nonferrous metal processing from ore/scrap
- 451 Steel Mills - Steel alloy manufacturing from coal/iron ore
- 452 Smelters - Raw ore processing to pure metal extraction
- 455 High Technology General - Electrical equipment, instruments, semiconductor manufacturing
- 456 Semiconductor and Related Devices - Integrated circuit manufacturing with clean rooms
- 457 Electronic Computer Devices - Computer/electronic equipment assembly
- 458 Computer Storage Devices - Data storage device manufacturing
- 459 Electron Tubes - Legacy electron tube manufacturing
- 460 Printed Circuit Boards - PCB manufacturing with clean rooms
- 463 General Building/Construction Contractors - Residential, commercial, industrial construction
- 464 Heavy Construction - Infrastructure projects, highways, bridges, tunnels
- 465 Special Trade Contractors - Specialized construction trades (plumbing, electrical, HVAC)
- 470 Mining General - Mineral extraction from geological deposits
- 471 Mining Operations - Ore extraction with heavy equipment, conveyor systems
- 472 Metal Mining - Metal ore extraction and processing
- 473 Coal Mining - Underground/surface coal extraction
- 474 Mining/Quarrying Non-Metallic Minerals - Limestone, sand, gravel, precious gems
- 475 Oil Refinery Systems - Crude oil processing into petroleum products
- 476 Hydro-Electric Power Systems - Water-powered electricity generation
- 477 Thermo-Electric Power Systems - Heat-to-electric power conversion
- 479 Electric Substations - Voltage transformation facilities
- 480 Potable Water Systems - Drinking water treatment and distribution
- 481 Waste Water Treatment Systems - Sewage and wastewater processing
- 482 Gas Processing Systems - Natural gas cleaning and processing
- 486 Port Systems International - International container ports (Japan earthquake/typhoon only)
- 487 Port Systems Domestic - Domestic ports (Japan earthquake/typhoon only)
- 488 Airport Systems General - Public-use airports (2,500+ passengers annually)

EDUCATION OCCUPANCY CODES (340s):
- 345 Universities, Colleges, Technical Schools: SIC 82 - Higher education institutions, libraries, curriculum development
- 346 Primary and Secondary Schools: SIC 82 - K-12 education institutions (US, Australia, Canada, South America, Caribbean, Japan, South Korea, China, Taiwan, Europe wind, New Zealand earthquake)

MARINE CARGO OCCUPANCY CODES (1000s) - Touchstone 9.0+:
- 1001 Designated Facilities/Vaults - Special cargo storage (explosives), fine arts, specie
- 1002 Silo - Bulk material storage towers
- 1003 Liquid Tanks - Port area liquid storage
- 1004 Gas Tanks - Port area gas storage
- 1005 Inside Warehouse at Port - Non-containerized port warehouse storage
- 1006 Containerized Inside Warehouse - Containerized port warehouse storage
- 1007 Containerized Stacked Outside - Open area containerized storage
- 1008 Open Lot or Stockpiled Outside - Open area non-containerized storage
- 1009 At Destination in Warehouse - Inland warehouse storage
- 1010 At Destination Retail - Retail space contents
- 1011 Museums, Institutions, Public Buildings - Fine arts in museums/institutions
- 1012 Retail & Private Buildings - Fine arts/specie in private/retail buildings

MISCELLANEOUS OCCUPANCY CODES (370s):
- 371 Communication: SIC 48 - Point-to-point communications, radio/TV broadcasting
- 372 Flood Control - Government water resource management, pollution control
- 373 Agriculture: SIC 01,02 - Soil preparation, crop services, veterinary services
- 374 Greenhouses - Crop production facilities (Europe, South America, Southeast Asia, China, US Severe Thunderstorm)
- 375 Forestry: SIC 08 - Forest operations (Europe only, zero losses with some models)
- 381 Construction/Erection Risks - Composite under-construction buildings

OFFSHORE ASSET OCCUPANCY CODES (900s):
- 900 Unknown - Offshore platform occupancy unknown
- 901 Oil Production Only - Oil-only production platforms
- 902 Gas Production Only - Gas-only production platforms
- 903 No Production - Non-production platforms
- 904 Oil and Gas Production - Combined oil/gas platforms
- 905 Drilling - Drilling platforms
- 906 Workover - Well repair/stimulation platforms
- 907 Ready Stacked - Non-contracted but service-ready rigs
- 908 Waiting on Location - Location-waiting rigs
- 909 Pipelines - Pipeline systems (accumulation only)

COMMERCIAL OCCUPANCY CODES (310s):
- 311 General Commercial - Composite of all commercial occupancies
- 312 Retail Trade: SIC 52-59 - Retail stores, automotive dealers, drug stores, bookstores
- 313 Wholesale Trade: SIC 50-51 - Wholesale distribution of durable/non-durable goods
- 314 Personal and Repair Services: SIC 72,75,76 - Laundry, beauty shops, automotive repair
- 315 Professional, Technical, Business Services: SIC 60-67,73,81,87,91,93-97 - Financial, legal, engineering, government
- 316 Health Care Services: SIC 80 - Medical, surgical, health services, hospitals, clinics

CONSTRUCTION/ERECTION RISK CODES (380s-390s):

LOCATION BUILDER'S RISK FIELDS VALIDATION:
- Project Completion: Numeric 0-99 (percentage completed, applies only to Average Project Loss phase)
- Project Phase Code: No Builder's Risk (0), Phase 1 Foundation (1), Phase 2 Superstructure (2), Phase 3 Walls/Roofing (3), Phase 4 Interiors/Mechanical (4), Average Project Loss (5), Worst Loss (6)

Geographic and Model Limitations:
- Many codes have specific regional support (US, Australia, Canada, South America, Caribbean, Japan, South Korea, China, Taiwan, Europe wind coverage)
- Construction/Erection risks supported in China, India, South Korea, Southeast Asia, South America, Japan, Middle East, Central Europe, New Zealand, Australia
- Solar codes specific to Touchstone 2025 Severe Thunderstorm Model for United States
- Marine cargo codes supported in Touchstone 9.0+ with specific model compatibility
- Some codes require specific construction code pairings (e.g., marine hull codes with construction 260)
- Bridge codes primarily supported in US and Canada (not with Severe Thunderstorm peril)
- Equipment codes have Coverage C limitations (supported for Inland Transit 259 and specific tank/pipeline codes)

Data quality principles:
- Geocoding confidence scores ensure location accuracy
- Business rule validation maintains data integrity
- Pattern matching against known good data improves reliability
- Row Level Security (RLS) protects sensitive information
- Exposure data validation maximizes import success rates
- SIC codes provide industry classification context where applicable
- Model documentation on Client Portal provides specific limitations and supported regions
- Field dependencies ensure data consistency (e.g., floor of interest cannot exceed number of stories)
- Date validation requires values between 01/01/1970 and 12/31/2038 for US regional settings
- Currency codes must be valid ISO currency codes
- Address field dependencies automatically clear lower-level fields when higher-level fields change
`

const TRAINING_DATA = `
PAVEMENT CONSTRUCTION CODES (200s):
- 204 Railroads: Railroads of any kind used to carry trains
- 205 Highways: Concrete, asphalt, or gravel highways
- 206 Runways: Concrete or asphalt airport runways

OFFSHORE ASSET CONSTRUCTION CODES (240, 800s):
- 240 Offshore Wind Turbines: Offshore wind turbines installed individually and in groups called "wind farms". Wind turbine systems comprise a tower, hub and blades (the rotor), and nacelle (houses the generator). They are typically attached to a reinforced concrete foundation. Based on the wind characteristics of the site, these structures are generally designed to conform to the International Electrotechnical Commission (IEC) 61400-1 wind turbine design class.
- 800 Unknown: Use this code when the platform construction class is not known.
- 801 Caisson: Caisson platforms use large diameter caissons to support a single well completion with a minimal deck. The deck is capable of supporting limited production, control equipment, and navigational aids. Caisson platform completions are limited to water depths of 100 feet or less.
- 802 Compliant Tower: Narrow, flexible towers and piled foundations that can support a conventional deck for drilling and production operations. Unlike fixed platforms, compliant towers withstand large lateral forces by sustaining significant lateral deflections and are usually used in water depths between 1,000 and 2,000 feet.
- 803 Fixed Jacket Platform: Jackets (a tall vertical section made of tubular steel members supported by piles driven into the seabed) with a deck placed on top, providing space for crew quarters, a drilling rig, and production facilities. Fixed jacket platforms are economically feasible for installation in water depths up to 1,500 feet.
- 804 Jackup: Platforms that can be jacked up above the sea using legs that can be lowered like jacks. These platforms, used in relatively low depths, are designed to move from place to place and then anchor themselves by deploying the jack-like legs.
- 805 Mini Tension Leg Platform (MTLP): Floating platforms of relatively low cost developed for production of smaller deepwater reserves that would be uneconomic to produce using more conventional deepwater production systems. They can also be used as a utility, satellite, or early production platform for larger deepwater discoveries.
- 806 Drill Rig: Drill rig.
- 807 Semi-Submersible: These platforms have legs of sufficient buoyancy to cause the structure to float, but weight sufficient to keep the structure upright. These rigs can be moved from place to place and ballasted up or down by altering the amount of flooding in buoyancy tanks. They are generally anchored by cable anchors during drilling operations, though they can also be kept in place by the use of dynamic positioning. Semi-submersibles can be used in depths from 200 to 6,000 feet.
- 808 Floating Production System: Maritime vessels that have been fitted with drilling apparatuses. They are most often used for exploratory drilling of new oil or gas wells in deep water, but can also be used for scientific drilling. They are often built on modified tanker hulls and outfitted with dynamic positioning systems to maintain their position over a well. Drill ships are able to drill in water depths of over 6,500 feet.
- 809 Drill Ship: Maritime vessels that have been fitted with drilling apparatuses. They are most often used for exploratory drilling of new oil or gas wells in deep water, but can also be used for scientific drilling. They are often built on modified tanker hulls and outfitted with dynamic positioning systems to maintain their position over a well. Drill ships are able to drill in water depths of over 6,500 feet.
- 810 SPAR Floating Production System: Large diameter single vertical cylinder supporting a deck. They have typical fixed platform topsides (surface decks with drilling and production equipment), three types of risers (production, drilling, and export), and hulls moored with taut caternary systems of 6 to 20 lines anchored into the seafloor. SPARs are generally used in water depths up to 3,000 feet.
- 811 Submersible Production System: Floating vessels, usually used as mobile offshore drilling units (MODUs), that are supported primarily on large pontoon-like structures submerged below the sea surface. The operating decks are elevated 100 or more feet above the pontoons on large steel columns. Once on the desired location, this type of structure is slowly flooded until it rests on the sea floor. After the well is completed, the water is pumped out of the buoyancy tanks, and the vessel is refloated and towed to the next location. Submersibles operate in relatively shallow water because they must rest on the seafloor.
- 812 Underwater Production Units, Completion Units, and Templates: Subsea Systems range from single subsea wells producing to a nearby platform, FPS, or TLP to multiple wells producing through a manifold and pipeline system to a distant production facility. These systems are presently used in water depths greater than 5,000 feet.
- 813 Tension Leg Platform: A floating structure held in place by vertical, tensioned tendons connected to the sea floor by pile-secured templates. Tensioned tendons provide for the use of a TLP in a broad water depth range with limited vertical motion. Larger TLPs have been successfully deployed in water depths approaching 4,000 feet.

SOLAR CONSTRUCTION CODES (500s) - Touchstone 2025 Severe Thunderstorm Model US:
- 500 Solar, rooftop (unknown anchorage): Panels on flat or pitched roof, unknown mount.
- 501 Solar, rooftop, anchored: Panels attached to the roof using anchors. Typically these are mounted on a pitched roof at the same angle as the pitch of the roof.
- 502 Solar, rooftop, ballasted: Panels mounted on flat roof using ballasts. Typically these are mounted at a fixed angle.
- 510 Solar ground mounted (on tracker or fixed): Panels on unknown mount type.
- 511 Solar ground mounted, single axis: Panels move on one axis, typically to track sun east to west.
- 512 Solar ground mounted, dual axis: Panels move on two axes, typically to track sun east to west at a range of altitudes.
- 513 Solar ground mounted, fixed tilt: Panels on a ground-level racking system at a fixed angle.
- 514 BESS (battery energy storage system): Battery system for ground-mounted solar installations, any occupancy.

MISCELLANEOUS CONSTRUCTION CODES (250s-260s):
- 250 Railway Property: Railway properties are composed of major components of railway systems, which include railway stations, railway tunnels, railway bridges, railway tracks, and cables along the tracks but excluding trains. Warning: This code is not valid for any peril in the United States, for the Verisk Typhoon Model for South Korea, or for the Verisk Bushfire Model for Australia.
- 251 Pumping Stations: Structures with mechanical devices that are typically used when a fluid material must be raised from a low point to a point of higher elevation, or where the topography prevents downhill gravity flow
- 252 Compressor Stations: Structures with mechanical devices that are used for increasing the pressure of a gas by mechanically decreasing its volume
- 253 Cranes: Machines used for raising, shifting, and lowering heavy weights by means of a projecting swinging arm or by means of a hoisting apparatus supported on an overhead track
- 254 Conveyor Systems: Devices used for moving loose material (typically on a belt, on rollers, or in an auger)
- 255 Canals: An artificial waterway of any depth used for draining or irrigating land or for navigation
- 256 Earth Retaining Structures: Earth retaining structures taller than 20 feet high
- 257 Waterfront Structures: Wharves or docks built next to the shore of navigable waters so that ships can receive and discharge cargo and passengers, or walls of artificially enclosed basins into which vessels are brought for inspection and repair
- 258 Offshore Structures: A structure that is anchored to the ground under the ocean
- 259 Transit Warehouse: Often refers to distribution centers that temporarily store various commodities for further distribution, including wholesale stores. The commodities can be light (e.g., food, drug, light fabrication of clothing, high-technology electrical items) or heavy (e.g., heavy construction machineries). Warehouses are typically one-story steel frame or SRC (steel-reinforced concrete) construction with high ceilings. Most of the commodities are well packed and can be stacked during storage.
- 260 Marine Hull: Marine hull insurance covers the hull and machinery of a vessel. Specific ports or docks include loading or unloading (port risk), under construction (builders' risk), and repair (repairing risk). When paired with a particular occupancy code, reflects the vulnerability of the hull: 300-reflects the vulnerability of the hull in unknown conditions. 314-reflects the vulnerability of the hull under repair. 354-reflects the vulnerability of the hull at port. 381-reflects the vulnerability of the hull under construction.

MASONRY CONSTRUCTION CODES (110s):
- 111 Masonry: Use this option when the exterior walls are constructed of masonry materials, but detailed construction information is unavailable or unknown.
- 112 Adobe: Adobe construction uses adobe (clay) blocks with cement or cement-clay mixture as mortar. The roof consists of a timber frame with clay tiles or, in some cases, metal roofing.
- 113 Rubble Stone Masonry: Rubble stone masonry consists of low-rise perimeter load-bearing walls composed of irregular stones laid as coursed or uncoursed rubble in a cement mortar bed, with floor and roof joists constructed with wood framing.
- 114 Unreinforced Masonry - Bearing Wall: Unreinforced masonry buildings consist of structures in which there is no steel reinforcing within a load-bearing masonry wall. Floors, roofs, and internal partitions in these bearing wall buildings are usually of wood.
- 115 Unreinforced Masonry - Bearing Frame: Unreinforced masonry is used for infill walls of buildings with a bearing frame. In this structure type, the masonry is intended to be used not to support gravity loads, but to assist with lateral loads.
- 116 Reinforced Masonry: Reinforced masonry construction consists of load bearing walls of reinforced brick or concrete-block masonry. Floor and roof joists constructed with wood framing are common.
- 117 Reinforced Masonry Shear Wall (with MRF): Reinforced masonry construction consists of load-bearing walls of reinforced brick or concrete-block masonry. Reinforced masonry buildings with "Moment Resisting Frames" carry lateral loads by bending. "Shear Walls" are continuous reinforced brick or reinforced hollow concrete block walls extending from the foundation to the roof and can be exterior walls or interior walls.
- 118 Reinforced Masonry Shear Wall (without MRF): Reinforced masonry construction consists of load-bearing walls of reinforced brick or concrete-block masonry. "Shear Walls" are continuous reinforced brick or reinforced hollow concrete block walls extending from the foundation to the roof and can be exterior walls or interior walls.
- 119 Joisted Masonry: Masonry exterior walls with roof of combustible materials on non-combustible supports.
- 120 Confined Masonry: Confined masonry is a construction system in which plain masonry walls are confined on all four sides by reinforced concrete or reinforced masonry members. The walls themselves, however, carry all the gravity and lateral loads. Currently supported for locations in Australia, the Caribbean, Central America, China, Mexico, New Zealand, South America, South Korea, and Taiwan, for some locations in Europe, including Central Europe.
- 121 Cavity Double Brick: An unreinforced masonry construction type composed of two layers of bricks, common in many cities in Australia. Currently supported only for some locations in Australia and New Zealand.

MARINE CRAFT CONSTRUCTION CODES (260s):
- 265 Pleasure Boats and Yachts: Typically, privately-owned boats that can be used for recreation, fishing, or cruising. This description is meant to exclude commercial vessels, such as cargo ships or tugboats. Use this construction code if the boat's power/sail classification is unknown.
- 266 Pleasure Boats and Yachts, Power Boats: A pleasure boat that is powered only by a motor (no sails)
- 267 Pleasure Boats and Yachts, Sail Boats: A pleasure boat that is capable of being powered by wind through the use of sails. Use this construction code to model boats that have both sails and a motor.

MOBILE HOME CONSTRUCTION CODES (190s):
- 191 Mobile Homes: Represents a weighted average of tie-down types, including no tie-downs. Use this code for a mobile home (manufactured home) when the tie-down information is unknown.
- 192 Mobile Home with No Tie-Downs: Use this code for a mobile home (manufactured home) with no anchoring systems present.
- 193 Mobile Home with Partial Tie-Downs: Use this code for a mobile home (manufactured home) when the tie-downs are either over-the-top ties or frame ties, but not both, or with fewer ties than recommended by the manufacturer.
- 194 Mobile Home with Full Tie-Downs: Use this code for a mobile home (manufactured home) when the anchoring system uses both over-the-top ties and frame ties. Typically, ten frame ties and seven over-the-top ties are required for full tie-down in single-wide mobile homes.

PIPELINE CONSTRUCTION CODES (220s, 2270s):
- 227 Underground Pipelines: Pipelines located under the surface of the ground. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit pipeline construction code 2271.
- 228 At Grade Pipelines: Pipelines located at the surface of the ground. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit pipeline construction code 2281.
- 2270 Unknown Pipeline: Pipelines with an unknown location and material, or other unknown pipelines that cannot be mapped to any of the other pipeline construction class codes.
- 2271 General Underground Pipelines: Pipelines located under the surface of the ground with an unknown material of construction.
- 2272 Underground Cast Iron Pipelines: Pipelines located under the surface of the ground and made of cast iron material.
- 2273 Underground Asbestos Cement Pipelines: Pipelines located under the surface of the ground and made of asbestos-cement material.
- 2274 Underground Concrete Pipelines: Pipelines located under the surface of the ground and made of concrete material.
- 2275 Underground PVC Pipelines: Pipelines located under the surface of the ground and made of PVC material.
- 2276 Underground Ductile Iron Pipelines: Pipelines located under the surface of the ground and made of ductile iron material.
- 2281 General At Grade Pipelines: Pipelines located at the surface of the ground with an unknown material of construction.
- 2282 At Grade Cast Iron Pipelines: Pipelines located at the surface of the ground and made of cast iron material.
- 2283 At Grade Asbestos Cement Pipelines: Pipelines located at the surface of the ground and made of asbestos-cement material.
- 2284 At Grade Concrete Pipelines: Pipelines located at the surface of the ground and made of concrete material.
- 2285 At Grade PVC Pipelines: Pipelines located at the surface of the ground and made of PVC material.
- 2286 At Grade Ductile Iron Pipelines: Pipelines located at the surface of the ground and made of ductile iron material.

PERIL CODES AND OPTIONS:
Earthquake: Earthquake Shake (ES), Fire Following (FF), Sprinkler Leakage (SL), Landslide (LS), Tsunami (TS) Liquefaction (LQ)
Tropical Cyclone: Wind (TC), Storm Surge (AIR) (SU), Precipitation Flood (PF)
Severe Storm: Severe Thunderstorm (ST) [sub-perils: Hail (HL), Straight-Line Winds (SW), Tornado (TD)], Winter Storm (WS)
Inland Flood
Wildfire/Bushfire: Sub-perils: Wildfire and Smoke
Terrorism
Coastal flood

PERIL IMPORT CODES:
- PAL All licensed perils
- PEA Earthquake sub-perils (earthquake shake, fire following, sprinkler leakage, landslide, tsunami, and liquefaction), wildfire/bushfire and smoke
- PEF Fire (wildfire/bushfire, fire following earthquake, smoke)
- PES Earthquake shake only
- PFF Fire following only
- PFL Inland flood
- PHL Severe thunderstorm with hail (Verisk Severe Thunderstorm Model for the United States only)
- PLQ Liquefaction. We support separate liquefaction losses only for the Verisk Earthquake Model for New Zealand. For all other models that support liquefaction, the losses are rolled into the earthquake shake (PES) peril losses.
- PLS Landslide
- PNC Non-catastrophe (retired in Touchstone 2021)
- PPH Precipitation flood
- PSH Hurricane storm surge or coastal flood
- PSL Earthquake sprinkler leakage only
- PSM Smoke sub-peril (added June 2024)
- PSW Severe thunderstorm with straight-line winds (Verisk Severe Thunderstorm Model for the United States only)
- PTD Severe thunderstorm with tornado (Verisk Severe Thunderstorm Model for the United States only)
- PTR Terrorism
- PTS Tsunami
- PWA All wind perils (tropical cyclone, severe storm, and winter storm)
- PWB Wildfire/bushfire only
- PWF All wind and fire following earthquake sub-perils, wildfire/bushfire, smoke
- PWH Tropical cyclone only
- PWT Severe thunderstorm (hail, tornado, and straight-line winds)
- PWW Winter storm
- PWX Severe storm (wind excluding tropical cyclone). The code will be appended to PWH exposures for the 22 countries where extratropical cyclone and severe thunderstorm perils are supported.

UNKNOWN CONSTRUCTION CODES (100s):
- 100 Unknown: The construction class is not known. If the construction and occupancy codes for a location are both "Unknown", Touchstone assigns the occupancy code "General Commercial." The damage functions for unknown construction are the weighted average of the known construction damage functions. Touchstone uses an exposure-weighted average at the state level to capture the variability in building stocks at this geography. The unknown damage function varies by occupancy class code. For an exposure of known occupancy but unknown construction and height, Touchstone uses a damage function that is a weighted average of the damage functions for the same occupancy class corresponding to all combinations of construction and height classes. Note: In some models, the construction and occupancy class code combination 100-300 is invalid, and Touchstone remaps this combination to 100-311.

STORAGE TANK CONSTRUCTION CODES (220s, 2200s):
- 221 Underground Liquid Tanks: Underground tanks that are designed to hold liquids. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit construction storage tank construction code 2211.
- 222 Underground Solid Tanks: Underground storage tanks that are designed to hold solid material. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2221.
- 223 On Ground Liquid Tanks: Above ground storage tanks located on the ground surface that are designed to hold liquids. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2231.
- 224 On Ground Solid Tanks: Above ground storage tanks located on the ground surface that are designed to hold solid material. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2241.
- 225 Elevated Liquid Tanks: Above ground storage tanks located above the ground surface that are designed to hold liquids. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2251.
- 226 Elevated Solid Tanks: Above ground storage tanks located above the ground surface that are designed to hold solid material. For the Verisk Earthquake Model for the United States, we recommend using the new 4-digit storage tank construction code 2261.
- 2210 Unknown Tanks: Storage tanks with an unknown material, unknown location, and unknown contents, or other unknowns that cannot be mapped to any of the other storage tank construction class codes.
- 2211 Underground Liquid Tanks: Storage tanks made of steel or concrete for holding liquids. Located under the ground.
- 2221 Underground Solid Tanks: Storage tanks made of steel or concrete for holding solid material. Located under the ground.
- 2231 On Ground Liquid Tanks: Storage tanks for holding liquids with an unknown material of construction. Located on the ground surface.
- 2232 On Ground Steel Liquid Tanks: Storage tanks made of steel for holding liquids. Located on the ground surface.
- 2233 On Ground Concrete Liquid Tanks: Storage tanks made of concrete for holding liquids. Located on the ground surface.
- 2241 On Ground Solid Tanks: Storage tanks for holding solid material with an unknown material of construction. Located on the ground surface.
- 2242 On Ground Steel Solid Tanks: Storage tanks made of steel for holding solid material. Located on the ground surface.
- 2243 On Ground Concrete Solid Tanks: Storage tanks made of concrete for holding solid material. Located on the ground surface.
- 2251 Elevated Liquid Tanks: Storage tanks located above the ground surface for holding liquids with an unknown material of construction
- 2252 Elevated Steel Liquid Tanks: Storage tanks made of steel for holding liquids. Located above the ground surface.
- 2253 Elevated Concrete Liquid Tanks: Storage tanks made of concrete for holding liquids. Located above the ground surface.

TUNNEL CONSTRUCTION CODES (210s, 2100s):
- 213 Alluvium Tunnels: Tunnels that were drilled through unconsolidated sedimentary deposits and then typically lined with concrete. For exposures in South America, use code 2131.
- 214 Rock Tunnels: Rock tunnels are lined or unlined tunnels that were drilled through rock. For exposures in South America, use 2141.
- 215 Cut and Cover Tunnels: Tunnels that were constructed by cutting a trench, installing a liner, and then covering the liner with earth.
- 2131 Alluvium Tunnels: Lined or unlined alluvium tunnels with unknown method of construction.
- 2132 Alluvial Bored Tunnels: Lined or unlined tunnels constructed through alluvium soil using a boring machine.
- 2141 Rock Tunnels: Lined or unlined rock tunnels with unknown method of construction
- 2142 Rock Bored Tunnels: Lined or unlined tunnels drilled through rock using a boring machine.
- 2150 Unknown Tunnel: Lined or unlined tunnels with unknown material and unknown method of construction, or other tunnels that cannot be mapped to any of the other tunnel construction class codes.
- 2151 Rock Cut and Cover Tunnels: Lined or unlined rock tunnels constructed after excavating a trench and roofing over with an overhead support system.
- 2152 Alluvial Cut and Cover Tunnels: Lined or unlined alluvium tunnels constructed after excavating a trench and roofing over with an overhead support system.

STEEL CONSTRUCTION CODES (150s):
- 151 Steel: Steel frame buildings consist of steel columns and beams. Use this if the other technical characteristics of the building are unknown.
- 152 Light Metal: Light metal buildings are made of light gauge steel frame and are usually clad with lightweight metal or asbestos siding and roof, often corrugated. They typically are low-rise structures.
- 153 Braced Steel Frame: Buildings constructed with steel columns and beams that are braced with diagonal steel members to resist lateral forces.
- 154 Steel MRF - Perimeter: Buildings constructed with steel columns and beams that use only the frame members on the periphery of the structure to carry lateral loads. The internal beams and columns only carry the gravity load to the foundation.
- 155 Steel MRF Distributed: Buildings constructed with steel columns and beams to carry lateral loads distributed throughout the building. The diaphragms are usually concrete, sometimes over steel decking. This structural type is seldom used for low-rise buildings.
- 156 Steel MRF: Steel MRF buildings consist of structural steel columns and beams. Lateral loads due to earthquakes are carried by the "moment-resisting frames," but the locations of the moment-resisting frames in the building are unknown.
- 157 Steel Frame with URM: Structural steel columns and beams form "moment-resisting frames" to carry lateral loads due to earthquakes. Unreinforced masonry walls are used as infills between the columns to add lateral load resistance, but are not intended to serve as vertical load-bearing elements. Sometimes the steel frames are completely hidden in the masonry walls.
- 158 Steel Frame with Concrete Shear Wall: Structural steel columns and beams form exterior frames, but the joints are not designed for moment resistance. Lateral loads due to earthquakes are carried by reinforced concrete "shear" walls. The concrete walls are continuous from the foundation to the roof.
- 159 Steel Reinforced Concrete: Structural steel sections (beams and columns) are encased in reinforced concrete. The encased structural steel columns are sometimes discontinued in the upper portions of the buildings, making the columns in the upper floor regular reinforced concrete columns.
- 160 Steel Long Span: Steel long-span buildings create unobstructed, column-free spaces greater than 100 feet for a variety of activities or functions. These include activities where visibility is important for large audiences (e.g., auditoriums and covered stadiums), where flexibility is important (e.g., exhibition halls and certain types of manufacturing facilities), and where large movable objects are housed. Two-hinge (made of a single member hinged at each end) and three-hinge (made of two members hinged at each end and at the meeting point at the crown) trussed arches are widely used.

TOWER CONSTRUCTION CODES (230s):
- 234 Electrical Transmission - Conventional: Steel towers under 100 feet high designed to hold up electrical transmission lines
- 235 Electrical Transmission - Major: Steel towers over 100 feet high designed to hold up electrical transmission lines
- 236 Broadcast Towers: Steel towers designed to carry radio, TV, or cell phone transmission equipment
- 237 Observation Towers: Elevated towers designed for people to look out of, such as airport control or fire observation towers
- 238 Offshore Towers: Offshore towers are towers with a platform that are anchored to the ground under the ocean

WOOD CONSTRUCTION CODES (100s):
- 101 Wood Frame (Modern): Wood frame (modern) structures tend to be mostly low rise (one to three stories, occasionally four). Stud walls are typically constructed of 2x4 or 2x6 inch wood members vertically set 16 or 24 inches apart. These walls are braced by plywood or by diagonals made of wood or steel. Many detached single and low-rise multiple family residences in the United States are of stud wall wood frame construction.
- 102 Light Wood Frame: Light wood frame structures are typically not built in the United States but would be found in other countries, such as Japan. In Hawaii, this classification would include single wall (studless) construction framed with light timber trusses.
- 103 Masonry Veneer: A wood-framed structure faced with a single width of non-load-bearing concrete, stone, or clay brick attached to the stud wall.
- 104 Heavy Timber: Heavy Timber structures typically have masonry walls with heavy wood column supports, and floor and roof decks are 2-3 inch tongue-and-groove planks.
- 107 Lightweight Cladding: Non-structural cladding and linings (e.g., fiber cement, plywood) used in lightweight construction that uses timber or light gauge steel framing as the structural support system. Currently supported only for locations in Australia and New Zealand.
- 108 Hale Construction: Indigenous Hawaiian construction. Supported only for the Verisk Earthquake Model for Hawaii and the Verisk Tropical Cyclone Model for Hawaii.

PERIL CODES AND OPTIONS:
Earthquake: Earthquake Shake (ES), Fire Following (FF), Sprinkler Leakage (SL), Landslide (LS), Tsunami (TS) Liquefaction (LQ)
Tropical Cyclone: Wind (TC), Storm Surge (AIR) (SU), Precipitation Flood (PF)
Severe Storm: Severe Thunderstorm (ST) [sub-perils: Hail (HL), Straight-Line Winds (SW), Tornado (TD)], Winter Storm (WS)
Inland Flood
Wildfire/Bushfire: Sub-perils: Wildfire and Smoke
Terrorism
Coastal flood

PERIL IMPORT CODES:
- PAL All licensed perils
- PEA Earthquake sub-perils (earthquake shake, fire following, sprinkler leakage, landslide, tsunami, and liquefaction), wildfire/bushfire and smoke
- PEF Fire (wildfire/bushfire, fire following earthquake, smoke)
- PES Earthquake shake only
- PFF Fire following only
- PFL Inland flood
- PHL Severe thunderstorm with hail (Verisk Severe Thunderstorm Model for the United States only)
- PLQ Liquefaction. We support separate liquefaction losses only for the Verisk Earthquake Model for New Zealand. For all other models that support liquefaction, the losses are rolled into the earthquake shake (PES) peril losses.
- PLS Landslide
- PNC Non-catastrophe (retired in Touchstone 2021)
- PPH Precipitation flood
- PSH Hurricane storm surge or coastal flood
- PSL Earthquake sprinkler leakage only
- PSM Smoke sub-peril (added June 2024)
- PSW Severe thunderstorm with straight-line winds (Verisk Severe Thunderstorm Model for the United States only)
- PTD Severe thunderstorm with tornado (Verisk Severe Thunderstorm Model for the United States only)
- PTR Terrorism
- PTS Tsunami
- PWA All wind perils (tropical cyclone, severe storm, and winter storm)
- PWB Wildfire/bushfire only
- PWF All wind and fire following earthquake sub-perils, wildfire/bushfire, smoke
- PWH Tropical cyclone only
- PWT Severe thunderstorm (hail, tornado, and straight-line winds)
- PWW Winter storm
- PWX Severe storm (wind excluding tropical cyclone). The code will be appended to PWH exposures for the 22 countries where extratropical cyclone and severe thunderstorm perils are supported.

`

export default function PopupAIAssistant({ onAgentAction, currentStep, processingStatus }: PopupAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "agent",
      content:
        "Hello! I'm your comprehensive AI assistant trained on UNICEDE standards and Touchstone occupancy codes. I can help with data cleansing, occupancy classification, geocoding, and the complete insurance data processing workflow. What would you like to know?",
      timestamp: new Date(),
      status: "complete",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isAgentThinking, setIsAgentThinking] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsAgentThinking(true)

    // Simulate AI response with comprehensive knowledge
    setTimeout(() => {
      const agentResponse = generateComprehensiveResponse(inputValue, currentStep)
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: agentResponse.content,
        timestamp: new Date(),
        status: "complete",
        explanation: agentResponse.explanation,
      }

      setMessages((prev) => [...prev, agentMessage])
      setIsAgentThinking(false)

      if (agentResponse.action && onAgentAction) {
        onAgentAction(agentResponse.action, agentResponse.data)
      }
    }, 1500)
  }

  const generateComprehensiveResponse = (userInput: string, step?: number) => {
    const input = userInput.toLowerCase()

    // Occupancy code specific responses
    if (input.includes("occupancy") || input.includes("classification") || input.includes("code")) {
      if (
        input.includes("transport") ||
        input.includes("351") ||
        input.includes("352") ||
        input.includes("353") ||
        input.includes("354") ||
        input.includes("355") ||
        input.includes("356")
      ) {
        return {
          content:
            "Transportation occupancy codes (350s) include Highway (351), Railroad (352), Air (353), Sea/Inland Waterways (354), Aircraft Hangars (355), and Aircraft at Ramps/Gates (356). Each has specific SIC mappings and geographic limitations. For example, Aircraft Hangars (355) are valid in US, Australia, Canada, but use Air (353) in other regions.",
          explanation:
            "Transportation codes follow strict geographic and model-specific rules. Always check model documentation for supported regions and limitations.",
        }
      }

      if (
        input.includes("utility") ||
        input.includes("361") ||
        input.includes("362") ||
        input.includes("363") ||
        input.includes("364") ||
        input.includes("365")
      ) {
        return {
          content:
            "Utility occupancy codes (360s) cover Electrical (361), Water (362), Sanitary Sewer (363), Natural Gas (364), and Telephone/Telegraph (365). All map to SIC codes 48-49. These are critical infrastructure classifications requiring careful validation.",
          explanation:
            "Utility classifications often have higher exposure values and specific regulatory requirements that affect risk assessment.",
        }
      }

      if (input.includes("solar") || input.includes("3001") || input.includes("3011") || input.includes("302")) {
        return {
          content:
            "Solar occupancy codes (3000s) are specific to Touchstone 2025 Severe Thunderstorm Model for US. They classify by scale: Residential (3001), Commercial (3011), and Utility-scale by capacity - Small <5MW (3021), Medium 5-25MW (3022), Large >25MW (3023).",
          explanation:
            "Solar classifications are model-specific and capacity-based. Capacity thresholds determine appropriate risk modeling approaches.",
        }
      }

      if (
        input.includes("residential") ||
        input.includes("301") ||
        input.includes("302") ||
        input.includes("303") ||
        input.includes("304") ||
        input.includes("305") ||
        input.includes("306") ||
        input.includes("307")
      ) {
        return {
          content:
            "Residential codes (300s) range from General Residential (301) to specific types like Single Family (302), Multi Family (303), Temporary Lodging (304), Group Institutional (305), Apartments/Condos (306), and Terraced Housing (307). Note that 300 (Unknown) gets remapped to 100-311 (General Commercial) when combined with construction code 100.",
          explanation:
            "Residential classifications affect coverage types, deductibles, and catastrophe modeling. Proper classification ensures accurate premium calculation.",
        }
      }

      if (
        input.includes("public") ||
        input.includes("government") ||
        input.includes("church") ||
        input.includes("341") ||
        input.includes("342") ||
        input.includes("343") ||
        input.includes("344")
      ) {
        return {
          content:
            "Public occupancy codes (340s) include Religion/Non-Profit (341), Church (342), Government General Services (343), and Government Emergency Services (344). These often have special regulatory considerations and coverage requirements.",
          explanation:
            "Public sector classifications may have sovereign immunity considerations and specialized coverage needs.",
        }
      }

      if (input.includes("mercantile") || input.includes("335") || input.includes("336")) {
        return {
          content:
            "Mercantile occupancy codes (330s) include Gasoline Stations (335) and Automotive Repair Shops and Car Washes (336). These codes have specific SIC mappings and geographic limitations.",
          explanation: "Mercantile codes are used for retail and repair services with specific regional support.",
        }
      }

      if (
        input.includes("industrial facility") ||
        input.includes("400") ||
        input.includes("401") ||
        input.includes("402") ||
        input.includes("403") ||
        input.includes("404") ||
        input.includes("405")
      ) {
        return {
          content:
            "Industrial Facility codes (400s) range from Unknown Industrial Facility (400) to specific types like Heavy Fabrication and Assembly General (401), Automotive Manufacturing (402), Fabricated Metal Products (403), Industrial and Commercial Machinery (404), and Transportation Equipment Assembly (405). These codes have specific SIC mappings and may require additional validation.",
          explanation:
            "Industrial Facility classifications are crucial for accurate risk assessment in manufacturing and heavy industry sectors.",
        }
      }

      if (input.includes("education") || input.includes("345") || input.includes("346")) {
        return {
          content:
            "Education codes (340s) include Universities, Colleges, Technical Schools (345) and Primary and Secondary Schools (346). These codes have specific SIC mappings and geographic limitations.",
          explanation:
            "Education codes are used for institutions providing higher and K-12 education with specific regional support.",
        }
      }

      if (
        input.includes("marine cargo") ||
        input.includes("1001") ||
        input.includes("1002") ||
        input.includes("1003") ||
        input.includes("1004") ||
        input.includes("1005") ||
        input.includes("1006") ||
        input.includes("1007") ||
        input.includes("1008") ||
        input.includes("1009") ||
        input.includes("1010") ||
        input.includes("1011") ||
        input.includes("1012")
      ) {
        return {
          content:
            "Marine Cargo codes (1000s) are specific to Touchstone 9.0+ and include Designated Facilities/Vaults (1001), Silo (1002), Liquid Tanks (1003), Gas Tanks (1004), Inside Warehouse at Port (1005), Containerized Inside Warehouse (1006), Containerized Stacked Outside (1007), Open Lot or Stockpiled Outside (1008), At Destination in Warehouse (1009), At Destination Retail (1010), Museums, Institutions, Public Buildings (1011), and Retail & Private Buildings (1012). These codes have specific SIC mappings and geographic limitations.",
          explanation:
            "Marine Cargo codes are used for port-related storage and transportation with specific regional support.",
        }
      }

      if (
        input.includes("miscellaneous") ||
        input.includes("371") ||
        input.includes("372") ||
        input.includes("373") ||
        input.includes("374") ||
        input.includes("375") ||
        input.includes("381")
      ) {
        return {
          content:
            "Miscellaneous codes (370s) include Communication (371), Flood Control (372), Agriculture (373), Greenhouses (374), Forestry (375), and Construction/Erection Risks (381). These codes have specific SIC mappings and geographic limitations.",
          explanation:
            "Miscellaneous codes cover a wide range of industries and activities with specific regional support.",
        }
      }

      if (
        input.includes("offshore") ||
        input.includes("900") ||
        input.includes("901") ||
        input.includes("902") ||
        input.includes("903") ||
        input.includes("904") ||
        input.includes("905") ||
        input.includes("906") ||
        input.includes("907") ||
        input.includes("908") ||
        input.includes("909")
      ) {
        return {
          content:
            "Offshore Asset codes (900s) range from Unknown (900) to specific types like Oil Production Only (901), Gas Production Only (902), No Production (903), Oil and Gas Production (904), Drilling (905), Workover (906), Ready Stacked (907), Waiting on Location (908), and Pipelines (909). These codes have specific SIC mappings and geographic limitations.",
          explanation:
            "Offshore Asset codes are used for platforms and rigs in offshore operations with specific regional support.",
        }
      }

      if (
        input.includes("commercial") ||
        input.includes("311") ||
        input.includes("312") ||
        input.includes("313") ||
        input.includes("314") ||
        input.includes("315") ||
        input.includes("316")
      ) {
        return {
          content:
            "Commercial codes (310s) range from General Commercial (311) to specific types like Retail Trade (312), Wholesale Trade (313), Personal and Repair Services (314), Professional, Technical, Business Services (315), and Health Care Services (316). These codes have specific SIC mappings and geographic limitations.",
          explanation: "Commercial codes cover a wide range of businesses and services with specific regional support.",
        }
      }

      if (
        input.includes("construction") ||
        input.includes("erection") ||
        input.includes("382") ||
        input.includes("384") ||
        input.includes("385") ||
        input.includes("386") ||
        input.includes("387") ||
        input.includes("388") ||
        input.includes("389") ||
        input.includes("390") ||
        input.includes("391") ||
        input.includes("392") ||
        input.includes("393") ||
        input.includes("394") ||
        input.includes("395")
      ) {
        return {
          content:
            "Construction/Erection Risk codes (380s-390s) range from Residential Construction/Erection (382) to specific types like Industrial Construction/Erection (385), Office Construction/Erection (386), Retail Construction/Erection (387), Hotel Construction/Erection (388), Education Construction/Erection (389), Healthcare Construction/Erection (390), Religious Construction/Erection (391), Entertainment/Recreation Construction/Erection (392), Parking Construction/Erection (393), Agriculture Construction/Erection (394), and Utility Construction/Erection (395). These codes have specific SIC mappings and geographic limitations.",
          explanation:
            "Construction/Erection Risk codes are used for under-construction buildings with specific regional support.",
        }
      }

      if (
        input.includes("industrial") ||
        input.includes("321") ||
        input.includes("322") ||
        input.includes("323") ||
        input.includes("324") ||
        input.includes("325") ||
        input.includes("326") ||
        input.includes("327") ||
        input.includes("328") ||
        input.includes("329") ||
        input.includes("330")
      ) {
        return {
          content:
            "Industrial codes (320s) range from General Industrial (321) to specific types like Heavy Fabrication and Assembly (322), Light Fabrication and Assembly (323), Food and Drug Processing (324), Chemical Processing (325), Metal and Mineral Processing (326), High Technology (327), Construction (328), and Petroleum (329). These codes have specific SIC mappings and geographic limitations.",
          explanation:
            "Industrial codes cover a wide range of manufacturing and processing activities with specific regional support.",
        }
      }

      return {
        content:
          "I can help with all Touchstone occupancy classifications: Transportation (350s), Utilities (360s), Solar (3000s), Restaurant (331), Residential (300s), Public (340s), Mercantile (330s), Industrial Facility (400s), Education (340s), Marine Cargo (1000s), Miscellaneous (370s), Offshore Asset (900s), Commercial (310s), and Construction/Erection Risk (380s-390s). Each category has specific SIC mappings, geographic limitations, and model compatibility requirements. What specific occupancy type are you working with?",
        explanation:
          "Proper occupancy classification is critical for accurate risk assessment and regulatory compliance in insurance data processing.",
      }
    }

    // Construction code specific responses
    if (
      input.includes("construction") ||
      input.includes("code") ||
      input.includes("240s") ||
      input.includes("130s") ||
      input.includes("200s") ||
      input.includes("210s") ||
      input.includes("260s") ||
      input.includes("230s") ||
      input.includes("270s")
    ) {
      if (input.includes("equipment") || input.includes("240s")) {
        return {
          content:
            "Equipment construction codes (240s) include Boilers and Machinery (241), Electronic Data Processing (242), Contractors Equipment (243), Mobile Equipment (244), Miscellaneous Equipment (245), Aircraft (246), and Marine Hull (247). These codes classify the type of equipment being constructed or installed, impacting risk assessment.",
          explanation:
            "Equipment codes are crucial for assessing risks associated with machinery, vehicles, and vessels.",
        }
      }
      if (input.includes("concrete") || input.includes("130s")) {
        return {
          content:
            "Concrete construction codes (130s) cover various types of reinforced concrete structures, including Reinforced Concrete (131), Precast Concrete (132), Prestressed Concrete (133), Concrete Block (134), Concrete Tilt-Up (135), Insulating Concrete Form (136), Concrete Frame (137), Concrete Shear Wall (138), Post-Tensioned Concrete (139), Concrete with Steel Frame (140), and Concrete Composite (141). The specific type significantly influences structural integrity and seismic performance.",
          explanation:
            "The specific concrete construction type significantly influences structural integrity and seismic performance.",
        }
      }
      if (input.includes("bridge") || input.includes("200s") || input.includes("2000s")) {
        return {
          content:
            "Bridge construction codes (200s, 2000s) include Steel Truss Bridge (201), Concrete Arch Bridge (202), Suspension Bridge (203), Simple Span Steel Girder (2010), Continuous Steel Girder (2011), Steel Truss (2012), Steel Arch (2013), Suspension (2014), Cable-Stayed (2015), Simple Span Concrete Girder (2020), Continuous Concrete Girder (2021), Concrete Slab (2022), Concrete Tee Beam (2023), Concrete Box Girder (2024), Prestressed Concrete (2025), Post-Tensioned Concrete (2026), Concrete Arch (2030), Stone Arch (2031), Steel Frame with Concrete Deck (2040), Concrete Frame with Steel Deck (2041), Timber Stringer (2050), Timber Truss (2051), Timber Arch (2052), Movable Bridge (2060), and Pontoon Bridge (2061). These are primarily supported in US and Canada and not with Severe Thunderstorm peril.",
          explanation:
            "Bridge codes are crucial for infrastructure projects, with specific regional and peril limitations.",
        }
      }
      if (input.includes("dam") || input.includes("210s")) {
        return {
          content:
            "Dam construction codes (210s) include Concrete Dam (211) and Earth Fill Dam (212). These are used for water resource management structures. Dam construction types are important for assessing risks related to water containment and potential failures.",
          explanation:
            "Dam construction types are important for assessing risks related to water containment and potential failures.",
        }
      }
      if (input.includes("automobile") || input.includes("260s")) {
        return {
          content:
            "Automobile construction codes (260s) include Passenger Cars (261), Commercial Vehicles (262), and Specialty Vehicles (263). These codes are used for vehicle manufacturing and can be linked to specific occupancy codes for context.",
          explanation:
            "These codes are used for vehicle manufacturing and can be linked to specific occupancy codes for context.",
        }
      }
      if (input.includes("chimney") || input.includes("230s")) {
        return {
          content:
            "Chimney construction codes (230s) differentiate between Masonry Chimney (231), Metal Chimney (232), and Concrete Chimney (233). Chimney construction type is relevant for fire and wind risk assessments.",
          explanation: "Chimney construction type is relevant for fire and wind risk assessments.",
        }
      }
      if (input.includes("marine cargo") || input.includes("270s") || input.includes("2700s")) {
        return {
          content:
            "Marine Cargo construction codes (270s, 2700s) include Carpool (270), General and Containerized Cargo (271), Heavy Cargo (272), Refrigerated Cargo (273), Dry Bulk Cargo (274), Liquid Bulk Cargo (275), and General/Unknown (276). Combustible (280-285) and Non-combustible (290-295) versions exist. Enhanced codes (2701-2720) cover specific cargo types like Petroleum Products (2713), Pharmaceuticals (2714), Project Cargo (2715), and Fine Art & Collectibles (2718). These codes are used for port-related storage and transportation with specific regional support.",
          explanation:
            "Marine Cargo construction codes are used for port-related storage and transportation with specific regional support.",
        }
      }
      if (input.includes("pavement") || input.includes("204") || input.includes("205") || input.includes("206")) {
        return {
          content:
            "Pavement construction codes (200s) include Railroads (204), Highways (205), and Runways (206). These codes are used for infrastructure projects and have specific regional and peril limitations.",
          explanation:
            "Pavement codes are crucial for infrastructure projects, with specific regional and peril limitations.",
        }
      }
      if (input.includes("offshore asset") || input.includes("240") || input.includes("800s")) {
        return {
          content:
            "Offshore Asset construction codes (240, 800s) include Offshore Wind Turbines (240), Unknown (800), Caisson (801), Compliant Tower (802), Fixed Jacket Platform (803), Jackup (804), Mini Tension Leg Platform (MTLP) (805), Drill Rig (806), Semi-Submersible (807), Floating Production System (808), Drill Ship (809), SPAR Floating Production System (810), Submersible Production System (811), Underwater Production Units, Completion Units, and Templates (812), and Tension Leg Platform (813). These codes are critical for assessing offshore risks.",
          explanation:
            "Offshore asset construction codes are vital for understanding the specific risks associated with offshore energy infrastructure.",
        }
      }
      if (input.includes("solar") || input.includes("500s")) {
        return {
          content:
            "Solar construction codes (500s) are specific to the Touchstone 2025 Severe Thunderstorm Model for the US. They include Solar, rooftop (unknown anchorage) (500), Solar, rooftop, anchored (501), Solar, rooftop, ballasted (502), Solar ground mounted (on tracker or fixed) (510), Solar ground mounted, single axis (511), Solar ground mounted, dual axis (512), Solar ground mounted, fixed tilt (513), and BESS (battery energy storage system) (514).",
          explanation:
            "Solar construction codes are model-specific and classify different types of solar installations.",
        }
      }
      if (input.includes("masonry") || input.includes("110s")) {
        return {
          content:
            "Masonry construction codes (110s) include Masonry (111), Adobe (112), Rubble Stone Masonry (113), Unreinforced Masonry - Bearing Wall (114), Unreinforced Masonry - Bearing Frame (115), Reinforced Masonry (116), Reinforced Masonry Shear Wall (with MRF) (117), Reinforced Masonry Shear Wall (without MRF) (118), Joisted Masonry (119), Confined Masonry (120), and Cavity Double Brick (121). These codes describe various masonry construction types and their structural properties.",
          explanation:
            "Masonry construction codes describe various types of masonry buildings and their structural characteristics.",
        }
      }
      if (input.includes("marine craft") || input.includes("260s")) {
        return {
          content:
            "Marine Craft construction codes (260s) include Pleasure Boats and Yachts (265), Pleasure Boats and Yachts, Power Boats (266), and Pleasure Boats and Yachts, Sail Boats (267). These codes are used for recreational watercraft.",
          explanation: "Marine Craft codes are used for recreational watercraft and their propulsion types.",
        }
      }
      if (input.includes("mobile home") || input.includes("190s")) {
        return {
          content:
            "Mobile Home construction codes (190s) include Mobile Homes (191), Mobile Home with No Tie-Downs (192), Mobile Home with Partial Tie-Downs (193), and Mobile Home with Full Tie-Downs (194). These codes specify the anchoring methods used for mobile homes, which is critical for wind resistance.",
          explanation: "Mobile home codes are crucial for assessing wind resistance based on anchoring methods.",
        }
      }
      if (input.includes("pipeline") || input.includes("220s") || input.includes("2270s")) {
        return {
          content:
            "Pipeline construction codes (220s, 2270s) include Underground Pipelines (227), At Grade Pipelines (228), Unknown Pipeline (2270), General Underground Pipelines (2271), Underground Cast Iron Pipelines (2272), Underground Asbestos Cement Pipelines (2273), Underground Concrete Pipelines (2274), Underground PVC Pipelines (2275), Underground Ductile Iron Pipelines (2276), General At Grade Pipelines (2281), At Grade Cast Iron Pipelines (2282), At Grade Asbestos Cement Pipelines (2283), At Grade Concrete Pipelines (2284), At Grade PVC Pipelines (2285), and At Grade Ductile Iron Pipelines (2286). These codes specify pipeline location and material, important for risk assessment.",
          explanation:
            "Pipeline codes specify location and material, crucial for assessing risks related to underground and at-grade pipelines.",
        }
      }
      if (input.includes("unknown construction") || input.includes("100")) {
        return {
          content:
            "Unknown construction code (100) is used when the construction class is not known. If both construction and occupancy codes are unknown, Touchstone assigns occupancy code 'General Commercial.' The damage functions for unknown construction are weighted averages of known construction damage functions, using exposure-weighted averages at the state level. Note: In some models, combination 100-300 is invalid and gets remapped to 100-311.",
          explanation: "Unknown construction codes use weighted averages to handle missing construction information.",
        }
      }
      if (
        input.includes("storage tank") ||
        input.includes("221") ||
        input.includes("222") ||
        input.includes("223") ||
        input.includes("224") ||
        input.includes("225") ||
        input.includes("226") ||
        input.includes("2200s")
      ) {
        return {
          content:
            "Storage Tank construction codes (220s, 2200s) include Underground Liquid Tanks (221), Underground Solid Tanks (222), On Ground Liquid Tanks (223), On Ground Solid Tanks (224), Elevated Liquid Tanks (225), Elevated Solid Tanks (226), and detailed 4-digit codes (2210-2253) specifying material (steel/concrete) and contents (liquid/solid). These codes are critical for assessing storage facility risks.",
          explanation:
            "Storage tank codes specify location, material, and contents, crucial for risk assessment of storage facilities.",
        }
      }
      if (
        input.includes("tunnel") ||
        input.includes("213") ||
        input.includes("214") ||
        input.includes("215") ||
        input.includes("2100s")
      ) {
        return {
          content:
            "Tunnel construction codes (210s, 2100s) include Alluvium Tunnels (213), Rock Tunnels (214), Cut and Cover Tunnels (215), and detailed 4-digit codes (2131-2152) specifying construction method (bored, cut and cover) and material (alluvium, rock). These codes are important for underground infrastructure risk assessment.",
          explanation:
            "Tunnel codes specify construction method and geological material, important for underground infrastructure risks.",
        }
      }
      if (
        input.includes("steel") ||
        input.includes("150s") ||
        input.includes("151") ||
        input.includes("152") ||
        input.includes("153") ||
        input.includes("154") ||
        input.includes("155") ||
        input.includes("156") ||
        input.includes("157") ||
        input.includes("158") ||
        input.includes("159") ||
        input.includes("160")
      ) {
        return {
          content:
            "Steel construction codes (150s) include Steel (151), Light Metal (152), Braced Steel Frame (153), Steel MRF - Perimeter (154), Steel MRF Distributed (155), Steel MRF (156), Steel Frame with URM (157), Steel Frame with Concrete Shear Wall (158), Steel Reinforced Concrete (159), and Steel Long Span (160). These codes describe various steel structural systems and their lateral force resistance methods.",
          explanation:
            "Steel construction codes describe various structural systems and their methods for resisting lateral forces.",
        }
      }
      if (
        input.includes("tower") ||
        input.includes("234") ||
        input.includes("235") ||
        input.includes("236") ||
        input.includes("237") ||
        input.includes("238")
      ) {
        return {
          content:
            "Tower construction codes (230s) include Electrical Transmission - Conventional (234), Electrical Transmission - Major (235), Broadcast Towers (236), Observation Towers (237), and Offshore Towers (238). These codes classify different tower types based on their function and height characteristics.",
          explanation:
            "Tower codes classify different tower types based on function, height, and location characteristics.",
        }
      }
      if (
        input.includes("wood") ||
        input.includes("101") ||
        input.includes("102") ||
        input.includes("103") ||
        input.includes("104") ||
        input.includes("107") ||
        input.includes("108")
      ) {
        return {
          content:
            "Wood construction codes (100s) include Wood Frame (Modern) (101), Light Wood Frame (102), Masonry Veneer (103), Heavy Timber (104), Lightweight Cladding (107), and Hale Construction (108). These codes describe various wood-based structural systems with regional and model-specific limitations.",
          explanation:
            "Wood construction codes describe various wood-based structural systems with specific regional applications.",
        }
      }
      return {
        content:
          "I can provide information on various construction codes, including Equipment (240s), Concrete (130s), Bridge (200s, 2000s), Dam (210s), Automobile (260s), Chimney (230s), Marine Cargo (270s, 2700s), Pavement (200s), Offshore Asset (240, 800s), Solar (500s), Masonry (110s), Marine Craft (260s), Mobile Home (190s), Pipeline (220s, 2270s), Unknown Construction (100s), Storage Tank (220s, 2200s), Tunnel (210s, 2100s), Steel (150s), Tower (230s), and Wood (100s). Each has specific details and limitations. Which construction code are you interested in?",
        explanation:
          "Understanding construction codes is vital for accurate risk modeling, especially when paired with occupancy codes.",
      }
    }

    // Field validation specific responses
    if (
      input.includes("validation") ||
      input.includes("rules") ||
      input.includes("requirements") ||
      input.includes("field")
    ) {
      if (input.includes("contract")) {
        return {
          content:
            "Contract list validation rules require a unique Contract ID, a valid Contract Type, and an Inception Date. Optional fields include Insured Name, Producer Name, Underwriter, Branch, and ID of Expiring Contract. Currency and premium details are also specified. Contract ID and Inception Date are mandatory for proper record-keeping and processing.",
          explanation: "Contract ID and Inception Date are mandatory for proper record-keeping and processing.",
        }
      }
      if (
        input.includes("location") &&
        (input.includes("address") ||
          input.includes("building") ||
          input.includes("offshore") ||
          input.includes("surrounding") ||
          input.includes("basic") ||
          input.includes("roof") ||
          input.includes("wall") ||
          input.includes("connection") ||
          input.includes("user-defined") ||
          input.includes("values") ||
          input.includes("contract"))
      ) {
        if (input.includes("address")) {
          return {
            content:
              "Location address validation includes optional Street, City, and Postal fields, with a required Country (ISO Code). Area (State), Sub Area (County), Sub Area 2, and CRESTA Zone are also supported. Geocode Match Level is read-only, and Latitude/Longitude can be provided. Accurate address information is crucial for geocoding and location-based risk assessment.",
            explanation: "Accurate address information is crucial for geocoding and location-based risk assessment.",
          }
        }
        if (input.includes("building")) {
          return {
            content:
              "Location basic building fields include Construction Code Type, Construction Building, Construction Other Structures, Construction Type, Number of Stories, Building Height, Stories, Gross Area, Gross Area Units, ISO Construction Code, ISO Occupancy Code, Building Value per Gross Area, Territory, and Building Height Units. Detailed building characteristics are essential for accurate catastrophe modeling and risk assessment.",
            explanation:
              "Detailed building characteristics are essential for accurate catastrophe modeling and risk assessment.",
          }
        }
        if (input.includes("offshore platform")) {
          return {
            content:
              "Location offshore platform fields include PBN Definition, AIR Structure ID, MMS Complex ID, MMS Structure Number, Federal/State Waters, Protraction/Area, Block, Replacement Value Physical Damage, Year Built, Gas Production Rate, Oil Production Rate, Deck Height, Slot Count, Slot Drill Count, Leg Count, Deck Count, Trans Frame Type, Topside Cost, Manned/Unmanned status, Company Size, and Well Count. These fields are critical for assessing offshore risks.",
            explanation:
              "Offshore platform fields are vital for understanding the specific risks associated with offshore energy infrastructure.",
          }
        }
        if (input.includes("surrounding")) {
          return {
            content:
              "Location surrounding detail fields include Pounding distance, Tree Exposure, Small Debris potential, Large Missile potential, Terrain Roughness, Adjacent Building Height, Custom Flood Standard of Protection, Custom Flood SOP Type, Custom Flood Zone, Custom Elevation, Firewise Community Participation, and Exterior Fuel Storage. These fields help assess localized risks.",
            explanation:
              "Surrounding detail fields provide context for localized risks like seismic pounding, wind-borne debris, and wildfire exposure.",
          }
        }
        if (input.includes("roof")) {
          return {
            content:
              "Location roof detail fields include Roof Geometry, Roof Pitch, Roof Covering, Roof Deck, Roof Covering Attachment, Roof Deck Attachment, Roof Anchorage, Roof Hail Impact Resistance, Roof Year Built, Tank presence, Chimney presence, Skylight type, Fire Rating for Roof Covering, Soffits, Roof Overhang, Roof Vents, and Roof Vent Size. These fields are crucial for assessing wind, hail, and fire resistance.",
            explanation: "Roof details are critical for evaluating resistance to wind, hail, and fire damage.",
          }
        }
        if (input.includes("wall")) {
          return {
            content:
              "Location wall detail fields include Wall Type, Wall Siding, Garage Doors, Roof Covering (for wall assessment), Building Exterior Opening percentage, Brick Veneer percentage, and Fire Rating for Wall Siding. These fields help determine the vulnerability of the building's exterior walls.",
            explanation:
              "Wall details are important for assessing the structural integrity and resistance to external elements.",
          }
        }
        if (input.includes("connection")) {
          return {
            content:
              "Location connection detail fields include Roof Attached Structure, Transition in SRC Type, Cold Formed Tube presence, Column Basement Type, Welding Detail, Foundation Connection, Internal Partition materials, Wall Attached Structure, Appurtenant Structure, Basement Level Count, Basement Finish Type, Deck construction, Gutter configuration, and Fences Within 5 ft. These fields assess how different parts of the structure are connected and their resistance to various perils.",
            explanation:
              "Connection details are vital for understanding structural integrity and how different components interact during perils.",
          }
        }
        if (input.includes("user-defined")) {
          return {
            content:
              "Location user-defined fields include UDF 1-5 for custom data points and Location DFID for Model Builder connection. These allow for flexible data management and integration.",
            explanation:
              "User-defined fields provide flexibility for custom data tracking and integration with other systems.",
          }
        }
        if (input.includes("values")) {
          return {
            content:
              "Location values fields include Display Currency, Total Replacement Value, Replacement Value Building, Replacement Value Other, Replacement Value Content, Replacement Value Time, Replacement Value Days Covered, Number of Employees, Annual Payroll, Average Annual Wage, Percent Day Shift, Percent Evening Shift, Percent Night Shift, Medical and Indemnity Minor/Moderate/Major/Fatality rates, Number of Risks, Per Diem Rate, and Premium. These fields are essential for financial assessment and risk quantification.",
            explanation:
              "Values fields are crucial for financial assessment, risk quantification, and premium calculation.",
          }
        }
        if (input.includes("contract")) {
          return {
            content:
              "Location contract fields include Contract ID (parent contract), Location ID (user-defined), Location Name, Location Group Name, Primary Location designation, ISOBIN, Inception Date, and Expiration Date. These fields link location-specific data to the overall contract.",
            explanation:
              "Location contract fields link specific location data to the broader insurance contract details.",
          }
        }
      }
      if (input.includes("builder's risk") || input.includes("project")) {
        return {
          content:
            "Location Builder's Risk fields validation includes Project Completion percentage and Project Phase Code (e.g., Foundation, Superstructure, Average Project Loss). These fields are used to track the progress and risk associated with construction projects.",
          explanation: "These fields are used to track the progress and risk associated with construction projects.",
        }
      }
      // Adding peril codes and options to the knowledge base
      if (input.includes("peril") || input.includes("codes") || input.includes("options")) {
        return {
          content:
            "Peril codes and options include: Earthquake (Earthquake Shake, Fire Following, Sprinkler Leakage, Landslide, Tsunami, Liquefaction), Tropical Cyclone (Wind, Storm Surge, Precipitation Flood), Severe Storm (Severe Thunderstorm [Hail, Straight-Line Winds, Tornado], Winter Storm), Inland Flood, Wildfire/Bushfire (Wildfire, Smoke), Terrorism, and Coastal flood. Peril import codes like PAL (All licensed perils), PEA (Earthquake sub-perils, wildfire/bushfire, smoke), PEF (Fire), PES (Earthquake shake only), PFF (Fire following only), PFL (Inland flood), PHL (Severe thunderstorm with hail), PLQ (Liquefaction), PLS (Landslide), PSH (Hurricane storm surge or coastal flood), PSL (Earthquake sprinkler leakage only), PSM (Smoke), PSW (Severe thunderstorm with straight-line winds), PTD (Severe thunderstorm with tornado), PTR (Terrorism), PTS (Tsunami), PWA (All wind perils), PWB (Wildfire/bushfire only), PWF (All wind and fire following earthquake sub-perils, wildfire/bushfire, smoke), PWH (Tropical cyclone only), PWT (Severe thunderstorm), and PWW (Winter storm).",
          explanation:
            "Understanding peril codes and their associated sub-perils is crucial for accurate risk modeling and coverage selection.",
        }
      }
      return {
        content:
          "I can provide details on validation rules for Contract List, Location Building Details, Location Address, Location Offshore Platform, Location Surrounding Detail, Location Basic Building, Location Roof Detail, Location Wall Detail, Location Connection Detail, Location User-Defined Fields, Location Values, Location Contract, and Location Builder's Risk. These rules ensure data integrity and consistency. Which area are you interested in?",
        explanation: "Field validation is a critical component of data quality assurance in insurance processing.",
      }
    }

    // UNICEDE-specific responses
    if (input.includes("unicede") || input.includes("format") || input.includes("standard")) {
      return {
        content:
          "UNICEDE is the industry standard for insurance data exchange, managed by Verisk Analytics. It standardizes how primary insurers, reinsurers, and intermediaries share aggregate sums insured, risk counts, and premium data. The current version supports enhanced validation and confidence scoring with comprehensive occupancy classification systems.",
        explanation:
          "UNICEDE/2 format ensures consistent data structure across different insurance applications like Touchstone, Touchstone Re, and CATRADER.",
      }
    }

    if (input.includes("geocoding") || input.includes("address") || input.includes("location")) {
      return {
        content:
          "For geocoding in UNICEDE workflows, I use confidence scoring to ensure location accuracy. Addresses are validated against known patterns, and I maintain cache entries for previously processed locations to improve efficiency and consistency. Geocoding confidence scores help determine data quality. Scores above 0.7 typically indicate reliable location matches suitable for risk assessment.",
        explanation:
          "Geocoding confidence scores help determine data quality. Scores above 0.7 typically indicate reliable location matches suitable for risk assessment.",
      }
    }

    if (input.includes("validation") || input.includes("quality") || input.includes("accuracy")) {
      return {
        content:
          "Data validation follows UNICEDE standards with multiple quality layers: business rule validation, pattern matching against known good data, confidence scoring, and exposure data validation. This includes proper occupancy code classification and SIC mapping verification. The validation reference helps identify and correct common data issues before they impact downstream risk modeling and analysis.",
        explanation:
          "The validation reference helps identify and correct common data issues before they impact downstream risk modeling and analysis.",
      }
    }

    if (input.includes("sic") || input.includes("industry") || input.includes("classification")) {
      return {
        content:
          "SIC (Standard Industrial Classification) codes provide industry context for occupancy classifications. For example, Transportation codes map to SIC 40-45, Utilities to SIC 48-49, and Restaurants to SIC 58. Residential occupancies typically don't have SIC mappings (marked as n/a). SIC codes help validate occupancy assignments and ensure consistency with industry standards for risk assessment.",
        explanation:
          "SIC codes help validate occupancy assignments and ensure consistency with industry standards for risk assessment.",
      }
    }

    if (input.includes("explain") || input.includes("why")) {
      return {
        content:
          "My decisions are based on UNICEDE data standards, learned patterns from previous processing sessions, and your configured business rules. Each step follows industry best practices for insurance data quality and validation. I combine UNICEDE format requirements with machine learning from past successful data processing to optimize accuracy and efficiency.",
        explanation:
          "I combine UNICEDE format requirements with machine learning from past successful data processing to optimize accuracy and efficiency.",
      }
    }

    if (input.includes("next") || input.includes("continue")) {
      return {
        content:
          "Based on your current progress and UNICEDE workflow standards, I recommend proceeding with the configured settings. The next step will build upon the validated data from previous stages. Each UNICEDE processing step depends on the quality and completeness of previous stages.",
        action: "proceed_next_step",
        explanation: "Each UNICEDE processing step depends on the quality and completeness of previous stages.",
      }
    }

    if (input.includes("help") || input.includes("stuck")) {
      return {
        content:
          "I'm here to help with any aspect of UNICEDE data processing! I can explain format requirements, suggest optimal settings, troubleshoot validation issues, or guide you through specific workflow steps. What specific challenge are you facing? My UNICEDE training covers all aspects of insurance data standardization and processing workflows.",
        explanation:
          "My UNICEDE training covers all aspects of insurance data standardization and processing workflows.",
      }
    }

    return {
      content:
        "I understand you're asking about the data processing workflow. As a comprehensive AI assistant trained on UNICEDE standards and Touchstone occupancy codes, I can help with format standards, occupancy classification, validation requirements, and best practices for insurance data exchange. What specific aspect would you like to explore? I analyze your questions in the context of UNICEDE standards, occupancy code requirements, and current processing step to provide relevant guidance.",
      explanation:
        "I analyze your questions in the context of UNICEDE standards, occupancy code requirements, and current processing step to provide relevant guidance.",
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card
        className={cn(
          "bg-card border-border shadow-xl transition-all duration-300 flex flex-col",
          isMinimized ? "w-80 h-16" : "w-96 h-[600px]",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-primary/5 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">Touchstone AI Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  {isAgentThinking ? "Thinking..." : "UNICEDE & Occupancy Expert"}
                </p>
              </div>
              {isAgentThinking && (
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-thinking-dots"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-thinking-dots"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-thinking-dots"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 p-0">
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex gap-3", message.type === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.type === "agent" && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3 text-sm",
                          message.type === "user"
                            ? "bg-[var(--conversation-user)] text-foreground ml-auto"
                            : "bg-[var(--conversation-agent)] text-foreground",
                        )}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>

                        {message.explanation && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                                {message.explanation}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {message.status === "complete" && <CheckCircle className="h-3 w-3 text-accent" />}
                          {message.status === "error" && <AlertCircle className="h-3 w-3 text-destructive" />}
                        </div>
                      </div>

                      {message.type === "user" && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about occupancy codes, UNICEDE standards..."
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                  disabled={isAgentThinking}
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  disabled={!inputValue.trim() || isAgentThinking}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
