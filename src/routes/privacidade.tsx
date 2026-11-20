import { createFileRoute } from "@tanstack/react-router";
import { CONTATO, LegalPage } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Rumo Trip" },
      { name: "description", content: "Como o Rumo Trip coleta, usa e protege seus dados." },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <LegalPage title="Política de Privacidade">
      <p>
        Esta política explica quais dados o <strong>Rumo Trip</strong> (app de planejamento de viagens em{" "}
        <a href="https://rumo-ashy.vercel.app">rumo-ashy.vercel.app</a>) coleta, para que usa e como você pode excluí-los.
        O Rumo Trip é um projeto pessoal desenvolvido por Israel dos Reis.
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><strong>Conta:</strong> nome, e-mail e foto de perfil. Ao entrar com o Google, recebemos apenas nome, e-mail e foto dessa conta.</li>
        <li><strong>Viagens que você cadastra:</strong> destinos e datas, roteiro, transportes, hospedagens, atividades, orçamento, gastos, documentos, checklist e notas, além das imagens e arquivos que você anexar (capas, comprovantes, bilhetes).</li>
        <li><strong>Passaporte:</strong> apenas os <strong>4 últimos dígitos</strong> do número e a data de validade, se você informar. Nunca guardamos o número completo.</li>
        <li><strong>Viajantes:</strong> nomes (e, se você informar, e-mails) das pessoas que viajam com você.</li>
        <li><strong>Dados técnicos de login:</strong> o necessário para manter sua sessão e a segurança da conta.</li>
      </ul>
      <p>Não coletamos dados bancários, localização em tempo real nem dados para publicidade. O app não usa ferramentas de anúncios ou rastreamento.</p>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Mostrar e organizar suas viagens, roteiro, orçamento, gastos e carimbos do passaporte.</li>
        <li>Buscar cotações de moedas (Frankfurter) e localizar endereços no mapa (OpenStreetMap). Para isso, enviamos apenas a moeda ou o endereço pesquisado, nunca dados da sua conta.</li>
        <li>Permitir o login e a recuperação de acesso.</li>
      </ul>
      <p>Seus dados <strong>não são vendidos, alugados nem compartilhados</strong> com terceiros para fins comerciais.</p>

      <h2>3. Compartilhamento que você controla</h2>
      <ul>
        <li><strong>Convites:</strong> ao convidar alguém para uma viagem, essa pessoa passa a ver (ou editar, conforme a permissão que você der) os dados daquela viagem.</li>
        <li><strong>Link público:</strong> se você criar um link público, quem tiver o link vê apenas o roteiro, sem valores, códigos de reserva, documentos ou notas. Você pode desativar o link a qualquer momento.</li>
      </ul>

      <h2>4. Onde os dados ficam</h2>
      <p>
        Os dados são armazenados no <strong>Supabase</strong> (banco de dados e arquivos), com regras de segurança que permitem a cada
        usuário acessar apenas as próprias viagens e as compartilhadas com ele. Arquivos ficam em área privada. O site é hospedado na{" "}
        <strong>Vercel</strong> e o login social usa o <strong>Google</strong>. Para funcionar sem internet, o app pode guardar uma cópia
        temporária de alguns dados no próprio aparelho.
      </p>

      <h2>5. Seus direitos (LGPD)</h2>
      <p>Você pode, a qualquer momento:</p>
      <ul>
        <li>consultar, corrigir e apagar suas viagens e dados diretamente no app;</li>
        <li>exportar uma viagem em PDF ou planilha;</li>
        <li>pedir a <strong>exclusão da sua conta</strong> e de todos os dados escrevendo para <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.</li>
      </ul>

      <h2>6. Retenção</h2>
      <p>Os dados ficam guardados enquanto a conta existir. Depois da exclusão da conta, eles são removidos e não podem ser recuperados.</p>

      <h2>7. Alterações</h2>
      <p>Esta política pode ser atualizada. A data da última atualização fica no topo desta página.</p>
    </LegalPage>
  );
}
