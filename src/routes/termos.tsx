import { createFileRoute, Link } from "@tanstack/react-router";
import { CONTATO, LegalPage } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Rumo Trip" },
      { name: "description", content: "Termos de uso do Rumo Trip." },
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <LegalPage title="Termos de Uso">
      <p>
        Ao criar uma conta ou usar o <strong>Rumo Trip</strong>, você concorda com estes termos. O Rumo Trip é um projeto pessoal e
        gratuito, desenvolvido por Israel dos Reis.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O Rumo Trip ajuda a planejar viagens: roteiro, transportes, hospedagens, atividades, orçamento, gastos, documentos e checklist,
        a partir do que <strong>você</strong> cadastra. O app não vende passagens, hospedagens ou passeios, não faz reservas e não
        movimenta dinheiro.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>Você é responsável pelas informações que cadastra e por manter o acesso à sua conta seguro.</li>
        <li>Ao convidar outras pessoas ou criar um link público, você decide o que compartilha.</li>
        <li>Use o app apenas para fins pessoais e lícitos.</li>
      </ul>

      <h2>3. Informações de terceiros</h2>
      <p>
        Cotações de moedas, fusos horários, mapas e endereços vêm de serviços externos e podem conter erros ou atrasos. Confira
        horários, valores e regras de entrada (vistos, validade do passaporte, seguro) nas fontes oficiais antes de viajar.
      </p>

      <h2>4. Disponibilidade</h2>
      <p>
        O Rumo Trip é oferecido <strong>"no estado em que se encontra"</strong>, sem garantia de funcionamento contínuo ou livre de
        erros. O serviço pode ficar indisponível, mudar ou ser encerrado. Recomendamos exportar suas viagens se quiser manter uma cópia.
      </p>

      <h2>5. Privacidade</h2>
      <p>O tratamento dos seus dados segue a <Link to="/privacidade">Política de Privacidade</Link>.</p>

      <h2>6. Contato</h2>
      <p>Dúvidas sobre estes termos: <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.</p>
    </LegalPage>
  );
}
