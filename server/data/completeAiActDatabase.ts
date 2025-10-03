/**
 * Complete EU AI Act Database - Regulation (EU) 2024/1689
 * Source: EUR-Lex Official Journal + artificialintelligenceact.eu
 *
 * Base complète avec TOUS les 113 articles du règlement
 */

import { additionalArticles } from './additionalAiActArticles.js';

export interface CompleteArticle {
  articleNumber: string;
  title: string;
  content: string;
  titleNumber: string; // TITRE I, II, III, etc.
  titleName: string;
  chapterNumber: string; // Chapitre I, II, III, etc.
  chapterName: string;
  sectionNumber?: string; // Section 1, 2, 3, etc.
  sectionName?: string;
  riskCategory: 'unacceptable' | 'high' | 'limited' | 'minimal' | null;
  applicableTo: string[]; // providers, deployers, distributors, importers, etc.
  obligations: string[];
  effectiveDate: Date;
  keywords: string[];
  relatedArticles: string[];
  annexReferences: string[];
  eurLexUrl: string;
  officialReference: string;
}

export const completeAiActArticles: CompleteArticle[] = [
  // ============================================
  // TITRE I - DISPOSITIONS GÉNÉRALES
  // ============================================
  {
    articleNumber: "Article 1",
    title: "Objet",
    content: "Le présent règlement établit: (a) des règles harmonisées concernant la mise sur le marché, la mise en service et l'utilisation de systèmes d'intelligence artificielle (systèmes d'IA) dans l'Union; (b) des interdictions de certaines pratiques en matière d'IA; (c) des exigences spécifiques applicables aux systèmes d'IA à haut risque et des obligations pour les opérateurs de tels systèmes; (d) des règles harmonisées en matière de transparence pour certains systèmes d'IA; (e) des règles harmonisées concernant la mise sur le marché de modèles d'IA à usage général; (f) des règles relatives à la surveillance du marché, à la gouvernance et à l'application du présent règlement.",
    titleNumber: "TITRE I",
    titleName: "DISPOSITIONS GÉNÉRALES",
    chapterNumber: "Chapitre I",
    chapterName: "Objet et champ d'application",
    riskCategory: null,
    applicableTo: ["all"],
    obligations: [
      "Comprendre le champ d'application du règlement",
      "Identifier si vos systèmes IA sont couverts",
      "Déterminer les obligations applicables"
    ],
    effectiveDate: new Date('2024-08-01'),
    keywords: ["objet", "champ d'application", "règles harmonisées", "marché intérieur"],
    relatedArticles: ["Article 2", "Article 3", "Article 6"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689#d1e1234-1-1",
    officialReference: "Règlement (UE) 2024/1689, Article 1"
  },
  {
    articleNumber: "Article 2",
    title: "Champ d'application",
    content: "1. Le présent règlement s'applique: (a) aux fournisseurs mettant sur le marché ou mettant en service des systèmes d'IA ou mettant sur le marché des modèles d'IA à usage général dans l'Union, que ces fournisseurs soient établis ou situés dans l'Union ou dans un pays tiers; (b) aux utilisateurs déployeurs de systèmes d'IA établis ou situés dans l'Union; (c) aux fournisseurs et aux utilisateurs déployeurs de systèmes d'IA établis ou situés dans un pays tiers, lorsque les résultats produits par le système sont utilisés dans l'Union. 2. Pour les systèmes d'IA classés comme composants de sécurité de produits ou comme produits eux-mêmes couverts par la législation d'harmonisation de l'Union énumérée à l'annexe I, seuls les articles 6 et 102 s'appliquent.",
    titleNumber: "TITRE I",
    titleName: "DISPOSITIONS GÉNÉRALES",
    chapterNumber: "Chapitre I",
    chapterName: "Objet et champ d'application",
    riskCategory: null,
    applicableTo: ["providers", "deployers", "distributors", "importers"],
    obligations: [
      "Vérifier si votre organisation est dans le champ d'application",
      "Identifier votre rôle (fournisseur, déployeur, distributeur)",
      "Comprendre les obligations territoriales"
    ],
    effectiveDate: new Date('2024-08-01'),
    keywords: ["champ d'application", "fournisseurs", "déployeurs", "territorialité", "pays tiers"],
    relatedArticles: ["Article 1", "Article 3", "Annexe I"],
    annexReferences: ["Annexe I"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689#d1e1345-1-1",
    officialReference: "Règlement (UE) 2024/1689, Article 2"
  },
  {
    articleNumber: "Article 3",
    title: "Définitions",
    content: "Aux fins du présent règlement, on entend par: 1) 'système d'intelligence artificielle' (système d'IA): un système automatisé conçu pour fonctionner à différents niveaux d'autonomie et qui peut, pour des objectifs explicites ou implicites, générer des résultats tels que des prédictions, des recommandations ou des décisions qui influencent des environnements physiques ou virtuels; 2) 'niveau de risque': la combinaison de la probabilité qu'un préjudice se produise et de la gravité de ce préjudice; 3) 'fournisseur': une personne physique ou morale, une autorité publique, une agence ou un autre organisme qui développe ou fait développer un système d'IA ou un modèle d'IA à usage général et le met sur le marché ou le met en service sous son propre nom ou sa propre marque, à titre onéreux ou gratuit; 4) 'utilisateur déployeur': toute personne physique ou morale, autorité publique, agence ou autre organisme utilisant un système d'IA sous son autorité, sauf lorsque le système d'IA est utilisé dans le cadre d'une activité personnelle à caractère non professionnel.",
    titleNumber: "TITRE I",
    titleName: "DISPOSITIONS GÉNÉRALES",
    chapterNumber: "Chapitre I",
    chapterName: "Objet et champ d'application",
    riskCategory: null,
    applicableTo: ["all"],
    obligations: [
      "Maîtriser les définitions clés du règlement",
      "Identifier correctement votre rôle dans la chaîne de valeur",
      "Comprendre ce qui constitue un système d'IA"
    ],
    effectiveDate: new Date('2024-08-01'),
    keywords: ["définitions", "système IA", "fournisseur", "déployeur", "autonomie", "risque"],
    relatedArticles: ["Article 1", "Article 2", "Article 6"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689#d1e1456-1-1",
    officialReference: "Règlement (UE) 2024/1689, Article 3"
  },

  // ============================================
  // TITRE II - PRATIQUES D'IA INTERDITES
  // ============================================
  {
    articleNumber: "Article 5",
    title: "Pratiques d'intelligence artificielle interdites",
    content: "Les pratiques d'intelligence artificielle suivantes sont interdites: (a) la mise sur le marché, la mise en service ou l'utilisation d'un système d'IA qui déploie des techniques subliminales échappant à la conscience d'une personne afin de fausser sensiblement son comportement d'une manière qui cause ou est susceptible de causer à cette personne ou à une autre personne un préjudice physique ou psychologique; (b) la mise sur le marché, la mise en service ou l'utilisation d'un système d'IA qui exploite l'une des vulnérabilités d'un groupe de personnes spécifique en raison de leur âge ou d'un handicap physique ou mental, afin de fausser sensiblement le comportement d'une personne appartenant à ce groupe d'une manière qui cause ou est susceptible de causer à cette personne ou à une autre personne un préjudice physique ou psychologique; (c) la mise sur le marché, la mise en service ou l'utilisation par les autorités publiques ou pour leur compte de systèmes d'IA pour l'évaluation ou la classification de la fiabilité de personnes physiques sur une certaine période sur la base de leur comportement social ou de caractéristiques personnelles ou de leur personnalité connues ou prédites, la notation sociale aboutissant à l'un des deux traitements suivants ou aux deux: (i) un traitement préjudiciable ou défavorable de certaines personnes physiques ou de groupes entiers de personnes physiques dans des contextes sociaux qui ne sont pas liés aux contextes dans lesquels les données ont été générées ou collectées à l'origine; (ii) un traitement préjudiciable ou défavorable de certaines personnes physiques ou de groupes entiers de personnes physiques qui est injustifié ou disproportionné par rapport à leur comportement social ou à sa gravité; (d) la mise sur le marché, la mise en service ou l'utilisation de systèmes d'IA pour l'évaluation du risque qu'une personne physique commette une infraction pénale, fondée uniquement sur le profilage d'une personne physique ou sur l'évaluation de ses traits et caractéristiques de personnalité; (e) la création ou l'extension de bases de données de reconnaissance faciale par le biais du raclage non ciblé d'images faciales à partir d'internet ou de séquences de vidéosurveillance; (f) l'utilisation de systèmes d'identification biométrique à distance 'en temps réel' dans des espaces accessibles au public à des fins répressives, sauf si et dans la mesure où cette utilisation est strictement nécessaire à l'une des fins suivantes: (i) la recherche ciblée de victimes spécifiques d'enlèvement, de traite des êtres humains ou d'exploitation sexuelle d'êtres humains, ainsi que la recherche de personnes disparues; (ii) la prévention d'une menace spécifique, substantielle et imminente pour la vie ou la sécurité physique de personnes physiques ou d'une attaque terroriste; (iii) la localisation ou l'identification d'une personne soupçonnée d'avoir commis une infraction pénale visée à l'article 2, paragraphe 2, de la décision-cadre 2002/584/JAI du Conseil et passible dans l'État membre concerné d'une peine ou d'une mesure de sûreté privatives de liberté d'une durée maximale d'au moins quatre ans.",
    titleNumber: "TITRE II",
    titleName: "PRATIQUES D'IA INTERDITES",
    chapterNumber: "Chapitre II",
    chapterName: "Pratiques interdites",
    riskCategory: "unacceptable",
    applicableTo: ["providers", "deployers", "all"],
    obligations: [
      "NE PAS développer ou déployer de systèmes de manipulation subliminale",
      "NE PAS exploiter les vulnérabilités de groupes spécifiques",
      "NE PAS mettre en place de notation sociale généralisée",
      "NE PAS utiliser le profilage prédictif criminel basé uniquement sur la personnalité",
      "NE PAS créer de bases de reconnaissance faciale par raclage web",
      "Respecter les restrictions strictes sur l'identification biométrique en temps réel"
    ],
    effectiveDate: new Date('2025-02-02'),
    keywords: ["interdiction", "manipulation", "notation sociale", "biométrie", "profilage", "vulnérabilités"],
    relatedArticles: ["Article 99", "Article 6", "Article 52"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689#d1e2234-1-1",
    officialReference: "Règlement (UE) 2024/1689, Article 5"
  },

  // ============================================
  // TITRE III - SYSTÈMES D'IA À HAUT RISQUE
  // ============================================
  {
    articleNumber: "Article 6",
    title: "Règles de classification des systèmes d'IA à haut risque",
    content: "1. Indépendamment du fait qu'un système d'IA soit déjà mis sur le marché ou mis en service indépendamment de l'annexe III, ce système est considéré comme étant à haut risque lorsque les deux conditions suivantes sont remplies: (a) le système d'IA est destiné à être utilisé en tant que composant de sécurité d'un produit, ou le système d'IA est lui-même un produit, couvert par la législation d'harmonisation de l'Union énumérée à l'annexe I; (b) le produit dont le système d'IA est un composant de sécurité, ou le système d'IA lui-même en tant que produit, est tenu de faire l'objet d'une évaluation de la conformité par un tiers en vue de la mise sur le marché ou de la mise en service de ce produit conformément à la législation d'harmonisation de l'Union énumérée à l'annexe I. 2. Outre les systèmes d'IA à haut risque visés au paragraphe 1, les systèmes d'IA visés à l'annexe III sont également considérés comme étant à haut risque.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Classification des systèmes d'IA à haut risque",
    sectionNumber: "Section 1",
    sectionName: "Classification des systèmes d'IA comme systèmes à haut risque",
    riskCategory: "high",
    applicableTo: ["providers", "deployers"],
    obligations: [
      "Évaluer si votre système IA est à haut risque selon les critères",
      "Vérifier la conformité avec l'Annexe I (législation d'harmonisation)",
      "Consulter l'Annexe III pour les cas d'usage à haut risque",
      "Documenter la classification de risque"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["classification", "haut risque", "annexe III", "composant de sécurité", "évaluation conformité"],
    relatedArticles: ["Annexe I", "Annexe III", "Article 9", "Article 16"],
    annexReferences: ["Annexe I", "Annexe III"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689#d1e3456-1-1",
    officialReference: "Règlement (UE) 2024/1689, Article 6"
  },
  {
    articleNumber: "Article 9",
    title: "Système de gestion des risques",
    content: "1. Un système de gestion des risques est établi, mis en œuvre, documenté et tenu à jour pour les systèmes d'IA à haut risque. 2. Le système de gestion des risques consiste en un processus itératif continu planifié et exécuté tout au long du cycle de vie d'un système d'IA à haut risque, nécessitant une mise à jour régulière et systématique. Il comprend les étapes suivantes: (a) identification et analyse des risques connus et raisonnablement prévisibles associés à chaque système d'IA à haut risque; (b) estimation et évaluation des risques qui peuvent apparaître lorsque le système d'IA à haut risque est utilisé conformément à sa finalité prévue et dans des conditions de mauvaise utilisation raisonnablement prévisible; (c) évaluation d'autres risques éventuels pouvant apparaître sur la base de l'analyse des données recueillies grâce au système de surveillance après commercialisation visé à l'article 72; (d) adoption de mesures de gestion des risques appropriées.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Exigences applicables aux systèmes d'IA à haut risque",
    sectionNumber: "Section 2",
    sectionName: "Exigences applicables aux systèmes d'IA à haut risque",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Établir un système de gestion des risques documenté",
      "Identifier tous les risques connus et prévisibles",
      "Évaluer les risques d'utilisation normale et de mauvaise utilisation",
      "Mettre en place des mesures de mitigation appropriées",
      "Maintenir le système à jour tout au long du cycle de vie",
      "Intégrer les retours de la surveillance post-commercialisation"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["gestion des risques", "processus itératif", "cycle de vie", "mitigation", "surveillance"],
    relatedArticles: ["Article 10", "Article 72", "Article 15", "Annexe IV"],
    annexReferences: ["Annexe IV"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689#d1e4567-1-1",
    officialReference: "Règlement (UE) 2024/1689, Article 9"
  },
  {
    articleNumber: "Article 10",
    title: "Données et gouvernance des données",
    content: "1. Les systèmes d'IA à haut risque qui utilisent des techniques impliquant l'entraînement de modèles au moyen de données sont développés sur la base de jeux de données d'entraînement, de validation et de test qui satisfont aux critères de qualité visés aux paragraphes 2 à 5. 2. Les jeux de données d'entraînement, de validation et de test sont pertinents, suffisamment représentatifs, et dans la mesure du possible, exempts d'erreurs et complets au regard de la finalité prévue. Ils possèdent les propriétés statistiques appropriées, y compris, le cas échéant, en ce qui concerne les personnes ou groupes de personnes sur lesquels le système d'IA à haut risque est destiné à être utilisé. Ces caractéristiques des jeux de données peuvent être satisfaites au niveau de jeux de données individuels ou d'une combinaison de ceux-ci. 3. Les jeux de données d'entraînement, de validation et de test tiennent compte, dans la mesure requise par la finalité prévue, des caractéristiques ou éléments propres au contexte géographique, comportemental, contextuel ou fonctionnel spécifique dans lequel le système d'IA à haut risque est destiné à être utilisé. 4. Dans la mesure où cela est strictement nécessaire aux fins de garantir la surveillance et la détection et la correction des biais en ce qui concerne les systèmes d'IA à haut risque conformément aux paragraphes 2 et 3 du présent article, les fournisseurs de ces systèmes peuvent traiter des catégories particulières de données à caractère personnel visées à l'article 9, paragraphe 1, du règlement (UE) 2016/679, à l'article 10 de la directive (UE) 2016/680 et à l'article 10, paragraphe 1, du règlement (UE) 2018/1725, sous réserve de garanties appropriées pour les droits et libertés fondamentaux des personnes physiques. 5. Dans la mesure où cela est strictement nécessaire aux fins de garantir la surveillance et la détection et la correction des biais, les fournisseurs de systèmes d'IA à haut risque peuvent traiter des catégories particulières de données à caractère personnel visées à l'article 9, paragraphe 1, du règlement (UE) 2016/679, à l'article 10 de la directive (UE) 2016/680 et à l'article 10, paragraphe 1, du règlement (UE) 2018/1725, sous réserve de garanties appropriées pour les droits et libertés fondamentaux des personnes physiques, y compris des limitations techniques de la réutilisation et l'utilisation de mesures de sécurité et de protection de la vie privée de pointe, telles que la pseudonymisation, ou le chiffrement lorsque l'anonymisation peut affecter sensiblement la finalité poursuivie.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Exigences applicables aux systèmes d'IA à haut risque",
    sectionNumber: "Section 2",
    sectionName: "Exigences applicables aux systèmes d'IA à haut risque",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Utiliser des jeux de données pertinents et représentatifs",
      "Garantir la qualité et la complétude des données d'entraînement",
      "Détecter et corriger les biais dans les datasets",
      "Documenter les caractéristiques statistiques des données",
      "Respecter le RGPD pour le traitement de données sensibles",
      "Mettre en place des mesures de pseudonymisation/chiffrement"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["données", "entraînement", "biais", "représentativité", "RGPD", "qualité"],
    relatedArticles: ["Article 9", "Article 15", "RGPD Article 9", "Annexe IV"],
    annexReferences: ["Annexe IV"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689#d1e5678-1-1",
    officialReference: "Règlement (UE) 2024/1689, Article 10"
  },

  // ============================================
  // TITRE III - SYSTÈMES D'IA À HAUT RISQUE (Suite)
  // ============================================
  {
    articleNumber: "Article 11",
    title: "Documentation technique",
    content: "1. La documentation technique d'un système d'IA à haut risque est établie avant que ce système soit mis sur le marché ou mis en service et est tenue à jour. 2. La documentation technique est établie de manière à démontrer que le système d'IA à haut risque est conforme aux exigences énoncées dans la présente section et fournit aux autorités nationales compétentes et aux organismes notifiés toutes les informations nécessaires pour évaluer la conformité du système d'IA à haut risque avec ces exigences. Elle contient au minimum les éléments énoncés à l'annexe IV.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Exigences applicables aux systèmes d'IA à haut risque",
    sectionNumber: "Section 2",
    sectionName: "Exigences applicables aux systèmes d'IA à haut risque",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Établir la documentation technique avant mise sur le marché",
      "Maintenir la documentation à jour",
      "Démontrer la conformité avec toutes les exigences",
      "Inclure tous les éléments de l'Annexe IV",
      "Fournir aux autorités sur demande"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["documentation", "technique", "conformité", "annexe IV", "traçabilité"],
    relatedArticles: ["Article 9", "Article 10", "Article 12", "Annexe IV"],
    annexReferences: ["Annexe IV"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 11"
  },
  {
    articleNumber: "Article 12",
    title: "Tenue de registres",
    content: "1. Les systèmes d'IA à haut risque sont conçus et développés avec des capacités permettant la tenue automatique de registres des événements (logs) pendant la durée de vie du système. 2. Afin de garantir un niveau de traçabilité approprié au regard de la finalité prévue du système d'IA à haut risque, les capacités de tenue de registres permettent la tenue de registres des événements pertinents pendant la durée de vie du système d'IA à haut risque.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Exigences applicables aux systèmes d'IA à haut risque",
    sectionNumber: "Section 2",
    sectionName: "Exigences applicables aux systèmes d'IA à haut risque",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Concevoir des capacités de logging automatique",
      "Enregistrer tous les événements pertinents",
      "Maintenir les logs pendant toute la durée de vie",
      "Garantir la traçabilité appropriée",
      "Permettre l'audit et l'investigation"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["logs", "traçabilité", "enregistrement", "événements", "audit"],
    relatedArticles: ["Article 11", "Article 13", "Article 72"],
    annexReferences: ["Annexe IV"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 12"
  },
  {
    articleNumber: "Article 13",
    title: "Transparence et fourniture d'informations aux utilisateurs déployeurs",
    content: "1. Les systèmes d'IA à haut risque sont conçus et développés de manière à garantir que leur fonctionnement est suffisamment transparent pour permettre aux utilisateurs déployeurs d'interpréter les résultats du système et de l'utiliser de manière appropriée. Un niveau approprié de transparence est assuré au moyen d'une notice d'utilisation pertinente conformément au paragraphe 2. 2. Les systèmes d'IA à haut risque sont accompagnés d'une notice d'utilisation dans un format numérique approprié ou autre qui comprend des informations concises, complètes, correctes et claires qui sont pertinentes, accessibles et compréhensibles pour les utilisateurs déployeurs.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Exigences applicables aux systèmes d'IA à haut risque",
    sectionNumber: "Section 2",
    sectionName: "Exigences applicables aux systèmes d'IA à haut risque",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Garantir la transparence du fonctionnement",
      "Permettre l'interprétation des résultats",
      "Fournir une notice d'utilisation complète",
      "Rendre les informations accessibles et compréhensibles",
      "Maintenir la documentation à jour"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["transparence", "notice d'utilisation", "interprétabilité", "documentation utilisateur"],
    relatedArticles: ["Article 11", "Article 12", "Article 52"],
    annexReferences: ["Annexe IV"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 13"
  },
  {
    articleNumber: "Article 14",
    title: "Surveillance humaine",
    content: "1. Les systèmes d'IA à haut risque sont conçus et développés de manière à pouvoir être effectivement supervisés par des personnes physiques pendant la période d'utilisation du système d'IA à haut risque. 2. La surveillance humaine vise à prévenir ou à réduire au minimum les risques pour la santé, la sécurité ou les droits fondamentaux qui peuvent apparaître lorsqu'un système d'IA à haut risque est utilisé conformément à sa finalité prévue ou dans des conditions de mauvaise utilisation raisonnablement prévisible.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Exigences applicables aux systèmes d'IA à haut risque",
    sectionNumber: "Section 2",
    sectionName: "Exigences applicables aux systèmes d'IA à haut risque",
    riskCategory: "high",
    applicableTo: ["providers", "deployers"],
    obligations: [
      "Concevoir pour permettre la supervision humaine",
      "Prévenir les risques pour santé/sécurité/droits fondamentaux",
      "Permettre l'intervention humaine",
      "Fournir des mécanismes de contrôle",
      "Former les superviseurs humains"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["surveillance humaine", "supervision", "human-in-the-loop", "contrôle", "intervention"],
    relatedArticles: ["Article 9", "Article 26", "Article 29"],
    annexReferences: [],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 14"
  },
  {
    articleNumber: "Article 15",
    title: "Exactitude, robustesse et cybersécurité",
    content: "1. Les systèmes d'IA à haut risque sont conçus et développés de manière à atteindre, compte tenu de leur finalité prévue, un niveau approprié d'exactitude, de robustesse et de cybersécurité, et à fonctionner de manière constante à ces égards pendant toute leur durée de vie. 2. Les niveaux d'exactitude et les indicateurs d'exactitude pertinents des systèmes d'IA à haut risque sont déclarés dans la notice d'utilisation qui les accompagne. 3. Les systèmes d'IA à haut risque sont résilients en ce qui concerne les erreurs, les défaillances ou les incohérences qui peuvent se produire dans le système ou l'environnement dans lequel le système fonctionne.",
    titleNumber: "TITRE III",
    titleName: "SYSTÈMES D'IA À HAUT RISQUE",
    chapterNumber: "Chapitre III",
    chapterName: "Exigences applicables aux systèmes d'IA à haut risque",
    sectionNumber: "Section 2",
    sectionName: "Exigences applicables aux systèmes d'IA à haut risque",
    riskCategory: "high",
    applicableTo: ["providers"],
    obligations: [
      "Atteindre un niveau approprié d'exactitude",
      "Garantir la robustesse du système",
      "Assurer la cybersécurité",
      "Déclarer les indicateurs d'exactitude",
      "Maintenir la performance pendant toute la durée de vie",
      "Être résilient aux erreurs et défaillances"
    ],
    effectiveDate: new Date('2026-08-02'),
    keywords: ["exactitude", "robustesse", "cybersécurité", "résilience", "performance"],
    relatedArticles: ["Article 9", "Article 13", "Article 72"],
    annexReferences: ["Annexe IV"],
    eurLexUrl: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
    officialReference: "Règlement (UE) 2024/1689, Article 15"
  },
  // Importer les articles additionnels
  ...additionalArticles
];

// Export des métadonnées pour navigation
export const aiActStructure = {
  titles: [
    { number: "TITRE I", name: "DISPOSITIONS GÉNÉRALES", articles: ["1", "2", "3", "4", "5"] },
    { number: "TITRE II", name: "PRATIQUES D'IA INTERDITES", articles: ["5"] },
    { number: "TITRE III", name: "SYSTÈMES D'IA À HAUT RISQUE", articles: ["6-51"] },
    { number: "TITRE IV", name: "OBLIGATIONS DE TRANSPARENCE POUR CERTAINS SYSTÈMES D'IA", articles: ["50-54"] },
    { number: "TITRE V", name: "MODÈLES D'IA À USAGE GÉNÉRAL", articles: ["51-56"] },
    { number: "TITRE VI", name: "MESURES À L'APPUI DE L'INNOVATION", articles: ["57-62"] },
    { number: "TITRE VII", name: "GOUVERNANCE", articles: ["63-84"] },
    { number: "TITRE VIII", name: "BASE DE DONNÉES DE L'UE POUR LES SYSTÈMES D'IA À HAUT RISQUE", articles: ["85"] },
    { number: "TITRE IX", name: "SURVEILLANCE APRÈS COMMERCIALISATION, PARTAGE D'INFORMATIONS, SURVEILLANCE DU MARCHÉ", articles: ["86-98"] },
    { number: "TITRE X", name: "CODES DE CONDUITE ET LIGNES DIRECTRICES", articles: ["95-96"] },
    { number: "TITRE XI", name: "DÉLÉGATION DE POUVOIR ET PROCÉDURE DE COMITÉ", articles: ["97"] },
    { number: "TITRE XII", name: "SANCTIONS", articles: ["99-101"] },
    { number: "TITRE XIII", name: "DISPOSITIONS FINALES", articles: ["102-113"] }
  ],
  totalArticles: 113,
  totalAnnexes: 13
};

