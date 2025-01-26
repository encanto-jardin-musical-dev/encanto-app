import es from "./messages/es.json";

type Messages = typeof es;

declare global {
  // Use type safe message keys with `next-intl`
  type IntlMessages = Messages;
}
