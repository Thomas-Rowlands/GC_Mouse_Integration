<?php
include_once 'database.php';
include_once 'utility.php';
include_once 'tree.php';
include_once 'mappings.php';

class Ontology
{

    /**
     * @var GC_Connection
     */
    private $con;
    /**
     * @var Neo_Connection
     */
    private $neo;

    public function __construct()
    {
        $this->con = new GC_Connection("gc_mouse");
        $this->neo = new Neo_Connection();
    }

    public function term_search($search, $ont): array
    {
        $cmd = "";
        $ont = strtolower($ont) == "mp" ? ["MP"] : ["MESH", "HPO"];
        foreach ($ont as $o) {
            $cmd .= "
                MATCH (n:$o)
                USING INDEX n:$o(lowerFSN)
                WHERE n.lowerFSN = {search} AND (n.hasMouseData = TRUE OR n.hasHumanData = TRUE)
                OPTIONAL MATCH (m)-[:HAS_SYNONYM]->(n)
                WITH n, m, COLLECT(DISTINCT n.FSN) AS synonyms
                RETURN COALESCE(m.id, n.id) AS id, COALESCE(m.ontology, n.ontology) AS ontology, COALESCE(m.FSN, n.FSN) AS FSN, 
                synonyms, COALESCE(m.hasExactMPMapping, n.hasExactMPMapping) AS hasExactMPMapping, COALESCE(m.hasExactMESHMapping, 
                n.hasExactMESHMapping) AS hasExactMESHMapping, COALESCE(m.hasInferredHPOMapping, 
                n.hasExactHPOMapping) AS hasExactHPOMapping, COALESCE(m.gwas_total, n.gwas_total) AS gwas_total, 
                COALESCE(m.experiment_total, n.experiment_total) AS experiment_total 
                LIMIT 1
     
                UNION";
        }
        foreach ($ont as $o) {
            $cmd .= "
                MATCH (n:$o)
                USING INDEX n:$o(lowerFSN)
                WHERE (n.lowerFSN STARTS WITH {search} OR n.lowerFSN CONTAINS {searchContains}) AND (n.hasMouseData = TRUE OR n.hasHumanData = TRUE)
                OPTIONAL MATCH (n)<-[:HAS_SYNONYM]-(m)
                WITH n, m, COLLECT(DISTINCT n.FSN) AS synonyms
                RETURN COALESCE(m.id, n.id) AS id, COALESCE(m.ontology, n.ontology) AS ontology, COALESCE(m.FSN, n.FSN) AS FSN, 
                synonyms, COALESCE(m.hasExactMPMapping, n.hasExactMPMapping) AS hasExactMPMapping, COALESCE(m.hasExactMESHMapping, 
                n.hasExactMESHMapping) AS hasExactMESHMapping, COALESCE(m.hasInferredHPOMapping, 
                n.hasExactHPOMapping) AS hasExactHPOMapping, COALESCE(m.gwas_total, n.gwas_total) AS gwas_total, 
                COALESCE(m.experiment_total, n.experiment_total) AS experiment_total 
                ";
            if ($o == "MESH")
                $cmd .= "UNION";
        }
        $result = $this->neo->execute($cmd, ["search" => $search, "searchContains" => " " . $search]);
        return $this->get_term_search_results($result, $search);
    }

    public function term_search_limited($search, $ont): array
    {
        $ont = strtoupper($ont);
        $dataFlag = $ont == "MP" ? "hasMouseData" : "hasHumanData";

        $result = $this->neo->execute("
            MATCH (n:$ont)
            USING INDEX n:$ont(lowerFSN)
            WHERE n.lowerFSN = {search}
            OPTIONAL MATCH (m)-[:HAS_SYNONYM]->(n)
            WHERE n.$dataFlag = TRUE OR m.$dataFlag = TRUE
            WITH n, m, COLLECT(DISTINCT n.FSN) AS synonyms
            RETURN COALESCE(m.id, n.id) AS id, COALESCE(m.ontology, n.ontology) AS ontology, COALESCE(m.FSN, n.FSN) AS FSN, 
            synonyms, COALESCE(m.hasExactMPMapping, n.hasExactMPMapping) AS hasExactMPMapping, COALESCE(m.hasExactMESHMapping, 
            n.hasExactMESHMapping) AS hasExactMESHMapping, COALESCE(m.hasInferredHPOMapping, 
            n.hasExactHPOMapping) AS hasExactHPOMapping, COALESCE(m.gwas_total, n.gwas_total) AS gwas_total, 
            COALESCE(m.experiment_total, n.experiment_total) AS experiment_total
            LIMIT 1
            
            UNION
            
            MATCH (n:$ont)
            USING INDEX n:$ont(lowerFSN)
            WHERE (n.lowerFSN STARTS WITH {search} OR n.lowerFSN CONTAINS {searchContains})
            OPTIONAL MATCH (n)<-[:HAS_SYNONYM]-(m)
            WHERE n.$dataFlag = TRUE OR m.$dataFlag = TRUE
            WITH n, m, COLLECT(DISTINCT n.FSN) AS synonyms
            RETURN COALESCE(m.id, n.id) AS id, COALESCE(m.ontology, n.ontology) AS ontology, 
            COALESCE(m.FSN, n.FSN) AS FSN, synonyms, COALESCE(m.hasExactMPMapping, n.hasExactMPMapping) AS hasExactMPMapping, 
            COALESCE(m.hasExactMESHMapping, n.hasExactMESHMapping) AS hasExactMESHMapping, 
            COALESCE(m.hasInferredHPOMapping, n.hasExactHPOMapping) AS hasExactHPOMapping, 
            COALESCE(m.gwas_total, n.gwas_total) AS gwas_total, 
            COALESCE(m.experiment_total, n.experiment_total) AS experiment_total LIMIT 1;
            ", ["search" => $search, "searchContains" => " " . $search]);
        return $this->get_term_search_results($result, $search);
    }

    public function exact_term_id_search($search): array
    {
        $result = $this->neo->execute("
            MATCH (syn)<-[:HAS_SYNONYM*0..1]-(ontTerm)
            WHERE ontTerm.id = {search}
            RETURN DISTINCT ontTerm.id AS id, ontTerm.ontology AS ontology, ontTerm.FSN AS FSN, 
            ontTerm.hasExactMPMapping AS hasExactMPMapping, ontTerm.hasExactMESHMapping AS hasExactMESHMapping, 
            ontTerm.hasExactHPOMapping AS hasExactHPOMapping, ontTerm.gwas_total AS gwas_total, 
            ontTerm.experiment_total AS experiment_total;
            ", ["search" => $search]);
        return $this->get_term_search_results($result, $search);
    }


    public function search_mouse_term($search, $mappingOnt, $is_exact_search = false, $isLimited = false): array
    {
        $matches = [];
        if ($is_exact_search) {
            if (str_contains($search, ","))
                $terms = explode(",", $search);
            else
                $terms = [$search];
            foreach ($terms as $term) {
                $matches = array_merge($matches, $this->exact_term_id_search($term));
            }
        } else {
            $search = strtolower($search);
            if (!$isLimited)
                $matches = array_merge($matches, $this->term_search($search, "MP"));
            else
                $matches = array_merge($matches, $this->term_search_limited($search, "MP"));
        }
        if (!$matches)
            return [];
        for ($i = 0; $i < sizeof($matches); $i++) {
            $mapping = null;
            if ($matches[$i]["hasExactMESHMapping"] || $matches[$i]["hasExactHPOMapping"])
                $mapping = $this->get_human_mapping_by_id($matches[$i]["id"], $mappingOnt);
            $matches[$i]["mappedID"] = null;
            $matches[$i]["mappedLabel"] = null;
            $matches[$i]["mappedSynonyms"] = null;
            $matches[$i]["mappedOnt"] = null;
            if ($mapping) {
                $matches = $this->get_mapping_result($mapping[0], $matches, $i);
                $matches[$i]["gwas"] = $mapping[0]["gwas"];
            }
        }
        return $matches;
    }

    public function search_human_term($search, $ontology, $is_exact_search = false, $isLimited = false): array
    {
        $matches = [];
        if ($is_exact_search) {
            if (str_contains($search, ","))
                $terms = explode(",", $search);
            else
                $terms = [$search];
            foreach ($terms as $term) {
                $matches = array_merge($matches, $this->exact_term_id_search($term));
            }
        } else {
            $search = strtolower($search);
            if (!$isLimited)
                $matches = array_merge($matches, $this->term_search($search, $ontology));
            else
                $matches = array_merge($matches, $this->term_search_limited($search, $ontology));
        }
        if (!$matches)
            return [];


        for ($i = 0; $i < sizeof($matches); $i++) {
            $mapping = null;
            if ($matches[$i]["hasExactMPMapping"])
                $mapping = $this->get_mp_mapping_by_id($matches[$i]["id"]);
            $matches[$i]["mappedID"] = null;
            $matches[$i]["mappedLabel"] = null;
            $matches[$i]["mappedSynonyms"] = null;
            $matches[$i]["mappedOnt"] = null;
            if ($mapping) {
                $matches = $this->get_mapping_result($mapping[0], $matches, $i);
                $matches[$i]["experiments"] = $mapping[0]["experiments"];
            }
        }
        return $matches;
    }

    public function get_mp_mapping_by_id($termID): array
    {
        $ont = str_contains($termID, "HP:") ? "HPO" : "MESH";
        $result = $this->neo->execute("
            OPTIONAL MATCH (n:$ont {id: '$termID'})-[:SPECIES_MAPPING {relation: 'EXACT'}]->(directTerm:MP)
            WHERE directTerm.hasMouseData = TRUE
            WITH directTerm
            OPTIONAL MATCH (n:$ont {id: '$termID'})<-[:ISA*0..]-(m {hasExactMPMapping: TRUE})
            WHERE m.hasMouseData = TRUE
            WITH m.rootLength AS length, directTerm
            ORDER BY length ASC
            LIMIT 1
            OPTIONAL MATCH (n:$ont {id: '$termID'})<-[:ISA*0..]-(m {rootLength: length})-[:SPECIES_MAPPING]-(o:MP)
            WHERE o.hasMouseData = TRUE
            WITH COALESCE(directTerm, o) AS o, directTerm

            OPTIONAL MATCH (o)-[:HAS_SYNONYM]->(mainTerm)
            WITH COALESCE(o, mainTerm) AS mainTerm
            OPTIONAL MATCH (o)<-[:HAS_SYNONYM]-(mainTerm)
            WITH COALESCE(mainTerm, o) AS mainTerm, o, COLLECT(DISTINCT o.FSN) AS mappedSyns
            WITH mainTerm, FILTER(x IN COLLECT(DISTINCT o.FSN) WHERE x <> mainTerm.FSN) AS mappedSyns
            
            OPTIONAL MATCH (humanSyn)-[:HAS_SYNONYM]->(humanTerm:$ont {id: '$termID'})
            WITH COALESCE(humanTerm, humanSyn) AS humanSyns, mainTerm, mappedSyns
            OPTIONAL MATCH (humanSyn)<-[:HAS_SYNONYM]-(humanTerm:$ont {id: '$termID'})
            WITH COALESCE(humanSyn, humanTerm) AS humanSyns, humanTerm, mainTerm, mappedSyns
            WITH humanTerm, FILTER(x IN COLLECT(DISTINCT humanSyns.FSN) WHERE x <> humanTerm.FSN) AS humanSyns, mainTerm, mappedSyns
            
            RETURN DISTINCT humanSyns, mainTerm.id AS mappedID, mainTerm.FSN AS mappedLabel, mainTerm.ontology AS mappedOnt, 
            mainTerm.experiment_total AS experiments, mappedSyns", []);
        $mappings = [];
        if ($result)
            foreach ($result as $row) {
                $record = ["mappedID" => $row->get("mappedID"), "synonyms"=>$row->get("humanSyns"), "mappedOnt" => "MP", "mappedLabel" => $row->get("mappedLabel"), "mappedSynonyms" => $row->get("mappedSyns"), "experiments" => $row->get("experiments")];
                $mappings[] = $record;
            }
        return $mappings;
    }

    public function get_human_mapping_by_id($termID, $targetOnt): array
    {
        $mappings = [];
        if (!$targetOnt)
            $targetOnt = ["MESH", "HPO"];
        else
            $targetOnt = [$targetOnt];
        foreach ($targetOnt as $ont) {
            $result = $this->neo->execute("
            OPTIONAL MATCH (n:MP {id: '$termID'})-[:SPECIES_MAPPING {relation: 'EXACT'}]->(directTerm:$ont)
            WHERE directTerm.hasHumanData = TRUE
            WITH directTerm
            OPTIONAL MATCH (n:MP {id: '$termID'})<-[:ISA*0..]-(m {hasExact".$ont."Mapping: TRUE})
            WHERE m.hasHumanData = TRUE
            WITH m.rootLength AS length, directTerm
            ORDER BY length ASC
            LIMIT 1
            OPTIONAL MATCH (n:MP {id: '$termID'})<-[:ISA*0..]-(m {rootLength: length})-[:SPECIES_MAPPING]-(o:$ont)
            WHERE o.hasHumanData = TRUE
            WITH COALESCE(directTerm, o) AS o, directTerm

            OPTIONAL MATCH (o)-[:HAS_SYNONYM]->(mainTerm)
            WITH COALESCE(o, mainTerm) AS mainTerm
            OPTIONAL MATCH (o)<-[:HAS_SYNONYM]-(mainTerm)
            WITH COALESCE(mainTerm, o) AS mainTerm, o, COLLECT(DISTINCT o.FSN) AS mappedSyns
            WITH mainTerm, FILTER(x IN COLLECT(DISTINCT o.FSN) WHERE x <> mainTerm.FSN) AS mappedSyns
            
            OPTIONAL MATCH (mouseSyn)-[:HAS_SYNONYM]->(mouseTerm:MP {id: '$termID'})
            WITH COALESCE(mouseTerm, mouseSyn) AS mouseSyns, mainTerm, mappedSyns
            OPTIONAL MATCH (mouseSyn)<-[:HAS_SYNONYM]-(mouseTerm:MP {id: '$termID'})
            WITH COALESCE(mouseSyn, mouseTerm) AS mouseSyns, mouseTerm, mainTerm, mappedSyns
            WITH mouseTerm, FILTER(x IN COLLECT(DISTINCT mouseSyns.FSN) WHERE x <> mouseTerm.FSN) AS mouseSyns, mainTerm, mappedSyns
            
            RETURN DISTINCT mouseSyns, mainTerm.id AS mappedID, mainTerm.FSN AS mappedLabel, mainTerm.ontology AS mappedOnt, 
            mainTerm.gwas_total AS gwas, mappedSyns", []);
            if ($result)
                foreach ($result as $row) {
                    $record = [
                        "mappedID" => $row->get("mappedID"), "synonyms"=> $row->get("mouseSyns"), "mappedLabel" => $row->get("mappedLabel"),
                        "mappedSynonyms" => $row->get("mappedSyns"), $row->get("mappedOnt"),
                        "gwas" => $row->get("gwas"), "mappedOnt" => $row->get("mappedOnt")
                    ];
                    $mappings[] = $record;
                }
        }
        return $mappings;
    }

    public function get_term_synonyms($termID, $ontology): ?array
    {
        if (!$ontology)
            return null;
        $ontology = strtoupper($ontology);
        $result = $this->neo->execute("MATCH (N:$ontology)-[r:HAS_SYNONYM]->(S)
            USING INDEX N:$ontology(id) 
            WHERE N.id = {termID} AND (S.gwas_total > 0 or S.experiment_total > 0) 
            RETURN DISTINCT ID(S) AS SynonymID, S.FSN AS Synonym;", ["termID" => $termID]);
        $synonyms = [];
        foreach ($result as $row) {
            $synonyms[] = $row->get("Synonym");
        }
        return $synonyms;
    }

    public function get_phenotype_name($termID, $ontology)
    {
        if (!$ontology || !$termID)
            return null;
        $ontology = strtoupper($ontology);
        $result = $this->neo->execute("MATCH (N:$ontology) 
            USING INDEX N:$ontology(id)
            WHERE N.id = {termID} AND (N.gwas_total > 0 or N.experiment_total > 0) 
            RETURN N.FSN AS phenotype", ["termID" => $termID]);
        $phenotype = null;
        foreach ($result as $row) {
            $phenotype = $row->get("phenotype");
        }
        return $phenotype;
    }

    public function get_root_ontology_tree($ontology): array
    {
        if ($ontology == "MP")
            $ontLabel = "MP";
        else
            $ontLabel = $ontology === "MESH" ? "MESH" : "HP";
        $result = [];
        if ($ontLabel == "MP") {
            $mouseOntTree = new OntologyTree("MP", "MP", null, true, $ontLabel);
            $result["tree"] = $mouseOntTree->getTree();
        } else {
            $humanOntTree = new OntologyTree($ontology, $ontLabel, null, true, "MP");
            $result["tree"] = $humanOntTree->getTree();
        }
        $result["ID"] = $result["tree"]->id;
        return $result;
    }

    public function get_term_descendants($termID, $ontology): array
    {
        $ontology = strtoupper($ontology);
        $result = $this->neo->execute("MATCH (n:$ontology)<-[:ISA*1..]-(m)
            WHERE n.id = {termID} AND m.isObsolete = 'false' AND (m.hasHumanData = TRUE or m.hasMouseData = TRUE)
            RETURN DISTINCT m.id AS descendant", ["termID" => $termID]);
        $descendants = [];
        foreach ($result as $row) {
            $descendants[] = $row->get("descendant");
        }
        return $descendants;
    }

    public function get_root_ontology_trees($ontology): ?array
    {
        $ontLabel = strtoupper($ontology) == "MESH" ? "MESH" : "HP";
        $result = ["isExactMatch" => False];
        $mouseOntTree = new OntologyTree("MP", "MP", null, true, $ontLabel);
        $humanOntTree = new OntologyTree($ontology, $ontLabel, null, true, "MP");

        $result["mouseTree"] = $mouseOntTree->getTree();
        $result["humanTree"] = $humanOntTree->getTree();
        $result["mouseID"] = $result["mouseTree"]->id;
        $result["humanID"] = $result["humanTree"]->id;
        if ($result)
            return $result;
        else
            return null;
    }

    public function get_ontology_trees($term, $humanOntology, $mouseOntology, $searchOntology, $isExactTerm = false): ?array
    {
        $humanOntLabel = $humanOntology == "MESH" ? "MESH" : "HP";
        $mouseID = "";
        $humanID = "";
        $mouseLabel = "";
        $humanLabel = "";
        if ($searchOntology == "MP") {
            $match = $this->search_mouse_term($term, $humanOntology, $isExactTerm, true);
        } else {
            $match = $this->search_human_term($term, $searchOntology, $isExactTerm, true);
        }
        if ($match) {
            if ($searchOntology == "MP") {
                $mouseID = $match[0]["id"];
                $mouseLabel = $match[0]["label"];
                if (key_exists("mappedID", $match[0])) {
                    $humanID = $match[0]["mappedID"];
                    $humanLabel = $match[0]["mappedLabel"];
                }
            } else {
                $humanID = $match[0]["id"];
                $humanLabel = $match[0]["label"];
                if (key_exists("mappedID", $match[0])) {
                    $mouseID = $match[0]["mappedID"];
                    $mouseLabel = $match[0]["mappedLabel"];
                }
            }

            $result = ["mouseTree" => [], "humanTree" => [], "mouseID" => "", "mouseLabel" => "", "humanID" => "", "humanLabel" => ""];

            if ($mouseID) {
                $tree = new OntologyTree($mouseOntology, $mouseOntology, $mouseID, false, $humanOntology);
                $result["mouseTree"] = $tree->getTree();
            }

            if ($humanID) {
                $tree = new OntologyTree($humanOntology, $humanOntLabel, $humanID, false, $mouseOntology);
                $result["humanTree"] = $tree->getTree();
            }
            if (!$humanID && !$mouseID)
                return null;

            $result["mouseID"] = $mouseID;
            $result["mouseLabel"] = $mouseLabel;
            $result["humanID"] = $humanID;
            $result["humanLabel"] = $humanLabel;

            if ($result["mouseTree"] || $result["humanTree"])
                return $result;
            else
                return null;
        }

        return null;
    }

    public function getTermChildren($termID, $ontLabel, $mappingOnt): array
    {
        $ontLabel = strtoupper($ontLabel);
        $mappingOnt = strtoupper($mappingOnt);
        $mappingProperty = $ontLabel == "MP" ? "hasExact" . $mappingOnt . "Mapping" : "hasExactMPMapping";
        $inferredMappingProperty = $ontLabel == "MP" ? "hasInferred" . $mappingOnt . "Mapping" : "hasInferredMPMapping";
        $children = $this->neo->execute("MATCH (n:$ontLabel)<-[:ISA]-(m)
            WHERE n.id = {termID} AND (m.hasHumanData = TRUE or m.hasMouseData = TRUE)
            RETURN n.id AS parentID, n.FSN AS parentLabel, m.id AS id, m.FSN AS label, 
            m.$mappingProperty AS hasExactMapping, m.$inferredMappingProperty AS hasInferredMapping, 
            m.hasChildrenWithData AS hasChildrenWithData, m.gwas_total AS gwas_total, 
            m.experiment_total AS experiment_total, m.hasHumanData AS hasHumanData, m.hasMouseData AS hasMouseData
            ORDER BY label ASC", ["termID" => $termID]);

        $return_package = [];
        foreach ($children as $child) {
            $hasExactMapping = false;
            $hasInferredMapping = false;
            if ($child->hasValue("hasExactMapping"))
                $hasExactMapping = $child->get('hasExactMapping');
            if ($child->hasValue("hasInferredMapping"))
                $hasInferredMapping = $child->get('hasInferredMapping');
            $hasHumanData = $child->value("hasHumanData");
            $hasMouseData = $child->value("hasMouseData");
            $hasData = $child->get("gwas_total") > 0 || $child->get("experiment_total") > 0;
            $childNode = new TreeNode(
                $child->get('id'),
                $child->get('label'),
                $hasExactMapping,
                $hasInferredMapping,
                $child->get('hasChildrenWithData'),
                $hasData,
                $hasHumanData,
                $hasMouseData
            );
            $return_package[$child->get('id')] = $childNode;
        }
        return $return_package;
    }

    /**
     * @param $result
     * @param $search
     * @return array
     */
    private function get_term_search_results($result, $search): array
    {
        $matches = [];
        foreach ($result as $row) {
            $termID = $row->get("id");
            $termOnt = $row->get("ontology");
            $label = $row->get("FSN");
            $parsed = ["id" => $termID, "synonyms" => $row->get("synonyms"), "label" => $label, "experiments" => $row->get("experiment_total"), "ont" => $termOnt, "gwas" => $row->get("gwas_total"), "hasExactMESHMapping" => $row->get("hasExactMESHMapping"), "hasExactHPOMapping" => $row->get("hasExactHPOMapping"), "hasExactMPMapping" => $row->get("hasExactMPMapping")];
            if (strtolower($label) == strtolower($search))
                array_unshift($matches, $parsed);
            else
                $matches[] = $parsed;
        }
        return $matches;
    }

    /**
     * @param $mapping
     * @param array $matches
     * @param int $i
     * @return array
     */
    private function get_mapping_result($mapping, array $matches, int $i): array
    {
        $matches[$i]["synonyms"] = $mapping["synonyms"];
        $matches[$i]["mappedID"] = $mapping["mappedID"];
        $matches[$i]["mappedLabel"] = $mapping["mappedLabel"];
        $matches[$i]["mappedSynonyms"] = $mapping["mappedSynonyms"];
        $matches[$i]["mappedOnt"] = $mapping["mappedOnt"];
        return $matches;
    }

    public function get_inferred_mappings($termID, $sourceOnt, $searchOnt): array
    {
        $sourceOnt = strtoupper($sourceOnt);
        $searchOnt = strtoupper($searchOnt);
        if (!$searchOnt)
            $searchOnt = ["MESH", "HPO"];
        else
            $searchOnt = [$searchOnt];
        $return_package = [];
        foreach ($searchOnt as $ont) {
            $dataFlag = $ont == "MP" ? "m.hasMouseData" : "m.hasHumanData";
            $results = $this->neo->execute("MATCH (n:$sourceOnt{id: '$termID'})<-[:ISA*1..]-()-[:SPECIES_MAPPING]-(m:$ont)
                USING INDEX n:$sourceOnt(id)
                WHERE $dataFlag = TRUE
                RETURN DISTINCT m.id AS termID
                UNION
                MATCH (n:$sourceOnt{id: '$termID'})-[:SPECIES_MAPPING]-(m:$ont)
                USING INDEX n:$sourceOnt(id)
                WHERE $dataFlag = TRUE
                RETURN DISTINCT m.id AS termID
                ", []);

            foreach ($results as $result) {
                $return_package[] = $result->get("termID");
            }
        }

        return $return_package;
    }
}
