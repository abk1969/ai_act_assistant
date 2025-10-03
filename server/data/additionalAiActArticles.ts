/**
 * Articles additionnels du Règlement EU AI Act (UE) 2024/1689
 * Articles 16-113 pour compléter la base de données
 */

import { CompleteArticle } from './completeAiActDatabase';

export const additionalArticles: CompleteArticle[] = [
  // TITRE III - Suite des obligations
  {
    articleNumber: "Article 16",
    title: "Obligations des fournisseurs de systèmes d'IA à haut risque",
    content: "Les fournisseurs de systèmes d'IA à haut risque: (a) veillent à ce que leurs systèmes d'IA à haut risque soient conformes aux exigences énoncées dans la section 2; (b) disposent d'un système de gestion de la qualité conforme à l'article 17; (c) établissent la documentation technique du système d'IA à haut risque; (d) lorsque le système d'IA à haut risque est sous leur contrôle, conservent les logs générés automatiquement par ce système; (e) veillent à ce que le système d'IA à haut risque fasse l'objet de la procédure d'évaluation de la conformité pertinente; (f) établissent une déclaration UE de conformité; (g) apposent le marquage CE.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Obligations des opérateurs",
    sectionNumber: "Section 3",
    sectionName: "Obligations des fournisseurs et des utilisateurs déployeurs",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Assurer la conformité avec toutes les exigences",
      "Mettre en place un système de gestion de la qualité",
      "Établir la documentation technique",
      "Conserver les logs automatiques",
      "Réaliser l'évaluation de conformité",
      "Établir la déclaration UE de conformité",
      "Apposer le marquage CE"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["obligations fournisseurs", "conformité", "marquage CE", "déclaration", "qualité"],
    relatedArticles: ["Article 17", "Article 43", "Article 48", "Article 49"],
    annexReferences: ["Annexe IV", "Annexe V"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 16"
  },
  {
    articleNumber: "Article 17",
    title: "Système de gestion de la qualité",
    content: "1. Les fournisseurs de systèmes d'IA à haut risque mettent en place un système de gestion de la qualité qui garantit le respect du présent règlement. Ce système est documenté de manière systématique et ordonnée sous la forme de politiques, de procédures et d'instructions écrites, et comprend au moins les aspects suivants: (a) une stratégie en matière de conformité réglementaire; (b) des techniques, procédures et actions systématiques de conception, de contrôle de la conception et de vérification de la conception; (c) des techniques, procédures et actions systématiques d'examen, d'essai et de validation; (d) des spécifications techniques; (e) des systèmes et procédures de gestion des données; (f) un système de gestion des risques; (g) la mise en place, la documentation et la tenue à jour d'un système de surveillance après commercialisation.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Obligations des opérateurs",
    sectionNumber: "Section 3",
    sectionName: "Obligations des fournisseurs et des utilisateurs déployeurs",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Mettre en place un système de gestion de la qualité",
      "Documenter politiques et procédures",
      "Définir une stratégie de conformité réglementaire",
      "Établir des procédures de conception et vérification",
      "Mettre en place des systèmes de gestion des données",
      "Implémenter un système de gestion des risques",
      "Établir la surveillance après commercialisation"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["qualité", "gestion", "conformité", "procédures", "documentation"],
    relatedArticles: ["Article 16", "Article 9", "Article 72"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 17"
  },
  {
    articleNumber: "Article 26",
    title: "Obligations des utilisateurs déployeurs de systèmes d'IA à haut risque",
    content: "1. Les utilisateurs déployeurs de systèmes d'IA à haut risque prennent des mesures techniques et organisationnelles appropriées pour garantir qu'ils utilisent ces systèmes conformément aux instructions d'utilisation qui les accompagnent. 2. Les utilisateurs déployeurs attribuent des ressources humaines et financières suffisantes et veillent à ce que les personnes chargées de la surveillance humaine disposent des compétences, de la formation et de l'autorité nécessaires. 3. Les utilisateurs déployeurs surveillent le fonctionnement du système d'IA à haut risque sur la base de la notice d'utilisation et, le cas échéant, suspendent l'utilisation du système et informent le fournisseur.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Obligations des opérateurs",
    sectionNumber: "Section 3",
    sectionName: "Obligations des fournisseurs et des utilisateurs déployeurs",
    riskCategory: "high",
    applicableTo: ["deployers"],
    obligations: [
      "Utiliser conformément aux instructions",
      "Prendre des mesures techniques et organisationnelles",
      "Attribuer des ressources humaines et financières suffisantes",
      "Former les personnes chargées de la surveillance",
      "Surveiller le fonctionnement du système",
      "Suspendre l'utilisation si nécessaire",
      "Informer le fournisseur des problèmes"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["déployeurs", "utilisation", "surveillance", "formation", "ressources"],
    relatedArticles: ["Article 14", "Article 16", "Article 29"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 26"
  },
  {
    articleNumber: "Article 29",
    title: "Obligations des utilisateurs déployeurs de systèmes d'IA à haut risque qui sont des autorités publiques",
    content: "1. Les utilisateurs déployeurs qui sont des autorités publiques ou des institutions, organes ou organismes de l'Union effectuent une analyse d'impact sur les droits fondamentaux avant de mettre en service un système d'IA à haut risque, à l'exception des systèmes d'IA à haut risque destinés à être utilisés dans le domaine visé à l'annexe III, point 2 (emploi). 2. L'analyse d'impact sur les droits fondamentaux visée au paragraphe 1 comprend: (a) une description du processus de déploiement du système d'IA à haut risque; (b) une description de la période pendant laquelle et de la fréquence à laquelle le système d'IA à haut risque est destiné à être utilisé; (c) les catégories de personnes physiques et de groupes susceptibles d'être affectés; (d) les risques spécifiques de préjudice susceptibles d'avoir une incidence sur les catégories de personnes ou de groupes de personnes.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Obligations des opérateurs",
    sectionNumber: "Section 3",
    sectionName: "Obligations des fournisseurs et des utilisateurs déployeurs",
    riskCategory: "high",
    applicableTo: ["deployers", "public authorities"],
    obligations: [
      "Effectuer une analyse d'impact sur les droits fondamentaux",
      "Décrire le processus de déploiement",
      "Identifier les catégories de personnes affectées",
      "Évaluer les risques spécifiques de préjudice",
      "Documenter l'analyse avant mise en service"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["droits fondamentaux", "analyse d'impact", "autorités publiques", "DPIA"],
    relatedArticles: ["Article 26", "Article 27", "Annexe III"],
    annexReferences: ["Annexe III"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 29"
  },

  // TITRE IV - TRANSPARENCE
  {
    articleNumber: "Article 50",
    title: "Obligations de transparence pour certains systèmes d'IA",
    content: "1. Les fournisseurs veillent à ce que les systèmes d'IA destinés à interagir directement avec des personnes physiques soient conçus et développés de manière à ce que les personnes physiques concernées soient informées qu'elles interagissent avec un système d'IA, sauf si cela est évident compte tenu des circonstances et du contexte d'utilisation. 2. Les fournisseurs de systèmes d'IA, y compris les systèmes d'IA à usage général, qui génèrent du contenu synthétique audio, image, vidéo ou textuel, veillent à ce que les résultats du système d'IA soient marqués dans un format lisible par machine et détectables en tant que générés ou manipulés artificiellement.",
    titleNumber: "TITRE IV",
    titleName: "OBLIGATIONS DE TRANSPARENCE POUR CERTAINS SYSTÈMES D'IA",
    chapterNumber: "Chapitre IV",
    chapterName: "Transparence",
    riskCategory: "limited",
    applicableTo: ["providers"],
    obligations: [
      "Informer les utilisateurs qu'ils interagissent avec une IA",
      "Marquer le contenu synthétique généré",
      "Rendre le marquage détectable par machine",
      "Assurer la transparence des deepfakes",
      "Documenter les capacités de génération"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["transparence", "contenu synthétique", "deepfake", "marquage", "information"],
    relatedArticles: ["Article 52", "Article 53"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 50"
  },
  {
    articleNumber: "Article 52",
    title: "Obligations de transparence pour certains systèmes d'IA",
    content: "1. Les utilisateurs déployeurs d'un système de reconnaissance des émotions ou d'un système de catégorisation biométrique informent les personnes physiques exposées au système du fonctionnement de celui-ci et traitent les données à caractère personnel conformément aux règlements (UE) 2016/679 et (UE) 2018/1725 et à la directive (UE) 2016/680. 2. Les utilisateurs déployeurs d'un système d'IA qui génère ou manipule du contenu image, audio ou vidéo constituant un deepfake divulguent que le contenu a été généré ou manipulé artificiellement.",
    titleNumber: "TITRE IV",
    titleName: "OBLIGATIONS DE TRANSPARENCE POUR CERTAINS SYSTÈMES D'IA",
    chapterNumber: "Chapitre IV",
    chapterName: "Transparence",
    riskCategory: "limited",
    applicableTo: ["deployers"],
    obligations: [
      "Informer sur la reconnaissance des émotions",
      "Informer sur la catégorisation biométrique",
      "Divulguer les deepfakes",
      "Respecter le RGPD",
      "Assurer la transparence envers les personnes exposées"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["reconnaissance émotions", "biométrie", "deepfake", "transparence", "RGPD"],
    relatedArticles: ["Article 50", "Article 5", "RGPD"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 52"
  },

  // TITRE V - MODÈLES IA À USAGE GÉNÉRAL
  {
    articleNumber: "Article 53",
    title: "Obligations pour les fournisseurs de modèles d'IA à usage général",
    content: "1. Les fournisseurs de modèles d'IA à usage général: (a) établissent et tiennent à jour la documentation technique du modèle, y compris son processus de formation et d'essai et les résultats de son évaluation; (b) établissent, tiennent à jour et mettent à disposition des informations et de la documentation destinées aux fournisseurs de systèmes d'IA qui ont l'intention d'intégrer le modèle d'IA à usage général dans leur système d'IA; (c) mettent en place une politique visant à respecter le droit de l'Union en matière de droit d'auteur et de droits voisins.",
    titleNumber: "TITRE V",
    titleName: "MODÈLES D'IA À USAGE GÉNÉRAL",
    chapterNumber: "Chapitre V",
    chapterName: "Modèles à usage général",
    riskCategory: null,
    applicableTo: ["providers", "GPAI providers"],
    obligations: [
      "Établir la documentation technique du modèle",
      "Documenter le processus de formation",
      "Fournir des informations aux intégrateurs",
      "Respecter le droit d'auteur",
      "Maintenir la documentation à jour"
    ],
    effectiveDate: new Date('2025-08-02'),
    keywords: ["modèles à usage général", "GPAI", "documentation", "droit d'auteur", "formation"],
    relatedArticles: ["Article 54", "Article 55"],
    annexReferences: ["Annexe XI"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 53"
  },
  {
    articleNumber: "Article 55",
    title: "Obligations pour les fournisseurs de modèles d'IA à usage général présentant un risque systémique",
    content: "1. En plus des obligations énoncées à l'article 53, les fournisseurs de modèles d'IA à usage général présentant un risque systémique: (a) procèdent à une évaluation des modèles conformément à des protocoles et à des outils normalisés reflétant l'état de l'art; (b) évaluent et atténuent les risques systémiques possibles; (c) assurent un niveau approprié de cybersécurité; (d) signalent au Bureau de l'IA les incidents graves.",
    titleNumber: "TITRE V",
    titleName: "MODÈLES D'IA À USAGE GÉNÉRAL",
    chapterNumber: "Chapitre V",
    chapterName: "Modèles à usage général",
    riskCategory: "high",
    applicableTo: ["providers", "GPAI providers"],
    obligations: [
      "Évaluer le modèle avec protocoles normalisés",
      "Évaluer et atténuer les risques systémiques",
      "Assurer la cybersécurité",
      "Signaler les incidents graves au Bureau de l'IA",
      "Documenter les mesures d'atténuation"
    ],
    effectiveDate: new Date('2025-08-02'),
    keywords: ["risque systémique", "GPAI", "évaluation", "cybersécurité", "incidents"],
    relatedArticles: ["Article 53", "Article 54", "Article 56"],
    annexReferences: ["Annexe XIII"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 55"
  },

  // TITRE XII - SANCTIONS
  {
    articleNumber: "Article 99",
    title: "Sanctions",
    content: "1. Conformément aux conditions énoncées dans le présent article, les États membres établissent les règles relatives aux sanctions, y compris les amendes administratives, applicables aux violations du présent règlement et prennent toutes les mesures nécessaires pour garantir qu'elles sont mises en œuvre de manière appropriée et effective. Les sanctions prévues sont effectives, proportionnées et dissuasives. 2. Les violations suivantes du présent règlement sont passibles d'amendes administratives pouvant aller jusqu'à 35 000 000 EUR ou, si le contrevenant est une entreprise, jusqu'à 7 % du chiffre d'affaires annuel mondial total de l'exercice précédent, le montant le plus élevé étant retenu: (a) violations de l'article 5 (pratiques interdites); (b) non-respect des obligations relatives aux modèles d'IA à usage général. 3. Les violations suivantes sont passibles d'amendes administratives pouvant aller jusqu'à 15 000 000 EUR ou, si le contrevenant est une entreprise, jusqu'à 3 % du chiffre d'affaires annuel mondial total de l'exercice précédent: (a) violations des exigences ou obligations applicables aux systèmes d'IA à haut risque; (b) violations des obligations des organismes notifiés. 4. Les violations suivantes sont passibles d'amendes administratives pouvant aller jusqu'à 7 500 000 EUR ou, si le contrevenant est une entreprise, jusqu'à 1,5 % du chiffre d'affaires annuel mondial total: (a) fourniture d'informations incorrectes, incomplètes ou trompeuses aux autorités compétentes.",
    titleNumber: "TITRE XII",
    titleName: "SANCTIONS",
    chapterNumber: "Chapitre XII",
    chapterName: "Sanctions et application",
    riskCategory: "unacceptable",
    applicableTo: ["all"],
    obligations: [
      "Respecter toutes les dispositions du règlement",
      "Ne pas violer l'Article 5 (pratiques interdites)",
      "Respecter les obligations pour systèmes haut risque",
      "Fournir des informations exactes aux autorités",
      "Coopérer avec les autorités de surveillance"
    ],
    effectiveDate: new Date('2025-02-02'),
    keywords: ["sanctions", "amendes", "violations", "conformité", "pénalités"],
    relatedArticles: ["Article 5", "Article 16", "Article 26", "Article 53"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 99"
  },

  // TITRE VII - GOUVERNANCE
  {
    articleNumber: "Article 70",
    title: "Bureau de l'IA",
    content: "1. Un Bureau de l'IA est institué au sein de la Commission. 2. Le Bureau de l'IA a pour mission de contribuer à la mise en œuvre, au suivi et à la supervision du présent règlement et de ses dispositions d'application, y compris en ce qui concerne les modèles d'IA à usage général, et de faciliter son application harmonisée. 3. Le Bureau de l'IA exerce les tâches suivantes: (a) contribuer au développement d'outils, de méthodologies et de références pour l'évaluation des capacités des modèles d'IA à usage général; (b) contribuer au développement de normes harmonisées; (c) contribuer à la coordination entre les autorités nationales compétentes.",
    titleNumber: "TITRE VII",
    titleName: "GOUVERNANCE",
    chapterNumber: "Chapitre VII",
    chapterName: "Gouvernance européenne",
    riskCategory: null,
    applicableTo: ["all"],
    obligations: [
      "Coopérer avec le Bureau de l'IA",
      "Fournir des informations sur demande",
      "Respecter les orientations du Bureau",
      "Participer aux consultations"
    ],
    effectiveDate: new Date('2024-08-01'),
    keywords: ["Bureau IA", "gouvernance", "supervision", "coordination", "Commission"],
    relatedArticles: ["Article 71", "Article 72", "Article 56"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 70"
  },
  {
    articleNumber: "Article 72",
    title: "Surveillance après commercialisation par les fournisseurs et plan de surveillance après commercialisation pour les systèmes d'IA à haut risque",
    content: "1. Les fournisseurs mettent en place et documentent un système de surveillance après commercialisation d'une manière proportionnée à la nature des technologies d'intelligence artificielle et aux risques du système d'IA à haut risque. 2. Le système de surveillance après commercialisation collecte, documente et analyse activement les données pertinentes fournies par les utilisateurs déployeurs ou collectées par d'autres sources sur la performance des systèmes d'IA à haut risque tout au long de leur durée de vie, et permet au fournisseur d'évaluer la conformité continue des systèmes d'IA à haut risque aux exigences énoncées dans le titre III, chapitre 2.",
    titleNumber: "TITRE VII",
    titleName: "GOUVERNANCE",
    chapterNumber: "Chapitre VII",
    chapterName: "Surveillance du marché",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Mettre en place un système de surveillance après commercialisation",
      "Documenter le système de surveillance",
      "Collecter et analyser les données de performance",
      "Évaluer la conformité continue",
      "Maintenir le système pendant toute la durée de vie"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["surveillance", "post-market", "monitoring", "performance", "conformité continue"],
    relatedArticles: ["Article 17", "Article 9", "Article 61"],
    annexReferences: ["Annexe VIII"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 72"
  }
];

