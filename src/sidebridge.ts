export const SIDEBRIDGE_VERSION = "1.0" as const;

export type SBMessageFrom = "user" | "assistant" | "system" | "unknown";

export interface SBMessageSource {
  title: string;
  url: string;
}

export interface SBMessage {
  id: string;
  from: SBMessageFrom;
  content: string;
  sources?: SBMessageSource[];
}

export interface SBOptions {
  disableSendHistory?: boolean;
  endSession?: boolean;
}

export interface SBRequest {
  sidebridge: string;
  chatId: string;
  messages?: SBMessage[];
  history?: SBMessage[];
}

export interface SBResponse {
  messages?: SBMessage[];
  options?: SBOptions;
}

export function createSBMessage(message: SBMessage): SBMessage {
  return message;
}

export function createSBOptions(options: SBOptions = {}): SBOptions {
  return { ...options };
}

export function createSBResponse(response: SBResponse = {}): SBResponse {
  return { ...response };
}
