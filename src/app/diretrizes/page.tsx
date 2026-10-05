import { Legal } from "@/components/ui/Legal";

export const metadata = { title: "Diretrizes da Comunidade" };

export default function Diretrizes() {
  return (
    <Legal title="Diretrizes da Comunidade" updated="outubro de 2026">
      <p>A Igreja de Cristo é uma comunidade para compartilhar versículos, frases, pensamentos e conselhos e, principalmente, para engrandecer a Cristo. Para que este seja um lugar de edificação:</p>
      <h2>Incentivamos</h2>
      <ul>
        <li>Compartilhar versículos, orações, testemunhos, conselhos e palavras de ânimo.</li>
        <li>Conversar com amor, respeito e humildade, inclusive quando houver discordância.</li>
        <li>Citar a referência bíblica (por exemplo, João 3:16) sempre que possível.</li>
      </ul>
      <h2>Não é permitido</h2>
      <ul>
        <li>Assédio, ameaças, humilhação, discurso de ódio ou perseguição de qualquer pessoa.</li>
        <li>Zombar, difamar ou atacar pessoas por sua fé, igreja ou denominação.</li>
        <li>Conteúdo ilegal, fraude, golpes, venda de “milagres” ou pedidos de dinheiro.</li>
        <li>Spam, propaganda e links suspeitos.</li>
        <li>Incentivo a autolesão ou violência; dados pessoais de terceiros.</li>
        <li>Conteúdo sexual explícito ou envolvendo menores.</li>
        <li>Plágio e violação de direitos autorais.</li>
      </ul>
      <h2>Se você está passando por um momento difícil</h2>
      <p>Você não precisa enfrentar isso sozinho: converse com alguém de confiança ou com a liderança da sua igreja. No Brasil, o <strong>CVV atende 24h pelo 188</strong>.</p>
      <h2>Moderação</h2>
      <p>Denuncie conteúdo que viole estas regras pelo botão “Denunciar”. A equipe analisa cada caso e pode rejeitar, ocultar ou remover conteúdo e bloquear contas.</p>
    </Legal>
  );
}
