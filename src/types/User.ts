export interface Preference {
  userId: string;
  preferenceKey: string;
  preferenceValue: string;
  lastUpdatedStamp: number;
}

export default interface User {
  userFullName: string;
  timeZone: string;
  locale: string;
  partyId: string;
  userId: string;
  username: string;
  partyImageUrl?: string;
  preferences?: Array<Preference>;
}