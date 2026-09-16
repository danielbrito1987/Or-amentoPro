import { ItemType, ContractItemClause, QuoteItem, ProviderInfo, Quote } from '../types';
import { formatCurrency } from '../utils/formatters';

export interface ClausePreset {
  id: string;
  category: 'servico' | 'produto' | 'geral';
  title: string;
  description: string;
  clauseText: string;
}

/**
 * Modelos prontos de cláusulas contratuais específicas para prestadores de serviços brasileiros
 */
export const CONTRACT_CLAUSE_PRESETS: ClausePreset[] = [
  {
    id: 'preset-garantia-servico-1ano',
    category: 'servico',
    title: 'Garantia Especial de Mão de Obra (1 Ano)',
    description: 'Ideal para instalações elétricas, hidráulicas, climatização e montagens técnicas.',
    clauseText: 'A CONTRATADA concede garantia estendida de 01 (um) ano sobre a perfeita execução da mão de obra deste serviço, a contar da data de conclusão dos trabalhos. A garantia cobre eventuais defeitos de montagem ou fixação, ficando excluídos danos causados por mau uso, intervenção de terceiros, sobretensão na rede elétrica ou desgastes naturais.'
  },
  {
    id: 'preset-garantia-legal-90dias',
    category: 'servico',
    title: 'Garantia Legal CDC (90 Dias)',
    description: 'Padrão legal previsto no Art. 26 do Código de Defesa do Consumidor.',
    clauseText: 'Os serviços executados contam com garantia legal de 90 (noventa) dias para vícios aparentes ou de fácil constatação, nos termos do Art. 26, II do Código de Defesa do Consumidor, mediante conferência técnica no local.'
  },
  {
    id: 'preset-ar-condicionado-infra',
    category: 'servico',
    title: 'Climatização: Infraestrutura e Ponto Elétrico',
    description: 'Cláusula específica para instalação ou higienização de ar-condicionado split.',
    clauseText: 'A CONTRATANTE é responsável por disponibilizar no local o ponto de força exclusivo em 220V devidamente dimensionado, ponto de dreno funcional e livre acesso para posicionamento da condensadora. A CONTRATADA executará vácuo com vacuômetro digital inferior a 500 microns e teste de estanqueidade com nitrogênio, assegurando rendimento e preservação da garantia do fabricante.'
  },
  {
    id: 'preset-eletrica-nbr5410',
    category: 'servico',
    title: 'Elétrica: Conformidade NBR 5410 e Segurança',
    description: 'Garante observância às normas da ABNT e desligamentos programados.',
    clauseText: 'Os serviços elétricos serão executados em estrita observância à norma ABNT NBR 5410 (Instalações Elétricas em Baixa Tensão). Eventuais desligamentos do quadro geral serão previamente alinhados com a CONTRATANTE. A CONTRATADA não se responsabiliza por circuitos antigos, fiações corroídas preexistentes ou sobrecargas decorrentes de aparelhos não declarados.'
  },
  {
    id: 'preset-pintura-acabamento',
    category: 'servico',
    title: 'Pintura: Preparação, Cura e Proteção',
    description: 'Cláusula para serviços de pintura interna, externa e emassamento.',
    clauseText: 'A CONTRATANTE providenciará o afastamento prévio de móveis e objetos frágeis das paredes. O escopo compreende o lixamento superficial, aplicação de fundo preparador/selador e demãos de acabamento. A CONTRATADA não se responsabiliza por trincas estruturais do imóvel ou umidades ascendentes preexistentes no reboco.'
  },
  {
    id: 'preset-produto-reserva-dominio',
    category: 'produto',
    title: 'Fornecimento com Reserva de Domínio',
    description: 'Garante a propriedade das peças e equipamentos até a quitação integral.',
    clauseText: 'Os materiais e equipamentos discriminados são fornecidos com cláusula expressa de Reserva de Domínio (Art. 521 do Código Civil), permanecendo a propriedade resolúvel em favor da CONTRATADA até a liquidação integral dos valores pactuados, cabendo à CONTRATANTE o encargo de depositária fiel.'
  },
  {
    id: 'preset-produto-garantia-fabricante',
    category: 'produto',
    title: 'Garantia de Fábrica e Assistência Técnica',
    description: 'Diferencia a garantia do produto da garantia de montagem.',
    clauseText: 'Os produtos e peças fornecidos contam com garantia de fábrica pelo prazo estipulado pelo fabricante (conforme manual/certificado de garantia). Defeitos intrínsecos de fabricação serão cobertos pelas redes de assistência técnica autorizada da marca, mediante apresentação da nota fiscal correspondente.'
  },
  {
    id: 'preset-acesso-horarios',
    category: 'geral',
    title: 'Condições de Acesso e Horários de Trabalho',
    description: 'Evita paralisações por regras de condomínio ou falta de autorização.',
    clauseText: 'A CONTRATANTE obriga-se a franquear livre acesso da equipe da CONTRATADA ao local nos horários acordados, providenciando previamente as autorizações junto à portaria ou administração do condomínio, além do fornecimento ininterrupto de energia elétrica e água necessários à execução dos trabalhos.'
  }
];

/**
 * Gera uma cláusula inteligente padrão para um item com base no seu nome, tipo e descrição
 */
export const generateDefaultItemClause = (
  itemName: string,
  itemType: ItemType,
  description?: string
): string => {
  const lowerName = itemName.toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  const fullText = `${lowerName} ${lowerDesc}`;

  if (itemType === ItemType.PRODUCT) {
    if (fullText.includes('cabo') || fullText.includes('fio') || fullText.includes('disjuntor') || fullText.includes('tubo') || fullText.includes('conexo')) {
      return 'Material normatizado ABNT fornecido novo e em embalagem original. Reserva de domínio assegurada à CONTRATADA até a liquidação financeira total.';
    }
    return 'Garantia legal de 90 dias acrescida do prazo estipulado pelo fabricante. A titularidade do produto fica retida pela CONTRATADA até a quitação integral do contrato.';
  }

  // Serviços
  if (fullText.includes('ar condicionado') || fullText.includes('ar-condicionado') || fullText.includes('split') || fullText.includes('climatiz')) {
    return 'A CONTRATANTE garantirá ponto elétrico 220V e dreno no local. A CONTRATADA fornece 01 (um) ano de garantia sobre a mão de obra de instalação com teste de estanqueidade e vácuo. Exclui-se tubulação prévia de terceiros.';
  }

  if (fullText.includes('elétr') || fullText.includes('tomada') || fullText.includes('disjuntor') || fullText.includes('quadro')) {
    return 'Execução em conformidade com a norma NBR 5410. Garantia técnica de 12 meses sobre as conexões e instalações realizadas. A CONTRATADA não responde por vícios ou fiação obsoleta preexistente.';
  }

  if (fullText.includes('pintura') || fullText.includes('massa') || fullText.includes('emassa') || fullText.includes('verniz')) {
    return 'Serviço de acabamento com garantia de 90 dias. A CONTRATANTE deve garantir ambiente desimpedido e protegido de intempéries durante o tempo de secagem das demãos.';
  }

  if (fullText.includes('hidrául') || fullText.includes('vazamento') || fullText.includes('encanamento') || fullText.includes('esgoto')) {
    return 'Garantia de 90 dias contra vazamentos nas conexões novas executadas pela CONTRATADA. Teste de estanqueidade e pressão realizado perante a CONTRATANTE.';
  }

  if (fullText.includes('cftv') || fullText.includes('câmera') || fullText.includes('alarme') || fullText.includes('rede') || fullText.includes('interfone')) {
    return 'Garantia de 1 ano para a configuração técnica e cabeamento. A CONTRATANTE deve fornecer conexão de internet e roteador com portas liberadas para acesso remoto.';
  }

  // Padrão genérico de alta qualidade jurídica
  return 'Execução técnica com zelo profissional e materiais adequados. Garantia técnica de 90 dias conforme Art. 26 do Código de Defesa do Consumidor contra defeitos de mão de obra.';
};

/**
 * Constrói a lista estruturada de cláusulas por item a partir dos itens do orçamento
 */
export const buildContractItemClauses = (items: QuoteItem[]): ContractItemClause[] => {
  if (!items || items.length === 0) return [];

  return items.map((item, index) => {
    const clauseText = item.contractClause && item.contractClause.trim() !== ''
      ? item.contractClause.trim()
      : generateDefaultItemClause(item.name, item.type, item.description);

    const typeLabel = item.type === ItemType.SERVICE ? 'Serviço' : 'Produto/Material';

    return {
      itemId: item.id || `item-${index + 1}`,
      itemName: item.name,
      itemType: item.type,
      quantity: item.quantity,
      unit: item.unit || 'un',
      clauseTitle: `Item ${index + 1} (${typeLabel}): ${item.name}`,
      clauseText
    };
  });
};

/**
 * Converte número para formato de moeda por extenso simplificado
 */
const formatExtenso = (value: number): string => {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
};

/**
 * Monta o texto completo da Minuta Contratual de forma 100% DINÂMICA,
 * incorporando as cláusulas específicas de cada produto e serviço contratado.
 */
export const generateDynamicContractContent = (params: {
  contractNumber: string;
  quote: Quote;
  provider: ProviderInfo;
  itemClauses: ContractItemClause[];
}): string => {
  const { contractNumber, quote, provider, itemClauses } = params;

  const clientLocation = [
    quote.customerAddress,
    quote.customerCity,
    quote.customerState
  ].filter(Boolean).join(', ') || 'Endereço a ser confirmado';

  // Descrição resumida dos itens para a Cláusula Primeira (Objeto)
  const itemsSummary = quote.items && quote.items.length > 0
    ? quote.items
        .map((item, idx) => {
          const unitStr = item.unit ? ` (${item.unit})` : '';
          const subtotal = (item.price || 0) * (item.quantity || 1);
          return `• Item ${idx + 1}: ${item.name} | Tipo: ${item.type === ItemType.SERVICE ? 'Serviço' : 'Produto'} | Qtd: ${item.quantity}${unitStr} | Subtotal: ${formatCurrency(subtotal)}${item.description ? `\n  Descrição técnica: ${item.description}` : ''}`;
        })
        .join('\n\n')
    : `• Execução dos serviços descritos no Orçamento nº ${quote.number}`;

  // Seção DINÂMICA das Cláusulas Específicas por Produto e Serviço
  const dynamicClausesText = itemClauses && itemClauses.length > 0
    ? itemClauses
        .map((ic, idx) => {
          const typeTag = ic.itemType === ItemType.SERVICE ? '[SERVIÇO]' : '[PRODUTO/MATERIAL]';
          return `2.${idx + 1}. ${typeTag} ${ic.itemName} (Qtd: ${ic.quantity || 1} ${ic.unit || 'un'}):\n${ic.clauseText}`;
        })
        .join('\n\n')
    : '2.1. Todos os serviços e produtos fornecidos deverão obedecer rigorosamente às normas técnicas vigentes e aos prazos estipulados entre as partes, com garantia legal de 90 (noventa) dias sobre defeitos de conformidade.';

  return `INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS E FORNECIMENTO
CONTRATO Nº: ${contractNumber} (VINCULADO AO ORÇAMENTO Nº ${quote.number})

CONTRATADA (PRESTADORA DOS SERVIÇOS / FORNECEDORA):
Razão Social/Nome: ${provider.name || 'Não informado'}
CNPJ/CPF: ${provider.document || 'Não informado'}
Endereço: ${provider.address || 'Não informado'}
Telefone/WhatsApp: ${provider.phone || 'Não informado'}
E-mail: ${provider.email || 'Não informado'}

CONTRATANTE (CLIENTE):
Nome Completo/Razão Social: ${quote.customerName || 'Não informado'}
Telefone/WhatsApp: ${quote.customerPhone || 'Não informado'}
E-mail: ${quote.customerEmail || 'Não informado'}
Endereço do Local de Execução: ${clientLocation}

As partes acima qualificadas têm, entre si, justo e acordado o presente Contrato de Prestação de Serviços, regido pelas cláusulas e condições seguintes:

CLÁUSULA PRIMEIRA - DO OBJETO E DISCRIMINAÇÃO DOS ITENS
1.1. O presente instrumento tem por objeto a prestação de serviços técnicos especializados e o fornecimento dos produtos/materiais devidamente especificados no Orçamento nº ${quote.number}, compreendendo o seguinte escopo:

${itemsSummary}

1.2. Quaisquer alterações, serviços complementares ou acréscimo de materiais não previstos neste instrumento exigirão prévia solicitação por escrito e aprovação de novo orçamento complementar.

CLÁUSULA SEGUNDA - DAS CLÁUSULAS ESPECÍFICAS E CONDIÇÕES TÉCNICAS POR ITEM
Em razão da especificidade de cada item contratado, aplicam-se pontualmente as seguintes condições técnicas, obrigações de infraestrutura e termos de garantia individualizados:

${dynamicClausesText}

CLÁUSULA TERCEIRA - DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO
3.1. Pela execução dos serviços e fornecimento dos itens descritos neste contrato, a CONTRATANTE pagará à CONTRATADA o valor global de ${formatCurrency(quote.total)} (${formatExtenso(quote.total)}).
3.2. As condições de pagamento acordadas são as seguintes:
${quote.notes ? `• ${quote.notes}` : '• Conforme cronograma pactuado entre as partes, via PIX, transferência bancária ou meio oficial acordado.'}

CLÁUSULA QUARTA - DO PRAZO E DA EXECUÇÃO
4.1. A CONTRATADA iniciará os trabalhos após a assinatura deste contrato e confirmação do sinal/condição inicial estipulada na Cláusula Terceira.
4.2. A conclusão dos serviços se dará dentro do prazo estimado pelas partes, ressalvados motivos de força maior, intempéries climáticas severas, falta de insumos de responsabilidade do cliente ou atrasos na liberação de acesso ao local.

CLÁUSULA QUINTA - DAS OBRIGAÇÕES GERAIS DA CONTRATADA
5.1. Executar os serviços em estrita observância às normas técnicas brasileiras, boas práticas profissionais e com zelo, qualidade e segurança.
5.2. Fornecer mão de obra qualificada e equipamentos de proteção adequados para a realização do escopo contratado.
5.3. Reparar, corrigir ou substituir, às suas expensas, no todo ou em parte, serviços em que se verificarem vícios ou defeitos de execução dentro dos prazos de garantia estipulados.

CLÁUSULA SEXTA - DAS OBRIGAÇÕES GERAIS DA CONTRATANTE
6.1. Efetuar o pagamento dos valores acordados nas datas pactuadas na Cláusula Terceira.
6.2. Assegurar livre acesso da equipe técnica da CONTRATADA ao local onde serão executados os serviços, fornecendo, quando necessário, pontos de energia elétrica e água em condições adequadas para a realização dos trabalhos.
6.3. Informar à CONTRATADA qualquer anormalidade ou defeito notado durante ou após a execução.

CLÁUSULA SÉTIMA - DA RESCISÃO E PENALIDADES
7.1. O presente contrato poderá ser rescindido por mútuo acordo entre as partes ou por inadimplemento comprovado de qualquer uma de suas cláusulas.
7.2. Em caso de desistência injustificada por qualquer das partes após o início dos serviços, responderá a parte infratora pelo reembolso dos custos comprovadamente incorridos, acrescido de multa não compensatória de 10% (dez por cento) sobre o saldo remanescente.

CLÁUSULA OITAVA - DA VALIDADE JURÍDICA DAS ASSINATURAS ELETRÔNICAS
8.1. As partes reconhecem expressamente a plena validade, higidez e autenticidade da assinatura eletrônica deste documento por meios digitais (rubrica em tela, endereço IP, registro temporal de data/hora e hash de verificação de integridade), nos termos do Art. 10, § 2º da Medida Provisória nº 2.200-2/2001 e dos Arts. 4º e 5º da Lei Federal nº 14.063/2020, produzindo todos os efeitos legais de documento assinado de próprio punho.

CLÁUSULA NONA - DO FORO
9.1. Para dirimir quaisquer litígios decorrentes da interpretação ou execução deste contrato, as partes elegem o foro da Comarca onde se localiza o imóvel/estabelecimento da prestação dos serviços, com renúncia expressa a qualquer outro.`;
};
