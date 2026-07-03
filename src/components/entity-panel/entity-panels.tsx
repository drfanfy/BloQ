import { SocieteSheet } from "./societe-sheet";
import { ContactSheet } from "./contact-sheet";
import { NegociationSheet } from "./negociation-sheet";

export function EntityPanels() {
  return (
    <>
      <SocieteSheet />
      <ContactSheet />
      <NegociationSheet />
    </>
  );
}
