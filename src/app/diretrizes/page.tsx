import { Legal } from "@/components/ui/Legal";

export const metadata = { title: "Diretrizes da Comunidade" };

export default function Diretrizes() {
  return (
    <Legal title="Diretrizes da Comunidade" updated="outubro de 2026">
      <p>Heresia aqui é liberdade de pensar — não licença para ferir. Para manter o espaço bom:</p>
      <h2>Pode</h2>
      <ul>
        <li>Duvidar, questionar, ser melancólico, irônico, provocador e honesto.</li>
        <li>Discordar com argumentos.</li>
      </ul>
      <h2>Não pode</h2>
      <ul>
        <li>Assédio, ameaças, discurso de ódio ou perseguição.</li>
        <li>Conteúdo ilegal, fraude, golpes ou spam.</li>
        <li>Incentivo a autolesão ou violência; dados pessoais de terceiros.</li>
        <li>Conteúdo sexual explícito ou envolvendo menores.</li>
        <li>Plágio e violação de direitos autorais.</li>
      </ul>
      <h2>Se você está mal</h2>
      <p>Se um pensamento estiver pesado demais, procure ajuda. No Brasil, o <strong>CVV atende 24h pelo 188</strong>.</p>
      <h2>Moderação</h2>
      <p>Denuncie conteúdo que viole estas regras pelo botão “Denunciar”. A equipe analisa cada caso e pode rejeitar, ocultar ou remover conteúdo e bloquear contas.</p>
    </Legal>
  );
}
