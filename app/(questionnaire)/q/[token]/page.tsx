import { notFound } from "next/navigation";
import { CompiledView } from "@/components/questionnaire/compiled-view";
import { QuestionnaireForm, type InitialAnswers } from "@/components/questionnaire/questionnaire-form";
import { roleForToken } from "@/lib/questionnaire/access";
import { RESPONDENTS } from "@/lib/questionnaire/model";
import { loadAnswers } from "@/lib/questionnaire/store";
import { saveQuestionnaireAnswers } from "./actions";

/** Answers change between visits; never cache a render. */
export const dynamic = "force-dynamic";

export default async function QuestionnairePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const role = roleForToken(token);
  if (!role) notFound();

  if (role === "admin") {
    const { state, answers } = await loadAnswers([...RESPONDENTS]);
    return <CompiledView token={token} state={state} answers={answers} />;
  }

  const { state, answers } = await loadAnswers([role]);
  const initial: InitialAnswers = {};
  for (const a of answers) initial[a.questionId] = { value: a.value, choice: a.choice, updatedAt: a.updatedAt };
  return <QuestionnaireForm token={token} respondent={role} db={state} initial={initial} save={saveQuestionnaireAnswers} />;
}
