export class MerchantRegisteredEvent {
  constructor(
    public readonly merchantId: string,
    public readonly email: string,
    public readonly name: string,
  ) {}
}