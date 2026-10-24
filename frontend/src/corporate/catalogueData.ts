// Curated from HST_Cleaned_Product_Catalogue.md (24 October 2026).
// Source references are inventory-line references, not SKUs or stock quantities.
// Held from publication pending identity/rating clarification:
// 13, 22, 25, 41, 45, 49, 54, 61, 63, 78, 95, 101, 102, 103.
// 73 is an operational charge and is excluded. No external specifications added.
import { catalogueCategories, type CatalogueCategory } from './catalogueCategories';
import { chintProducts } from './chintProducts';
export { catalogueCategories, type CatalogueCategory } from './catalogueCategories';
export interface CatalogueVariant {
  label: string;
  verification: string;
  source: number[];
}
export interface CatalogueProduct {
  id: string;
  name: string;
  category: CatalogueCategory;
  brand: string | null;
  variants: CatalogueVariant[];
}
const variant = (label: string, verification: string, ...source: number[]): CatalogueVariant => ({ label, verification, source });
const product = (id: string, name: string, category: number, brand: string | null, variants: CatalogueVariant[]): CatalogueProduct =>
  ({ id, name, category: catalogueCategories[category], brand, variants });

export const catalogueProducts: CatalogueProduct[] = [
  ...chintProducts,
  product('gada-spd', 'Surge protection device (SPD)', 0, 'GADA', [
    variant('2-pole DC', 'Confirm voltage, type/class, model and kA rating.', 1),
    variant('2-pole AC', 'Confirm voltage, type/class, model and kA rating.', 89),
  ]),
  product('mcb-unspecified', 'Miniature circuit breaker (MCB)', 0, null, [
    variant('1-pole, 10 A', 'Single-pole interpretation requires nameplate verification.', 14),
    variant('2-pole, 16 A', 'Brand is unspecified. Do not substitute a branded item without confirmation.', 107),
    variant('2-pole, 32 A', 'Confirm MCB identity and manufacturer.', 85),
    variant('3-pole, 10 A', 'Confirm model.', 80),
    variant('3-pole, 16 A', 'Confirm model.', 43),
    variant('3-pole, 32 A', 'Confirm model.', 53),
  ]),
  product('mccb-800', 'Moulded-case circuit breaker (MCCB)', 0, null, [variant('3-pole, 800 A', 'Confirm brand, frame and breaking capacity.', 47)]),
  product('mpcb', 'Motor protection circuit breaker (MPCB)', 0, null, [
    variant('1.5–2.5 A', 'Potential overlap with the 1.6–2.5 A entry; verify the nameplate. Not merged as one SKU.', 19, 44),
    variant('1.6–2.5 A', 'Potential overlap with the 1.5–2.5 A entry; verify the nameplate. Not merged as one SKU.', 19, 44),
    variant('2.5–4 A', 'Confirm brand and model.', 76),
    variant('4–6 A', 'Confirm brand and model.', 62),
    variant('6–10 A', 'Confirm brand and model.', 84),
    variant('10 A, 3-pole', 'Confirm whether this is a fixed rating or an adjustment range.', 70),
    variant('13–18 A', 'Confirm brand and model.', 90),
  ]),
  product('earth-leakage', 'Earth leakage protection device', 0, null, [variant('2-pole, 63 A', 'Confirm RCCB/RCBO type and residual-current rating.', 26)]),
  product('siemens-hrc', 'HRC fuse', 0, 'Siemens', [variant('NH00, listed 125 A', 'Ampere rating requires verification against the original marking.', 99)]),
  product('hrc-fuse', 'HRC fuse', 0, null, [variant('NH00, 160 A', 'Confirm manufacturer.', 159)]),
  product('hrc-base', 'HRC fuse holder / base', 0, null, [
    variant('600 A base', 'Confirm fuse size and type.', 96),
    variant('160 A holder/base', 'Confirm fuse size and type. Germany is a source descriptor, not a brand.', 166),
    variant('Rating unspecified', 'Confirm rating and size.', 160),
    variant('Double set', 'Confirm specification.', 66),
  ]),
  product('glass-fuse', 'Glass fuse', 0, null, [
    variant('1 A', 'Confirm physical dimensions and voltage.', 69),
    variant('25 A', 'Confirm physical dimensions and voltage.', 69),
    variant('2 A, small', 'Confirm physical dimensions and voltage.', 111),
  ]),
  product('fuse-puller', 'Fuse puller', 0, null, [variant('Compatible type to confirm', 'Confirm compatible fuse type.', 79)]),
  product('siemens-contactor', 'Magnetic contactor', 1, 'Siemens', [
    variant('55 kW, 220 V coil', 'Confirm coil AC/DC and exact model.', 58),
    variant('75 kW, 220 V coil', 'Confirm coil AC/DC and exact model.', 72),
    variant('110 kW, 220 V coil', 'Confirm coil AC/DC and exact model.', 30),
  ]),
  product('schneider-contactor', 'Magnetic contactor', 1, 'Schneider', [
    variant('25 A', 'Confirm coil voltage and model.', 151),
    variant('32 A', 'Confirm coil voltage and model.', 149),
  ]),
  product('contactor-unspecified', 'Magnetic contactor', 1, null, [
    variant('5.5 kW, 220 V AC coil', 'Brand unspecified; confirm exact model.', 112),
    variant('7.5 kW, 24 V AC coil', 'Brand unspecified; confirm exact model.', 35),
    variant('7.5 kW, 220 V AC coil', 'Brand unspecified; confirm exact model.', 87),
    variant('11 kW, 24 V AC coil', 'Brand unspecified; confirm exact model.', 93),
    variant('11 kW, 220 V AC coil', 'Brand unspecified; confirm exact model.', 171),
    variant('15 kW, 24 V AC coil', 'Brand unspecified; confirm exact model.', 172),
  ]),
  product('schneider-aux', 'Auxiliary contact block', 1, 'Schneider', [
    variant('LADN22, 2NO+2NC', 'Verify brand, part marking and compatibility.', 81),
    variant('2NO+2NC, part number unspecified', 'May overlap LADN22; confirm the part number before ordering.', 98),
  ]),
  product('mpcb-aux', 'MPCB auxiliary contact', 1, null, [variant('GAVE11', 'Confirm manufacturer and compatibility.', 8)]),
  product('schneider-eocr', 'Electronic overload relay', 1, 'Schneider', [
    variant('EOCR SS, 0.5–6 A', 'Verify series and trip range.', 126),
    variant('EOCR SS, 6–60 A', 'Verify series and trip range.', 136),
  ]),
  product('eocr', 'Electronic overload current relay (EOCR)', 1, null, [variant('5–70 A', 'Brand and model unspecified; verify the range.', 158)]),
  product('schneider-phase', 'Phase sequence relay', 1, 'Schneider', [
    variant('RM22 series', 'Exact part number must be confirmed; series is not a complete model.', 130),
    variant('RM35 series', 'Exact part number must be confirmed; series is not a complete model.', 130),
  ]),
  product('schneider-voltage', 'Voltage control relay', 1, 'Schneider', [variant('RM22TR33', 'Confirm precise model suffix.', 156)]),
  product('zahra-phase', 'Phase sequence relay', 1, 'ZAHRA', [variant('RST25', 'Verify datasheet and electrical ratings.', 131)]),
  product('phase-unspecified', 'Phase sequence relay', 1, null, [variant('Model to confirm', 'Exact model is required.', 125)]),
  product('schneider-relay', 'Miniature relay', 1, 'Schneider', [
    variant('14-pin, 24 V DC', 'Confirm exact model.', 42),
    variant('8-pin, 24 V DC', 'Confirm exact model.', 92),
  ]),
  product('omron-relay', 'Miniature relay', 1, 'Omron', [
    variant('14-pin, 24 V AC', 'Confirm exact model; country descriptors are not manufacturer authorization.', 75),
    variant('8-pin, 24 V DC', 'Confirm exact model.', 109),
  ]),
  product('relay-unspecified', 'Miniature relay', 1, null, [variant('14-pin, 220 V AC', 'Brand unspecified; confirm model.', 52)]),
  product('relay-base', 'Relay base', 1, null, [variant('14-pin', 'Confirm socket pattern.', 105)]),
  product('analog-timer', 'Analog timer with base', 1, null, [variant('Model to confirm', 'Model and timing range are required.', 11)]),
  product('st3pa-timer', 'Timer with base', 1, null, [variant('ST3PA-A', 'Verify manufacturer, voltage and timing range.', 57)]),
  product('fuji-timer', 'Super Timer', 1, 'Fuji', [
    variant('ST3P, 8-pin, 100–240 V AC', 'Verify exact part number.', 143),
    variant('AH31C, 0–60 s, 240 V AC', 'Verify exact part number.', 147),
  ]),
  product('pf-controller', 'Power factor controller', 1, null, [variant('Specification to confirm', 'Confirm steps, voltage and model.', 164)]),
  product('pf-capacitor', 'Power factor correction capacitor', 1, null, [variant('50 kVAR, 415 V', 'Confirm frequency, duty and model.', 3)]),
  product('proximity', 'Proximity sensor', 2, null, [
    variant('NPN, model unspecified', 'Model is required.', 15),
    variant('PR18-80N, 10–30 V DC, NPN', 'Confirm exact model and sensing distance.', 46),
  ]),
  product('omron-photoelectric', 'Photoelectric sensor', 2, 'Omron', [variant('E3F3-D-12', 'Confirm manufacturer/model spelling and electrical details.', 68)]),
  product('omron-sensor', 'Sensor', 2, 'Omron', [variant('E3Z-D62', 'Confirm precise model suffix.', 169)]),
  product('power-supply', 'Regulated DC power supply', 2, null, [
    variant('12 V DC, 10 A', 'Confirm input voltage and model.', 123),
    variant('24 V DC, 10 A', 'Confirm input voltage and model.', 33),
  ]),
  product('cooling-fan', 'AC axial cooling fan', 2, null, [
    variant('4×4 in, 220 V', 'Confirm physical dimensions and AC frequency.', 120),
    variant('6 in, 220 V', 'Confirm physical dimensions and AC frequency.', 20),
    variant('8 in, 220 V', 'Confirm physical dimensions and AC frequency.', 167),
  ]),
  product('flex-wire', 'Flexible single-core wire', 3, null, [
    ...['Red', 'Yellow', 'Blue', 'Black'].map(colour => variant(`1 mm², ${colour.toLowerCase()}`, 'Cross-sectional unit is an editorial interpretation; confirm label, length and supply unit.', 10, 91)),
  ]),
  product('coppergat-wire', 'Flexible single-core wire', 3, 'COPPERGAT', [
    ...['Red', 'Yellow', 'Blue', 'Black'].map(colour => variant(`1 mm², ${colour.toLowerCase()}`, 'Confirm nameplate size and packaging; cross-sectional unit requires verification.', 110)),
  ]),
  product('coppergat-15', 'Single-core wire', 3, 'COPPERGAT', [
    ...['Red', 'Yellow', 'Blue', 'Black'].map(colour => variant(`1.5 mm², ${colour.toLowerCase()}`, 'Confirm nameplate size and packaging; cross-sectional unit requires verification.', 140)),
  ]),
  product('coppergat-black', 'Black single-core wire', 3, 'COPPERGAT', [variant('2.5 mm², 7/29, listed 90 m coil', 'Verify 7/29 designation, conductor cross-section and coil length.', 139)]),
  product('single-core-flex', 'Flexible single-core cable', 3, null, [
    variant('0.75 mm²', 'Confirm conductor, voltage and cross-sectional unit.', 86),
    variant('120 mm²', 'Confirm conductor, voltage and cross-sectional unit.', 119),
  ]),
  product('control-wire', 'Single-core control wire', 3, null, [variant('1 mm²', 'May overlap flexible 1 mm² wire; confirm type and cross-sectional unit.', 115)]),
  product('copper-single-core', 'Flexible copper single-core cable', 3, null, [variant('25 mm², listed 440 V', 'Confirm voltage rating, conductor class and cross-sectional unit.', 12)]),
  product('earth-wire', 'Single-core earthing wire', 3, null, [variant('10 mm²', 'Confirm insulation, conductor and cross-sectional unit.', 108)]),
  product('flex-three-small', 'Flexible 3-core cable', 3, null, [variant('0.5 mm²', 'Confirm copper conductor, voltage and cross-sectional unit.', 118)]),
  product('shielded-flex', 'Flexible shielded cable', 3, null, [
    variant('3-core', 'Confirm core size, shielding and voltage.', 165),
    variant('4-core', 'Confirm core size, shielding and voltage.', 36),
  ]),
  product('pvc-copper-cable', 'Flexible PVC copper cable', 3, null, [
    variant('3-core, 50 mm²', 'Brand unspecified. Confirm nameplate cross-section and voltage.', 122),
    variant('3-core, 70 mm²', 'Brand unspecified. Confirm nameplate cross-section and voltage.', 59),
    variant('3-core, 95 mm²', 'Brand unspecified. Confirm nameplate cross-section and voltage.', 82),
  ]),
  product('coppergat-pvc', 'Flexible PVC copper cable', 3, 'COPPERGAT', [
    variant('3-core, 50 mm²', 'Confirm nameplate cross-section and voltage.', 65),
    variant('3-core, 70 mm²', 'Confirm nameplate cross-section and voltage.', 77),
    variant('3-core, 95 mm²', 'Confirm nameplate cross-section and voltage.', 83),
  ]),
  product('cable-tray', 'Cable tray', 4, null, [
    variant('4×4 in, 18 gauge', 'Confirm material, finish and length.', 5),
    variant('9×4 in, 16 gauge', 'Confirm material, finish and length.', 37),
  ]),
  product('drag-chain', 'Cable carrier / drag chain', 4, null, [variant('18×25 mm, 1 m', 'Source called this a chain tray; verify dimensions.', 173)]),
  product('din-rail', 'DIN rail / channel patti', 4, null, [variant('Generic', 'Confirm length and profile.', 9)]),
  product('onka-rail', 'DIN rail / channel patti', 4, 'ONKA', [variant('Listed marking: 422', 'Confirm whether ONKA 422 is the exact model.', 29)]),
  product('distribution-board', 'Distribution board', 4, null, [variant('12-way, basic', 'Confirm material and IP rating.', 71)]),
  product('ms-db', 'Powder-coated mild-steel DB enclosure', 4, null, [variant('Listed size: 1.5×2 (units unconfirmed)', 'Confirm units, depth, gauge and IP rating.', 106)]),
  product('bakelite-strip', 'Bakelite connector strip', 4, null, [variant('200 A, 3-pole', 'Confirm terminal count.', 51)]),
  product('pvc-strip', 'PVC connector strip', 4, null, [
    variant('15 A', 'Confirm pole count.', 117), variant('16 A', 'Confirm pole count.', 100),
    variant('60 A', 'Confirm pole count.', 97), variant('100 A', 'Confirm pole count.', 32),
  ]),
  product('neutral-strip', 'Neutral connector strip', 4, null, [variant('Rating to confirm', 'Confirm terminal count and current rating.', 6)]),
  product('flex-conduit', 'Flexible conduit / pipe', 4, null, [
    variant('Black, 1 in', 'Confirm material and length.', 114), variant('White, 1 in', 'Confirm material and length.', 154),
  ]),
  product('pvc-gland', 'PVC cable gland', 4, null, [
    variant('PG11', 'Confirm thread type and cable range.', 64),
    variant('Listed PG13', 'Could be PG13.5; verify before ordering.', 21),
    variant('PG36', 'Confirm thread type and cable range.', 4),
  ]),
  product('toggle-switch', 'Toggle switch', 5, null, [
    variant('2-way', 'Confirm contacts and poles.', 2), variant('1-way / 2-position', 'Confirm contact arrangement.', 40),
  ]),
  product('selector-switch', 'Selector switch', 5, null, [
    variant('1-way', 'Confirm contact arrangement.', 39), variant('2-way', 'Confirm contact arrangement.', 60),
    variant('3-pole, 32 A', 'Confirm exact switch type.', 155), variant('3-pole, 50 A', 'Confirm exact switch type.', 153),
    variant('3-pole, 75 A', 'Confirm exact switch type.', 129),
  ]),
  product('db-selector', 'Distribution board selector switch', 5, null, [variant('Type to confirm', 'Confirm type and rating.', 134)]),
  product('push-button', 'Push button', 5, null, [variant('Green / red / on — arrangement to confirm', 'Verify separate variants versus a single assembly.', 116)]),
  product('double-button', 'Double push button with auxiliary', 5, null, [variant('Red / green', 'Confirm contact arrangement.', 55)]),
  product('emergency-stop', 'Emergency stop switch', 5, null, [variant('Red', 'Confirm latching and contact arrangement.', 88)]),
  product('indicator', 'Indicator light', 5, null, [variant('Green, 220 V', 'Confirm AC/DC and mounting diameter.', 38)]),
  product('plug-socket', 'Plug and socket', 5, null, [variant('3-pin, 16 A', 'Confirm industrial or domestic type.', 17)]),
  product('piano-socket', 'Piano socket box', 5, null, [variant('13 A', 'Confirm form factor.', 170)]),
  product('copper-lug', 'Copper cable lug / thimble', 6, null, [
    variant('25 mm²', 'Confirm conductor cross-section and stud-hole diameter.', 161),
    variant('120 mm², listed 12 mm stud hole', 'Verify cross-sectional unit and original 120 mm–12 mm designation.', 16),
    variant('300 mm²', 'Confirm conductor cross-section and stud-hole diameter.', 162),
  ]),
  product('tin-thimble', 'Tin-coated thin cable thimble', 6, null, [variant('25 mm²', 'Confirm lug type and cross-sectional unit.', 18)]),
  product('cable-lug', 'Cable lug / thimble', 6, null, [variant('25 mm², listed 10 mm stud hole', 'Confirm dimensions and cross-sectional unit.', 56)]),
  product('shrouded-lug', 'Cable lug with shroud', 6, null, [
    variant('1.5 mm², listed pack of 100', 'Confirm cross-sectional unit and pack size.', 127),
    variant('2.5 mm², listed pack of 100', 'Confirm cross-sectional unit and pack size.', 146),
    variant('4 mm², listed pack of 100', 'Confirm cross-sectional unit and pack size.', 124),
    variant('6 mm²', 'Confirm cross-sectional unit and per-piece packaging.', 144),
    variant('10 mm²', 'Confirm cross-sectional unit and per-piece packaging.', 152),
    variant('16 mm²', 'Confirm cross-sectional unit and per-piece packaging.', 141),
    variant('25 mm²', 'Confirm cross-sectional unit and per-piece packaging.', 145),
    variant('35 mm²', 'Confirm cross-sectional unit and per-piece packaging.', 128),
    variant('70 mm²', 'Confirm cross-sectional unit and per-piece packaging.', 132),
  ]),
  product('tube-ferrule', 'Tube ferrule', 6, null, [
    variant('1.5 mm², listed pack of 2000', 'Confirm cross-sectional unit and package quantity.', 23),
    variant('6 mm²', 'Confirm cross-sectional unit and package quantity.', 163),
  ]),
  product('identification-ferrule', 'Wire identification ferrule', 6, null, [
    variant('1 mm²', 'Confirm marker versus crimp ferrule and size units.', 104),
    variant('2 mm²', 'Confirm marker versus crimp ferrule and size units.', 74),
    variant('4 mm²', 'Confirm marker versus crimp ferrule and size units.', 113),
  ]),
  product('heat-shrink-tube', 'Heat-shrink tubing', 6, null, [
    variant('Listed 2 mm', 'Confirm diameter versus cable cross-section.', 48),
    variant('Listed 6 mm', 'Confirm diameter versus cable cross-section.', 168),
  ]),
  product('heat-shrink-sleeve', 'Heat-shrink sleeve', 6, null, [
    variant('Listed 60 mm', 'Confirm diameter.', 175), variant('Listed 95 mm', 'Confirm diameter.', 34), variant('Listed 120 mm', 'Confirm diameter.', 174),
  ]),
  product('polyolefin-wrap', 'Polyolefin heat-shrink wrap', 6, null, [
    variant('For listed 50 mm² cable', 'Confirm cable cross-section and expanded/recovered diameters.', 133),
    variant('For listed 120 mm² cable', 'Confirm cable cross-section and expanded/recovered diameters.', 135),
    variant('For listed 300 mm² cable', 'Confirm cable cross-section and expanded/recovered diameters.', 142),
  ]),
  product('cable-tie', 'Cable tie', 6, null, [
    variant('150 mm', 'Confirm width and colour.', 148), variant('200 mm', 'Confirm width and colour.', 150), variant('300 mm', 'Confirm width and colour.', 138),
  ]),
  product('cable-tie-taiwan', 'Cable tie — Taiwan sourcing descriptor', 6, null, [
    variant('300 mm', 'Confirm width, colour and material. Kept separate from the other 300 mm entry.', 28),
    variant('450 mm', 'Confirm width and colour.', 157), variant('550 mm', 'Confirm width and colour.', 7),
  ]),
  product('pvc-tape', 'PVC electrical tape', 6, null, [
    ...['Red', 'Yellow', 'Black', 'Blue'].map(colour => variant(colour, 'Confirm dimensions and brand.', 137)),
  ]),
  product('3m-tape', 'HT insulation tape', 6, '3M', [variant('Exact product to confirm', 'Confirm the 3M product and whether HT means high-temperature or high-tension.', 27)]),
  product('cable-cutter', 'Cable cutter', 6, null, [variant('24 in', 'Confirm tool specification.', 31)]),
  product('battery-terminal', 'Battery terminal', 6, null, [variant('Type to confirm', 'Confirm terminal type and size.', 50)]),
];
