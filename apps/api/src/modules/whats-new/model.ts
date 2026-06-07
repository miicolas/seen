import { Elysia, t } from "elysia";

const localizedText = t.Object({
  en: t.String(),
  fr: t.String(),
});

const feature = t.Object({
  icon: t.String(),
  title: localizedText,
  description: localizedText,
});

const release = t.Object({
  id: t.String(),
  features: t.Array(feature),
});

export const WhatsNewModel = new Elysia({ name: "WhatsNew.Model" }).model({
  "whatsNew.Release": release,
  "whatsNew.ReleaseList": t.Array(release),
});

export const whatsNewModels = WhatsNewModel.models;
