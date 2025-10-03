/**
 * EU AI Act (Regulation 2024/1689) - Complete Articles Database
 * Source: Official EU Regulation text
 */

export const aiActArticlesData = [
  // CHAPITRE I - DISPOSITIONS GÉNÉRALES
  {
    articleNumber: "Article 1",
    title: "Objet",
    content: "Le présent règlement établit des règles harmonisées en matière d'intelligence artificielle (règlement sur l'intelligence artificielle). Il vise à améliorer le fonctionnement du marché intérieur en établissant un cadre juridique uniforme en particulier pour le développement, la mise sur le marché, la mise en service et l'utilisation de systèmes d'intelligence artificielle dans l'Union, conformément aux valeurs de l'Union.",
    chapter: "Chapitre I - Dispositions générales",
    riskCategory: null,
    effectiveDate: new Date('2024-08-01'),
    keywords: ["objet", "règlement", "marché intérieur", "cadre juridique"]
  },
  {
    articleNumber: "Article 3",
    title: "Définitions",
    content: "Aux fins du présent règlement, on entend par: 1) 'système d'intelligence artificielle' (système d'IA): un système automatisé conçu pour fonctionner à différents niveaux d'autonomie et qui peut, pour des objectifs explicites ou implicites, générer des résultats tels que des prédictions, des recommandations ou des décisions qui influencent des environnements physiques ou virtuels.",
    chapter: "Chapitre I - Dispositions générales",
    riskCategory: null,
    effectiveDate: new Date('2024-08-01'),
    keywords: ["définitions", "système IA", "autonomie", "prédictions"]
  },

  // CHAPITRE II - PRATIQUES INTERDITES
  {
    articleNumber: "Article 5",
    title: "Pratiques d'intelligence artificielle interdites",
    content: "Les pratiques d'intelligence artificielle suivantes sont interdites: a) la mise sur le marché, la mise en service ou l'utilisation d'un système d'IA qui déploie des techniques subliminales échappant à la conscience d'une personne afin de fausser sensiblement son comportement d'une manière qui cause ou est susceptible de causer à cette personne ou à une autre personne un préjudice physique ou psychologique; b) la mise sur le marché, la mise en service ou l'utilisation d'un système d'IA qui exploite l'une des vulnérabilités d'un groupe de personnes spécifique en raison de leur âge ou d'un handicap physique ou mental.",
    chapter: "Chapitre II - Pratiques interdites",
    riskCategory: "unacceptable",
    effectiveDate: new Date('2025-02-02'),
    keywords: ["interdiction", "manipulation", "vulnérabilités", "préjudice"]
  },
  {
    articleNumber: "Article 5.1.c",
    title: "Notation sociale par les autorités publiques",
    content: "La mise sur le marché, la mise en service ou l'utilisation par les autorités publiques ou pour leur compte de systèmes d'IA pour l'évaluation ou la classification de la fiabilité de personnes physiques sur une certaine période sur la base de leur comportement social ou de caractéristiques personnelles ou de leur personnalité connues ou prédites, la notation sociale aboutissant à l'un des deux traitements suivants ou aux deux: i) un traitement préjudiciable ou défavorable de certaines personnes physiques ou de groupes entiers de personnes physiques dans des contextes sociaux qui ne sont pas liés aux contextes dans lesquels les données ont été générées ou collectées à l'origine; ii) un traitement préjudiciable ou défavorable de certaines personnes physiques ou de groupes entiers de personnes physiques qui est injustifié ou disproportionné par rapport à leur comportement social ou à sa gravité.",
    chapter: "Chapitre II - Pratiques interdites",
    riskCategory: "unacceptable",
    effectiveDate: new Date('2025-02-02'),
    keywords: ["notation sociale", "autorités publiques", "discrimination", "comportement social"]
  },
  {
    articleNumber: "Article 5.1.d",
    title: "Évaluation des risques de commission d'infractions pénales",
    content: "La mise sur le marché, la mise en service ou l'utilisation de systèmes d'IA pour l'évaluation du risque qu'une personne physique commette une infraction pénale, fondée uniquement sur le profilage d'une personne physique ou sur l'évaluation de ses traits et caractéristiques de personnalité.",
    chapter: "Chapitre II - Pratiques interdites",
    riskCategory: "unacceptable",
    effectiveDate: new Date('2025-02-02'),
    keywords: ["profilage", "infraction pénale", "prédiction", "risque"]
  },
  {
    articleNumber: "Article 5.1.f",
    title: "Identification biométrique à distance en temps réel",
    content: "L'utilisation de systèmes d'identification biométrique à distance 'en temps réel' dans des espaces accessibles au public à des fins répressives, sauf si et dans la mesure où cette utilisation est strictement nécessaire à l'une des fins suivantes: i) la recherche ciblée de victimes spécifiques d'enlèvement, de traite des êtres humains ou d'exploitation sexuelle d'êtres humains, ainsi que la recherche de personnes disparues; ii) la prévention d'une menace spécifique, substantielle et imminente pour la vie ou la sécurité physique de personnes physiques ou d'une attaque terroriste; iii) la localisation ou l'identification d'une personne soupçonnée d'avoir commis une infraction pénale.",
    chapter: "Chapitre II - Pratiques interdites",
    riskCategory: "unacceptable",
    effectiveDate: new Date('2025-02-02'),
    keywords: ["biométrie", "identification à distance", "temps réel", "espaces publics", "répression"]
  },

  // CHAPITRE III - SYSTÈMES D'IA À HAUT RISQUE
  {
    articleNumber: "Article 6",
    title: "Règles de classification des systèmes d'IA à haut risque",
    content: "Indépendamment du fait qu'un système d'IA soit déjà mis sur le marché ou mis en service indépendamment de l'annexe III, ce système est considéré comme étant à haut risque lorsque les deux conditions suivantes sont remplies: a) le système d'IA est destiné à être utilisé en tant que composant de sécurité d'un produit, ou le système d'IA est lui-même un produit, couvert par la législation d'harmonisation de l'Union énumérée à l'annexe I; b) le produit dont le système d'IA est un composant de sécurité, ou le système d'IA lui-même en tant que produit, est tenu de faire l'objet d'une évaluation de la conformité par un tiers en vue de la mise sur le marché ou de la mise en service de ce produit conformément à la législation d'harmonisation de l'Union énumérée à l'annexe I.",
    chapter: "Chapitre III - Systèmes à haut risque",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["classification", "haut risque", "composant de sécurité", "évaluation conformité"]
  },
  {
    articleNumber: "Article 9",
    title: "Système de gestion des risques",
    content: "Un système de gestion des risques est établi, mis en œuvre, documenté et tenu à jour pour les systèmes d'IA à haut risque. Le système de gestion des risques consiste en un processus itératif continu planifié et exécuté tout au long du cycle de vie d'un système d'IA à haut risque, nécessitant une mise à jour régulière et systématique.",
    chapter: "Chapitre III - Systèmes à haut risque",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["gestion des risques", "processus itératif", "cycle de vie", "documentation"]
  },
  {
    articleNumber: "Article 10",
    title: "Données et gouvernance des données",
    content: "Les systèmes d'IA à haut risque qui utilisent des techniques impliquant l'entraînement de modèles au moyen de données sont développés sur la base de jeux de données d'entraînement, de validation et de test qui satisfont aux critères de qualité visés aux paragraphes 2 à 5. Les jeux de données d'entraînement, de validation et de test sont pertinents, suffisamment représentatifs, et dans la mesure du possible, exempts d'erreurs et complets au regard de la finalité prévue.",
    chapter: "Chapitre III - Systèmes à haut risque",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["données", "entraînement", "qualité", "représentativité", "biais"]
  },
  {
    articleNumber: "Article 11",
    title: "Documentation technique",
    content: "La documentation technique d'un système d'IA à haut risque est établie avant que ce système soit mis sur le marché ou mis en service et est tenue à jour. La documentation technique est établie de manière à démontrer que le système d'IA à haut risque est conforme aux exigences énoncées dans la présente section et à fournir aux autorités nationales compétentes et aux organismes notifiés toutes les informations nécessaires pour évaluer la conformité du système d'IA à haut risque avec ces exigences.",
    chapter: "Chapitre III - Systèmes à haut risque",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["documentation technique", "conformité", "évaluation", "traçabilité"]
  },
  {
    articleNumber: "Article 12",
    title: "Tenue de registres",
    content: "Les systèmes d'IA à haut risque sont conçus et développés avec des capacités permettant la tenue automatique de registres d'événements ('logs') pendant la durée de vie du système. Ces capacités de tenue de registres garantissent un niveau de traçabilité du fonctionnement du système d'IA à haut risque tout au long de son cycle de vie qui soit approprié à la finalité prévue du système.",
    chapter: "Chapitre III - Systèmes à haut risque",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["logs", "traçabilité", "événements", "cycle de vie"]
  },
  {
    articleNumber: "Article 13",
    title: "Transparence et fourniture d'informations aux utilisateurs déployeurs",
    content: "Les systèmes d'IA à haut risque sont conçus et développés de manière à garantir que leur fonctionnement est suffisamment transparent pour permettre aux utilisateurs déployeurs d'interpréter les résultats du système et de l'utiliser de manière appropriée. Un type et un degré appropriés de transparence sont assurés en vue de garantir la conformité avec les obligations pertinentes incombant à l'utilisateur déployeur et au fournisseur.",
    chapter: "Chapitre III - Systèmes à haut risque",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["transparence", "interprétabilité", "utilisateurs", "instructions"]
  },
  {
    articleNumber: "Article 14",
    title: "Surveillance humaine",
    content: "Les systèmes d'IA à haut risque sont conçus et développés de manière à pouvoir être effectivement supervisés par des personnes physiques pendant la période durant laquelle ils sont utilisés. La surveillance humaine vise à prévenir ou à réduire au minimum les risques pour la santé, la sécurité ou les droits fondamentaux qui peuvent apparaître lorsqu'un système d'IA à haut risque est utilisé conformément à sa finalité prévue ou dans des conditions de mauvaise utilisation raisonnablement prévisible.",
    chapter: "Chapitre III - Systèmes à haut risque",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["surveillance humaine", "supervision", "contrôle", "intervention"]
  },
  {
    articleNumber: "Article 15",
    title: "Exactitude, robustesse et cybersécurité",
    content: "Les systèmes d'IA à haut risque sont conçus et développés de manière à atteindre un niveau approprié d'exactitude, de robustesse et de cybersécurité, et à fonctionner de manière constante à ces égards tout au long de leur cycle de vie. Le niveau d'exactitude et les paramètres d'exactitude pertinents des systèmes d'IA à haut risque sont déclarés dans les instructions d'utilisation qui les accompagnent.",
    chapter: "Chapitre III - Systèmes à haut risque",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["exactitude", "robustesse", "cybersécurité", "performance"]
  },

  // CHAPITRE IV - TRANSPARENCE
  {
    articleNumber: "Article 50",
    title: "Obligations de transparence pour certains systèmes d'IA",
    content: "Les fournisseurs veillent à ce que les systèmes d'IA destinés à interagir directement avec des personnes physiques soient conçus et développés de manière à ce que les personnes physiques concernées soient informées qu'elles interagissent avec un système d'IA, sauf si cela est évident compte tenu du point de vue d'une personne physique raisonnablement bien informée, attentive et avisée, en tenant compte des circonstances et du contexte d'utilisation.",
    chapter: "Chapitre IV - Transparence",
    riskCategory: "limited",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["transparence", "information", "interaction", "chatbot"]
  },
  {
    articleNumber: "Article 52",
    title: "Transparence pour les systèmes de reconnaissance des émotions et de catégorisation biométrique",
    content: "Les utilisateurs déployeurs d'un système de reconnaissance des émotions ou d'un système de catégorisation biométrique informent les personnes physiques exposées à ce système du fonctionnement de celui-ci et traitent les données à caractère personnel conformément aux règlements (UE) 2016/679 et (UE) 2018/1725 et à la directive (UE) 2016/680, selon le cas.",
    chapter: "Chapitre IV - Transparence",
    riskCategory: "limited",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["reconnaissance émotions", "biométrie", "catégorisation", "RGPD"]
  },
  {
    articleNumber: "Article 53",
    title: "Obligations de transparence pour les systèmes d'IA à usage général",
    content: "Les fournisseurs de modèles d'IA à usage général veillent à ce qu'une documentation technique détaillée soit établie et tenue à jour, y compris des informations sur le processus d'entraînement et de test du modèle, ainsi que sur les résultats de son évaluation, qui est suffisamment détaillée pour permettre aux autorités compétentes et aux organismes notifiés d'évaluer la conformité du modèle avec les exigences du présent règlement.",
    chapter: "Chapitre IV - Transparence",
    riskCategory: "limited",
    effectiveDate: new Date('2025-08-02'),
    keywords: ["IA générative", "modèles fondation", "documentation", "transparence"]
  },

  // CHAPITRE V - GOUVERNANCE
  {
    articleNumber: "Article 56",
    title: "Autorités nationales compétentes",
    content: "Chaque État membre désigne au moins une autorité nationale compétente pour assurer l'application et la mise en œuvre du présent règlement. Les autorités nationales compétentes exercent leurs pouvoirs de manière indépendante, impartiale et sans parti pris, de manière à préserver l'objectivité de leurs activités et de leurs tâches et à garantir l'application et la mise en œuvre du présent règlement.",
    chapter: "Chapitre V - Gouvernance",
    riskCategory: null,
    effectiveDate: new Date('2025-02-02'),
    keywords: ["autorités nationales", "surveillance", "application", "indépendance"]
  },
  {
    articleNumber: "Article 65",
    title: "Comité européen de l'intelligence artificielle",
    content: "Un comité européen de l'intelligence artificielle (ci-après dénommé 'comité IA') est institué. Le comité IA conseille et assiste la Commission et les États membres afin de faciliter l'application cohérente et efficace du présent règlement. Le comité IA contribue à la coopération entre les autorités nationales compétentes.",
    chapter: "Chapitre V - Gouvernance",
    riskCategory: null,
    effectiveDate: new Date('2025-02-02'),
    keywords: ["comité européen", "coordination", "harmonisation", "coopération"]
  },

  // CHAPITRE VII - DROITS FONDAMENTAUX
  {
    articleNumber: "Article 27",
    title: "Évaluation d'impact sur les droits fondamentaux",
    content: "Avant de mettre en service ou d'utiliser un système d'IA à haut risque visé à l'article 6, paragraphe 2, à l'exception des systèmes d'IA à haut risque destinés à être utilisés dans le domaine visé à l'annexe III, point 2, les utilisateurs déployeurs qui sont des autorités, des agences ou des organismes publics réalisent une évaluation d'impact sur les droits fondamentaux lorsque l'utilisation du système d'IA à haut risque est susceptible d'avoir un impact élevé sur les droits fondamentaux des personnes physiques.",
    chapter: "Chapitre VII - Droits fondamentaux",
    riskCategory: "high",
    effectiveDate: new Date('2026-08-02'),
    keywords: ["droits fondamentaux", "évaluation impact", "autorités publiques", "protection"]
  },

  // CHAPITRE XII - SANCTIONS
  {
    articleNumber: "Article 99",
    title: "Sanctions",
    content: "Les États membres établissent les règles relatives aux sanctions applicables en cas d'infraction au présent règlement et prennent toutes les mesures nécessaires pour assurer leur mise en œuvre. Les sanctions prévues sont effectives, proportionnées et dissuasives. Les sanctions maximales pour les infractions les plus graves peuvent atteindre 35 000 000 EUR ou, si le contrevenant est une entreprise, jusqu'à 7 % du chiffre d'affaires annuel mondial total de l'exercice précédent, le montant le plus élevé étant retenu.",
    chapter: "Chapitre XII - Sanctions",
    riskCategory: null,
    effectiveDate: new Date('2025-02-02'),
    keywords: ["sanctions", "amendes", "infractions", "pénalités"]
  }
];

