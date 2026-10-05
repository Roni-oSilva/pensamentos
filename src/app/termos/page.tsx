import { Legal } from "@/components/ui/Legal";

export const metadata = { title: "Termos de Uso" };

export default function Termos() {
  return (
    <Legal title="Termos de Uso" updated="outubro de 2026">
      <p>Ao criar uma conta ou usar a Igreja de Cristo, você concorda com estes termos.</p>
      <h2>O serviço</h2>
      <p>A Igreja de Cristo é uma comunidade online para compartilhar versículos, frases, pensamentos e conselhos e engrandecer a Cristo. Não toleramos ódio, zombaria da fé, golpes, violência ou autolesão.</p>
      <h2>Sua conta</h2>
      <ul>
        <li>Você é responsável pela segurança da sua senha. Recomendamos ativar a autenticação em duas etapas.</li>
        <li>É proibido se passar por outra pessoa ou tentar obter privilégios administrativos.</li>
      </ul>
      <h2>Seu conteúdo</h2>
      <p>Você mantém os direitos sobre o que publica e nos concede licença não exclusiva para exibi-lo na plataforma. Você declara ter direito de publicar o conteúdo enviado.</p>
      <h2>Moderação</h2>
      <p>Publicações da comunidade passam por aprovação. Podemos rejeitar, ocultar ou remover conteúdo e bloquear contas que violem as <a className="link-muted" href="/diretrizes">Diretrizes</a> ou a lei.</p>
      <h2>Abuso</h2>
      <p>Spam, automação abusiva e tentativas de burlar a segurança resultam em bloqueio.</p>
      <h2>Limitação de responsabilidade</h2>
      <p>O serviço é oferecido “como está”. Não nos responsabilizamos por opiniões e conselhos publicados por usuários, que não substituem o acompanhamento pastoral, médico ou psicológico.</p>
      <h2>Alterações e foro</h2>
      <p>Podemos atualizar estes termos; mudanças relevantes serão comunicadas. Fica eleito o foro do domicílio do consumidor.</p>
    </Legal>
  );
}
