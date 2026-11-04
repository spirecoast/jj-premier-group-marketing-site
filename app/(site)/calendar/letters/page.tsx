import { permanentRedirect } from "next/navigation";

/** /calendar/letters on its own: the Monday issues are listed on /newsletters. */
export default function EncoreLettersIndex() {
  permanentRedirect("/newsletters#encore");
}
