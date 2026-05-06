import { Inngest } from "inngest";

export type LeadCapturedEvent = {
  name: "lead.captured";
  data: {
    contactId: string;
    source: string;
    sourceDetail: string;
  };
};

export const inngest = new Inngest({ id: "real-estate" });
