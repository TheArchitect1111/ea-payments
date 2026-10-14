/** Generic price socket. Values are provided by each client's offer configuration. */
export interface PriceContract { amountCad: number; contractId: string }
export interface ClientPriceCatalog { readonly clientId: string; price(offerId: string): PriceContract }
export function assertPriceContract(value: PriceContract): PriceContract {
 if (!value || !Number.isFinite(value.amountCad) || value.amountCad < 0 || !value.contractId?.trim()) throw new Error('Invalid price contract');
 return value;
}
