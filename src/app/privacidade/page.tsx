import { Legal } from "@/components/ui/Legal";

export const metadata = { title: "Política de Privacidade" };

export default function Privacidade() {
  return (
    <Legal title="Política de Privacidade" updated="outubro de 2026">
      <p>Esta política explica, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018), quais dados tratamos no Heresias, por quê e quais são os seus direitos.</p>
      <h2>Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> e-mail e senha (a senha é guardada apenas como hash pelo provedor de autenticação, nunca em texto).</li>
        <li><strong>Perfil público:</strong> nome de usuário, nome de exibição, avatar e bio — informados por você.</li>
        <li><strong>Conteúdo:</strong> publicações, comentários, curtidas, favoritos e seguidores.</li>
        <li><strong>Segurança:</strong> endereço IP é usado apenas de forma anonimizada (hash com sal) para limitar abusos; não é exibido nem armazenado em texto.</li>
      </ul>
      <p>Não coletamos dados além do necessário e não vendemos dados pessoais.</p>
      <h2>Base legal e finalidades</h2>
      <p>Execução do serviço que você solicitou (art. 7º, V), legítimo interesse para segurança e prevenção a fraudes (art. 7º, IX) e cumprimento de obrigações legais.</p>
      <h2>O que é público e o que é privado</h2>
      <p>Seu e-mail <strong>nunca</strong> é exibido. Seu perfil, suas publicações aprovadas e seus comentários são públicos. Curtidas e favoritos são privados.</p>
      <h2>Seus direitos</h2>
      <ul>
        <li>Acessar e corrigir seus dados em <strong>Configurações</strong>.</li>
        <li>Excluir publicações a qualquer momento.</li>
        <li>Excluir a conta e todos os dados vinculados em <strong>Configurações → Privacidade e dados</strong> (exclusão imediata e definitiva).</li>
        <li>Solicitar informações ou exercer outros direitos pelo contato abaixo.</li>
      </ul>
      <h2>Compartilhamento e armazenamento</h2>
      <p>Usamos provedores de infraestrutura (hospedagem, banco de dados, autenticação e armazenamento de arquivos) como operadores, sob contrato. Dados podem ser processados fora do Brasil com salvaguardas adequadas.</p>
      <h2>Retenção</h2>
      <p>Mantemos os dados enquanto a conta existir. Backups podem reter cópias por até 30 dias após a exclusão.</p>
      <h2>Cookies</h2>
      <p>Usamos apenas cookies estritamente necessários (sessão de login). Não usamos cookies de publicidade.</p>
      <h2>Contato do encarregado (DPO)</h2>
      <p>Defina aqui o e-mail de contato do responsável pelo projeto antes de publicar em produção.</p>
    </Legal>
  );
}
