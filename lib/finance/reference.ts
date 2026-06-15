/**
 * SSOT for the financial-integrity rule thresholds.
 * Reference prices live per line item on the scenario (regional reference price);
 * these constants are the cross-cutting limits the reconciliation engine applies.
 */

/** An invoice within this band *below* the approval threshold looks like threshold-gaming. */
export const THRESHOLD_GAMING_BAND = 0.05;

/** A single supplier winning at least this share of awards is a concentration risk. */
export const SUPPLIER_CONCENTRATION_LIMIT = 0.7;

/** Two invoices from one supplier whose amounts match within this tolerance look duplicated. */
export const DUPLICATE_AMOUNT_TOLERANCE = 0.01;

/** Ignore trivial per-item overages below this fraction when flagging markup. */
export const MARKUP_MIN_FRACTION = 0.02;
