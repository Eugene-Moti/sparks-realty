"use client";

import { createContext, type ReactNode, useContext } from "react";
import { siteConfig } from "@/config/site";

type Contact = { phone: string; whatsapp: string };

const ContactContext = createContext<Contact>({
  phone: siteConfig.contact.phone.e164,
  whatsapp: siteConfig.contact.whatsapp.number,
});

/** Staff-editable phone/WhatsApp (site_settings) for client components such as cards. */
export function ContactProvider({ value, children }: { value: Contact; children: ReactNode }) {
  return <ContactContext value={value}>{children}</ContactContext>;
}

export function useContact(): Contact {
  return useContext(ContactContext);
}
