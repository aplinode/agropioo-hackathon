export function appControlModel() {
  return process.env.APP_CONTROL_MODEL ?? process.env.ADVISOR_MODEL ?? "gpt-4o-mini";
}
