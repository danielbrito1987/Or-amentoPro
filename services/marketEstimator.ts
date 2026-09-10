import { PriceSuggestion } from '../types';

export function normalizeUnit(rawUnit?: string): string {
  if (!rawUnit) return 'un';
  let clean = rawUnit.toLowerCase().trim();
  // Remove números e espaços no início (ex: "3 un" -> "un", "4 pontos" -> "ponto", "10 m²" -> "m²")
  clean = clean.replace(/^\d+\s*/, '').trim();

  if (clean.startsWith('unid') || clean === 'un' || clean === 'unidades' || clean === 'peça' || clean === 'peca') {
    return 'un';
  }
  if (clean.startsWith('ponto')) {
    return 'ponto';
  }
  if (clean === 'm2' || clean === 'm²' || clean.includes('metro quadrado')) {
    return 'm²';
  }
  if (clean === 'm' || clean.includes('metro linear') || clean === 'metro') {
    return 'm';
  }
  if (clean.includes('serviço') || clean.includes('servico')) {
    return 'serviço';
  }
  if (clean.includes('diária') || clean.includes('diaria')) {
    return 'diária';
  }
  if (clean.includes('hora') || clean === 'h' || clean === 'hrs') {
    return 'hora';
  }
  if (clean === 'kg' || clean.includes('quilo')) {
    return 'kg';
  }
  return clean || 'un';
}

function parseQuantity(text: string): number {
  const words: Record<string, number> = {
    um: 1,
    uma: 1,
    dois: 2,
    duas: 2,
    tres: 3,
    três: 3,
    quatro: 4,
    cinco: 5,
    seis: 6,
    sete: 7,
    oito: 8,
    nove: 9,
    dez: 10,
  };

  const numMatch = text.match(/\b(\d+)\s*(unidades|un|pontos|ventiladores|chuveiros|portas|luminárias|luminarias|ar|tomadas|torneiras|cômodos|comodos|quartos)?\b/i);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 1 && n <= 100) return n;
  }

  for (const [w, val] of Object.entries(words)) {
    const regex = new RegExp(`\\b${w}\\b`, 'i');
    if (regex.test(text)) {
      return val;
    }
  }

  return 1;
}

export function calculateMarketBaseline(
  serviceDescription: string,
  cityOrRegion?: string,
  additionalDetails?: string
): PriceSuggestion {
  const fullText = `${serviceDescription} ${additionalDetails || ''}`.toLowerCase();
  const city = (cityOrRegion || '').toLowerCase();
  const quantity = parseQuantity(fullText);

  // Multiplicador regional de custo de vida e mão de obra no Brasil
  let regionalMultiplier = 1.0;
  if (
    city.includes('são paulo') ||
    city.includes('sao paulo') ||
    city.includes('sp') ||
    city.includes('rio de janeiro') ||
    city.includes('rj') ||
    city.includes('brasília') ||
    city.includes('brasilia') ||
    city.includes('df')
  ) {
    regionalMultiplier = 1.25;
  } else if (
    city.includes('curitiba') ||
    city.includes('florianópolis') ||
    city.includes('florianopolis') ||
    city.includes('porto alegre') ||
    city.includes('belo horizonte') ||
    city.includes('campinas') ||
    city.includes('santos')
  ) {
    regionalMultiplier = 1.15;
  } else if (
    city.includes('salvador') ||
    city.includes('recife') ||
    city.includes('fortaleza') ||
    city.includes('goiânia') ||
    city.includes('goiania') ||
    city.includes('manaus')
  ) {
    regionalMultiplier = 1.05;
  }

  // Identificação da categoria do serviço e tabela de referência
  let basePrice = 160;
  let minBase = 120;
  let maxBase = 220;
  let unit = 'un';
  let estimatedHours = quantity > 1 ? `${quantity * 1} a ${quantity * 1.8} horas` : '1 a 2 horas';
  let formattedName = serviceDescription.trim();
  let justification = 'Estimativa baseada na média praticada por prestadores autônomos para mão de obra qualificada no mercado brasileiro.';
  let tips = [
    'Verifique previamente se o cliente já possui todos os materiais necessários ou se estes deverão ser faturados à parte.',
    'Em caso de deslocamento superior a 15 km, acrescente uma taxa de visita ou transporte.',
  ];

  // 1. VENTILADOR DE TETO
  if (fullText.includes('ventilador')) {
    formattedName = quantity > 1 ? `Instalação de ${quantity} ventiladores de teto` : 'Instalação de ventilador de teto';
    const singlePrice = 180;
    const singleMin = 130;
    const singleMax = 250;
    
    // Desconto progressivo por quantidade no mesmo local (ex: 1º por 180, demais por 140)
    basePrice = quantity === 1 ? singlePrice : singlePrice + (quantity - 1) * 145;
    minBase = quantity === 1 ? singleMin : singleMin + (quantity - 1) * 110;
    maxBase = quantity === 1 ? singleMax : singleMax + (quantity - 1) * 190;
    unit = 'un';
    estimatedHours = quantity === 1 ? '1.5 a 2.5 horas' : `${Math.round(quantity * 1.2)} a ${Math.round(quantity * 1.8)} horas`;
    justification = quantity > 1 
      ? `Valor calculado para instalação de ${quantity} aparelhos no mesmo endereço, incluindo desconto por volume. Inclui fixação reforçada, montagem das pás, ligação elétrica e testes.`
      : 'Montagem e fixação em teto com balanceamento de pás e passagem de fiação para comando de parede ou controle remoto.';
    tips = [
      'Verifique se as caixas de luz no teto possuem suporte de ferro ou se será necessária fixação reforçada na laje.',
      'Faça o balanceamento das pás de cada ventilador individualmente para evitar ruídos e oscilações.',
      'Combine se o cliente já comprou os ventiladores com suporte e fiação inclusos.',
    ];
  }

  // 2. CHUVEIRO / DUCHA ELÉTRICA
  else if (fullText.includes('chuveiro') || fullText.includes('ducha')) {
    formattedName = quantity > 1 ? `Instalação/Troca de ${quantity} chuveiros elétricos` : 'Instalação de chuveiro elétrico';
    const singlePrice = 150;
    basePrice = quantity === 1 ? singlePrice : singlePrice + (quantity - 1) * 110;
    minBase = quantity === 1 ? 110 : 110 + (quantity - 1) * 85;
    maxBase = quantity === 1 ? 200 : 200 + (quantity - 1) * 150;
    unit = 'un';
    estimatedHours = quantity === 1 ? '1 hora' : `${quantity * 0.8} a ${quantity * 1.2} horas`;
    justification = 'Instalação com vedação veda-rosca, conector cerâmico/Wago, conferência da fiação e teste de vazamento e aquecimento.';
    tips = [
      'Ligue a água fria primeiro até encher a câmara do chuveiro antes de religar a chave de energia.',
      'Verifique se o disjuntor e a bitola do fio são compatíveis com a potência (ex: 5500W a 7500W).',
    ];
  }

  // 3. TOMADAS E INTERRUPTORES
  else if (fullText.includes('tomada') || fullText.includes('interruptor')) {
    formattedName = quantity > 1 ? `Instalação/Troca de ${quantity} tomadas/interruptores` : 'Instalação de tomada ou interruptor';
    const singlePrice = 55;
    basePrice = quantity === 1 ? singlePrice : Math.max(90, quantity * 40);
    minBase = quantity === 1 ? 40 : Math.max(70, quantity * 30);
    maxBase = quantity === 1 ? 80 : Math.max(120, quantity * 60);
    unit = 'ponto';
    estimatedHours = `${Math.ceil(quantity * 0.5)} a ${Math.ceil(quantity * 0.8)} horas`;
    justification = 'Instalação com reaperto seguro de bornes, teste de polaridade (fase, neutro e terra) e alinhamento do espelho.';
    tips = [
      'Em instalações com vários pontos no mesmo local, vale a pena praticar valor fechado por pacote.',
    ];
  }

  // 4. QUADRO DE DISJUNTORES
  else if (fullText.includes('disjuntor') || fullText.includes('quadro') || fullText.includes('qdc')) {
    formattedName = 'Revisão e substituição em quadro de distribuição (QDC)';
    basePrice = 360;
    minBase = 260;
    maxBase = 560;
    unit = 'serviço';
    estimatedHours = '2 a 4 horas';
    justification = 'Serviço de alta responsabilidade técnica com equilíbrio de fases e aperto de barramentos.';
    tips = [
      'Identifique e etiquete todos os circuitos no quadro para segurança e conveniência do cliente.',
    ];
  }

  // 5. LUMINÁRIAS E ILUMINAÇÃO
  else if (fullText.includes('luminária') || fullText.includes('luminaria') || fullText.includes('lustre') || fullText.includes('pendente') || fullText.includes('led')) {
    formattedName = quantity > 1 ? `Instalação de ${quantity} luminárias/pendentes` : 'Instalação de luminária/lustre';
    const singlePrice = 110;
    basePrice = quantity === 1 ? singlePrice : singlePrice + (quantity - 1) * 80;
    minBase = quantity === 1 ? 80 : 80 + (quantity - 1) * 60;
    maxBase = quantity === 1 ? 180 : 180 + (quantity - 1) * 120;
    unit = 'un';
    estimatedHours = `${Math.ceil(quantity * 1)} a ${Math.ceil(quantity * 1.5)} horas`;
    justification = 'Fixação com furação precisa, nivelamento estético e isolamento elétrico.';
    tips = ['Verifique se o teto é de gesso acartonado para usar buchas específicas de drywall tipo fly ou basculante.'];
  }

  // 6. TORNEIRA / SIFÃO / HIDRÁULICA LEVE
  else if (fullText.includes('torneira') || fullText.includes('sifão') || fullText.includes('sifao')) {
    formattedName = quantity > 1 ? `Substituição de ${quantity} torneiras/sifões` : 'Troca e instalação de torneira/sifão';
    const singlePrice = 120;
    basePrice = quantity === 1 ? singlePrice : singlePrice + (quantity - 1) * 85;
    minBase = quantity === 1 ? 85 : 85 + (quantity - 1) * 65;
    maxBase = quantity === 1 ? 170 : 170 + (quantity - 1) * 120;
    unit = 'un';
    estimatedHours = `${quantity * 0.7} a ${quantity * 1.2} horas`;
    justification = 'Aplicação de fita veda-rosca, alinhamento de engates flexíveis e verificação de estanqueidade.';
    tips = ['Confira a pressão da rede de água e substitua os anéis de borracha para evitar infiltrações futuras.'];
  }

  // 7. VASO SANITÁRIO E DESCARGA
  else if (fullText.includes('vaso') || fullText.includes('sanitário') || fullText.includes('sanitario') || fullText.includes('caixa acoplada')) {
    formattedName = 'Instalação/Reparo de vaso sanitário com caixa acoplada';
    basePrice = 190;
    minBase = 140;
    maxBase = 270;
    unit = 'un';
    estimatedHours = '1.5 a 2.5 horas';
    justification = 'Fixação com buchas de latão, anel de vedação de cera anti-odor e ajuste dos níveis de bóia da descarga.';
    tips = ['Use sempre um anel de cera novo com guia para evitar retorno de odores do esgoto.'];
  }

  // 8. DESENTUPIMENTO
  else if (fullText.includes('desentupir') || fullText.includes('desentupimento')) {
    formattedName = 'Desentupimento e desobstrução de encanamento';
    basePrice = 240;
    minBase = 160;
    maxBase = 380;
    unit = 'serviço';
    estimatedHours = '1 a 2 horas';
    justification = 'Remoção de obstrução preservando a integridade das tubulações e sifões.';
    tips = ['Esclareça se a obstrução é no ramal do aparelho ou na coluna central do imóvel.'];
  }

  // 9. PINTURA RESIDENCIAL
  else if (fullText.includes('pintura') || fullText.includes('pintar')) {
    if (fullText.includes('porta') || fullText.includes('portão') || fullText.includes('portao') || fullText.includes('grade')) {
      formattedName = quantity > 1 ? `Pintura/Esmaltação de ${quantity} portas/portões` : 'Pintura de porta ou portão';
      basePrice = quantity === 1 ? 180 : quantity * 150;
      minBase = quantity === 1 ? 130 : quantity * 110;
      maxBase = quantity === 1 ? 260 : quantity * 210;
      unit = 'un';
      estimatedHours = `${quantity * 2} a ${quantity * 3.5} horas`;
      justification = 'Lixamento, aplicação de fundo preparador e 2 demãos de esmalte sintético ou verniz com acabamento uniforme.';
      tips = ['Isole batentes, fechaduras e o piso com lona para evitar manchas indesejadas.'];
    } else {
      formattedName = 'Pintura residencial de paredes e tetos';
      basePrice = 25;
      minBase = 18;
      maxBase = 35;
      unit = 'm²';
      estimatedHours = 'Variável conforme metragem quadrada';
      justification = 'Preço médio por metro quadrado incluindo emassamento de trincas, lixamento e 2 demãos de tinta látex acrílica.';
      tips = [
        'Calcule a metragem multiplicando o perímetro das paredes pela altura do pé-direito.',
        'Se as paredes tiverem manchas de umidade ou mofo, aplique solução com fungicida antes de pintar.',
      ];
    }
  }

  // 10. AR-CONDICIONADO
  else if (fullText.includes('ar condicionado') || fullText.includes('ar-condicionado') || fullText.includes('split')) {
    if (fullText.includes('limpeza') || fullText.includes('higienização') || fullText.includes('higienizacao')) {
      formattedName = quantity > 1 ? `Higienização completa de ${quantity} aparelhos de ar-condicionado` : 'Limpeza e higienização de ar-condicionado';
      basePrice = quantity === 1 ? 220 : singlePriceCalculation(220, 170, quantity);
      minBase = quantity === 1 ? 160 : singlePriceCalculation(160, 130, quantity);
      maxBase = quantity === 1 ? 300 : singlePriceCalculation(300, 240, quantity);
      unit = 'un';
      estimatedHours = `${quantity * 1} a ${quantity * 1.8} horas`;
      justification = 'Higienização de turbina, serpentina, filtros e bandeja com bactericida hospitalar e limpeza do dreno.';
      tips = ['Ofereça manutenção preventiva semestral para residências e trimestral para escritórios.'];
    } else {
      formattedName = quantity > 1 ? `Instalação de ${quantity} aparelhos de ar-condicionado split` : 'Instalação de ar-condicionado split';
      basePrice = quantity === 1 ? 580 : singlePriceCalculation(580, 500, quantity);
      minBase = quantity === 1 ? 440 : singlePriceCalculation(440, 390, quantity);
      maxBase = quantity === 1 ? 780 : singlePriceCalculation(780, 680, quantity);
      unit = 'un';
      estimatedHours = `${quantity * 3} a ${quantity * 4.5} horas`;
      justification = 'Fixação de suportes, perfuração, isolamento térmico, vácuo com bomba e teste de pressão na linha frigorígena.';
      tips = ['Verifique se o cliente já contratou ou possui ponto elétrico 220V dedicado e dreno pronto no local.'];
    }
  }

  // 11. MONTAGEM DE MÓVEIS
  else if (fullText.includes('montagem') || fullText.includes('montador') || fullText.includes('móvel') || fullText.includes('movel')) {
    if (fullText.includes('guarda-roupa') || fullText.includes('guarda roupa') || fullText.includes('roupeiro')) {
      formattedName = 'Montagem de guarda-roupa com gavetas e portas';
      basePrice = 280;
      minBase = 200;
      maxBase = 420;
      unit = 'un';
      estimatedHours = '3 a 5 horas';
      justification = 'Montagem estrutural, nivelamento de portas de correr/bater e fixação de corrediças telescópicas.';
      tips = ['Nivele a base do móvel com o piso antes de pregar o fundo traseiro para evitar desquadro.'];
    } else if (fullText.includes('painel') || fullText.includes('suporte') || fullText.includes('tv')) {
      formattedName = 'Instalação de suporte de TV e painel na parede';
      basePrice = 130;
      minBase = 90;
      maxBase = 190;
      unit = 'un';
      estimatedHours = '1 a 1.5 horas';
      justification = 'Furação com buchas para alvenaria ou drywall, uso de nível laser e organização de cabeamento.';
      tips = ['Certifique-se de não haver canalização hidráulica ou elétrica no alinhamento dos furos.'];
    } else {
      formattedName = 'Montagem de móvel convencional';
      basePrice = 150;
      minBase = 100;
      maxBase = 220;
      unit = 'un';
      estimatedHours = '1.5 a 3 horas';
      justification = 'Montagem técnica com regulagem de ferragens e conferência de estabilidade.';
      tips = ['Abra as embalagens sobre mantas ou papelão para preservar o piso do cliente e as quinas do móvel.'];
    }
  }

  // 12. PISO E PORCELANATO
  else if (fullText.includes('piso') || fullText.includes('porcelanato') || fullText.includes('azulejo') || fullText.includes('revestimento')) {
    formattedName = 'Assentamento de piso cerâmico / porcelanato';
    basePrice = 75;
    minBase = 55;
    maxBase = 105;
    unit = 'm²';
    estimatedHours = 'Conforme área quadrada e paginação';
    justification = 'Mão de obra para assentamento com argamassa colante, niveladores de piso e rejuntamento impermeável.';
    tips = ['Para formatos maiores de 80x80cm, utilize dupla colagem (argamassa no chão e na peça).'];
  }

  // 13. PEDREIRO E DIÁRIA
  else if (fullText.includes('pedreiro') || fullText.includes('diária') || fullText.includes('diaria')) {
    formattedName = 'Diária de pedreiro / profissional de reformas';
    basePrice = 280;
    minBase = 220;
    maxBase = 360;
    unit = 'diária';
    estimatedHours = '8 horas / dia';
    justification = 'Jornada diária para profissional qualificado em alvenaria, reboco, reformas e pequenos reparos.';
    tips = ['Estabeleça por escrito a lista de metas e serviços a serem entregues durante o dia.'];
  }

  // 14. LIMPEZA E FAXINA
  else if (fullText.includes('faxina') || fullText.includes('limpeza') || fullText.includes('diarista')) {
    if (fullText.includes('pós-obra') || fullText.includes('pos obra')) {
      formattedName = 'Limpeza pesada pós-obra residencial ou comercial';
      basePrice = 380;
      minBase = 280;
      maxBase = 550;
      unit = 'serviço';
      estimatedHours = '6 a 8 horas';
      justification = 'Remoção de resíduos de argamassa, tinta e pó fino com maquinário e produtos desincrustantes.';
      tips = ['Utilize esponjas não abrasivas para proteger louças vitrificadas e esquadrias de alumínio.'];
    } else {
      formattedName = 'Diária de faxina e higienização residencial';
      basePrice = 200;
      minBase = 160;
      maxBase = 260;
      unit = 'diária';
      estimatedHours = '6 a 8 horas';
      justification = 'Higienização completa de cômodos, pisos, banheiros e bancadas com produtos residenciais.';
      tips = ['Alinhe previamente se haverá tarefas adicionais como passar roupas ou limpar interior de armários.'];
    }
  }

  // Aplica o multiplicador regional e arredonda para números amigáveis
  const finalSuggested = Math.round((basePrice * regionalMultiplier) / 5) * 5;
  const finalMin = Math.round((minBase * regionalMultiplier) / 5) * 5;
  const finalMax = Math.round((maxBase * regionalMultiplier) / 5) * 5;

  // Calcula valor unitário limpo (arredondado para centavos)
  const finalUnitPrice = quantity > 1
    ? Math.round((finalSuggested / quantity) * 100) / 100
    : finalSuggested;

  return {
    serviceName: formattedName,
    suggestedPrice: finalSuggested,
    minPrice: finalMin,
    maxPrice: finalMax,
    unit: normalizeUnit(unit),
    quantity,
    unitPrice: finalUnitPrice,
    estimatedHours,
    justification,
    tips,
  };
}

function singlePriceCalculation(firstUnit: number, additionalUnit: number, qty: number): number {
  if (qty <= 1) return firstUnit;
  return firstUnit + (qty - 1) * additionalUnit;
}
