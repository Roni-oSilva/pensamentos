const P = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

/** Ícone “Compartilhar” do Safari (quadrado com seta para cima). */
export const ShareIosIcon = () => <svg {...P}><path d="M12 3v12M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></svg>;
/** Ícone “Adicionar à Tela de Início” (quadrado com +). */
export const AddSquareIcon = () => <svg {...P}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" /></svg>;
/** Menu de três pontos do Chrome. */
export const DotsIcon = () => <svg {...P} fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>;
