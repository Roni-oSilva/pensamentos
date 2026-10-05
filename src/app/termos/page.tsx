import { Legal } from "@/components/ui/Legal";

export const metadata = { title: "Termos de Uso" };

export default function Termos() {
  return (
    <Legal title="Termos de Uso" updated="outubro de 2026">
      <p>Ao criar uma conta ou usar o Heresias, você concorda com estes termos.</p>
      <h2>O serviço</h2>
      <p>O Heresias é uma plataforma de textos e frases de estética sombria e reflexiva. O tema é artístico: não toleramos incentivo a violência, ódio, crimes ou autolesão.</p>
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
      <p>O serviço é oferecido “como está”. Não nos responsabilizamos por opiniões publicadas por usuários.</p>
      <h2>Alterações e foro</h2>
      <p>Podemos atualizar estes termos; mudanças relevantes serão comunicadas. Fica eleito o foro do domicílio do consumidor.</p>
    </Legal>
  );
}
